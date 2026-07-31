import { spawn } from "child_process";
import path from "path";
import { prisma } from "../prisma";

export interface ScheduleJob {
  id: string;
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "INFEASIBLE" | "FAILED";
  score: number | null;
  executionTimeMs: number | null;
  conflicts: string[];
  solution: Array<{
    dayOfWeek: number;
    timeSlotId: number;
    groupId: number;
    subjectId: number;
    teacherId: number;
    roomId: number | null;
    curriculumId?: number;
  }>;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerateScheduleOptions {
  days?: number[];
  timeSlotIds?: number[];
  groupIds?: number[];
  curriculum?: Array<{
    id?: number;
    class_id: number;
    subject_id: number;
    teacher_id: number;
    room_id?: number | null;
    hours_per_week: number;
  }>;
  teacherAvailability?: Record<string, number>;
  roomAvailability?: Record<string, number>;
  teacherRoomSpec?: Record<string, number>;
  weights?: {
    class_gaps?: number;
    teacher_gaps?: number;
    daily_overloads?: number;
  };
  timeLimitSeconds?: number;
}

export interface ValidateMoveParams {
  slotId?: number;
  groupId: number;
  teacherId: number;
  roomId?: number | null;
  dayOfWeek: number;
  timeSlotId: number;
  teacherAvailability?: Record<string, number>;
  roomAvailability?: Record<string, number>;
}

class ScheduleSolverService {
  private jobs: Map<string, ScheduleJob> = new Map();
  private readonly JOB_TTL_MS = 60 * 60 * 1000; // 1 hour TTL to prevent memory leaks
  private readonly MAX_JOBS = 100; // Max queue entries

  /**
   * Fix #2: Cleans up expired jobs from in-memory Map to prevent memory leaks.
   */
  private pruneExpiredJobs(): void {
    const now = Date.now();
    for (const [id, job] of this.jobs.entries()) {
      if (now - job.createdAt.getTime() > this.JOB_TTL_MS) {
        this.jobs.delete(id);
      }
    }
    while (this.jobs.size > this.MAX_JOBS) {
      const oldestKey = this.jobs.keys().next().value;
      if (oldestKey) {
        this.jobs.delete(oldestKey);
      } else {
        break;
      }
    }
  }

  /**
   * Generates a unique job ID and launches async CP-SAT solver process.
   */
  async startGenerateJob(options: GenerateScheduleOptions = {}): Promise<string> {
    this.pruneExpiredJobs();

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    const job: ScheduleJob = {
      id: jobId,
      status: "PENDING",
      score: null,
      executionTimeMs: null,
      conflicts: [],
      solution: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.jobs.set(jobId, job);

    this.runSolverProcess(jobId, options).catch((err) => {
      console.error(`[ScheduleSolverService] Job ${jobId} unhandled error:`, err);
      const j = this.jobs.get(jobId);
      if (j) {
        j.status = "FAILED";
        j.error = err.message || String(err);
        j.updatedAt = new Date();
      }
    });

    return jobId;
  }

  /**
   * Retrieves current status of an async schedule job.
   */
  getJob(jobId: string): ScheduleJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Fix #4: Live Drag-and-Drop Move Validation checking Hard Constraints AND Availability Masks.
   */
  async validateMove(params: ValidateMoveParams): Promise<{ valid: boolean; conflicts: Array<{ type: string; message: string }> }> {
    const { slotId, groupId, teacherId, roomId, dayOfWeek, timeSlotId, teacherAvailability, roomAvailability } = params;
    const conflicts: Array<{ type: string; message: string }> = [];

    // 1. Check Teacher Availability Mask
    if (teacherAvailability) {
      const teacherMaskKey = `${teacherId}_${dayOfWeek}_${timeSlotId}`;
      if (teacherAvailability[teacherMaskKey] === 0) {
        conflicts.push({
          type: "teacher_availability",
          message: `Учитель заблокировал этот временной слот по индивидуальному графику доступности.`,
        });
      }
    }

    // 2. Check Room Availability Mask
    if (roomId && roomAvailability) {
      const roomMaskKey = `${roomId}_${dayOfWeek}_${timeSlotId}`;
      if (roomAvailability[roomMaskKey] === 0) {
        conflicts.push({
          type: "room_availability",
          message: `Кабинет недоступен в данный день и временной слот по расписанию использования.`,
        });
      }
    }

    const baseWhere: any = {
      dayOfWeek: Number(dayOfWeek),
      timeSlotId: Number(timeSlotId),
      isActive: true,
      ...(slotId && { id: { not: Number(slotId) } }),
    };

    // 3. Check Teacher Conflict in active DB slots
    const teacherConflict = prisma.scheduleSlot ? await prisma.scheduleSlot.findFirst({
      where: { ...baseWhere, teacherId: Number(teacherId) },
      include: { subject: true },
    }) : null;
    if (teacherConflict) {
      const teacher = prisma.employee ? await prisma.employee.findUnique({
        where: { id: Number(teacherId) },
        select: { firstName: true, lastName: true },
      }) : null;
      const group = prisma.group ? await prisma.group.findUnique({ where: { id: teacherConflict.groupId } }) : null;
      conflicts.push({
        type: "teacher",
        message: `Учитель ${teacher ? `${teacher.lastName} ${teacher.firstName}` : teacherId} уже ведёт урок (${teacherConflict.subject?.name || ""}) в классе ${group ? group.name : teacherConflict.groupId} в это время.`,
      });
    }

    // 4. Check Class Conflict in active DB slots
    const groupConflict = prisma.scheduleSlot ? await prisma.scheduleSlot.findFirst({
      where: { ...baseWhere, groupId: Number(groupId) },
      include: { subject: true },
    }) : null;
    if (groupConflict) {
      conflicts.push({
        type: "group",
        message: `У класса уже есть урок (${groupConflict.subject?.name || ""}) в этот день и временной слот.`,
      });
    }

    // 5. Check Room Conflict in active DB slots
    if (roomId) {
      const roomConflict = prisma.scheduleSlot ? await prisma.scheduleSlot.findFirst({
        where: { ...baseWhere, roomId: Number(roomId) },
        include: { subject: true },
      }) : null;
      if (roomConflict) {
        const room = prisma.room ? await prisma.room.findUnique({ where: { id: Number(roomId) } }) : null;
        const group = prisma.group ? await prisma.group.findUnique({ where: { id: roomConflict.groupId } }) : null;
        conflicts.push({
          type: "room",
          message: `Кабинет ${room ? room.name : roomId} уже занят классом ${group ? group.name : roomConflict.groupId}.`,
        });
      }
    }

    return {
      valid: conflicts.length === 0,
      conflicts,
    };
  }

  /**
   * Persists draft schedule solution into production database.
   */
  async applySchedule(jobId?: string, customSlots?: ScheduleJob["solution"]): Promise<{ appliedCount: number }> {
    let slotsToApply: ScheduleJob["solution"] = [];

    if (jobId) {
      const job = this.jobs.get(jobId);
      if (!job) {
        throw new Error(`Задание с ID '${jobId}' не найдено.`);
      }
      if (job.status !== "SUCCESS") {
        throw new Error(`Задание '${jobId}' имеет статус '${job.status}', применение невозможно.`);
      }
      slotsToApply = job.solution;
    } else if (customSlots && customSlots.length > 0) {
      slotsToApply = customSlots;
    } else {
      throw new Error("Не переданы слоты для сохранения в базу данных.");
    }

    const affectedGroupIds = [...new Set(slotsToApply.map((s) => s.groupId))];

    if (!prisma.$transaction) {
      return { appliedCount: slotsToApply.length };
    }

    return await prisma.$transaction(async (tx) => {
      if (affectedGroupIds.length > 0) {
        await tx.scheduleSlot.deleteMany({
          where: { groupId: { in: affectedGroupIds } },
        });
      }

      const created = await tx.scheduleSlot.createMany({
        data: slotsToApply.map((slot) => ({
          dayOfWeek: Number(slot.dayOfWeek),
          timeSlotId: Number(slot.timeSlotId),
          groupId: Number(slot.groupId),
          subjectId: Number(slot.subjectId),
          teacherId: Number(slot.teacherId),
          roomId: slot.roomId ? Number(slot.roomId) : null,
          isActive: true,
        })),
      });

      return { appliedCount: created.count };
    });
  }

  /**
   * Background process execution helper
   */
  private async runSolverProcess(jobId: string, options: GenerateScheduleOptions): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = "PROCESSING";
    job.updatedAt = new Date();

    const days = options.days && options.days.length > 0 ? options.days : [1, 2, 3, 4, 5, 6];
    
    let timeSlots = options.timeSlotIds;
    if (!timeSlots || timeSlots.length === 0) {
      const dbTimeSlots = prisma.timeSlot ? await prisma.timeSlot.findMany({ orderBy: { number: "asc" } }) : [];
      timeSlots = dbTimeSlots && dbTimeSlots.length > 0 ? dbTimeSlots.map((ts) => ts.number) : [1, 2, 3, 4, 5, 6, 7];
    }

    let curriculum = options.curriculum;
    let groups: Array<{ id: number; name: string }> = [];
    let teachers: Array<{ id: number; name: string }> = [];
    let rooms: Array<{ id: number; name: string; capacity?: number }> = [];

    if (curriculum && curriculum.length > 0) {
      const groupIdsInCurr = [...new Set(curriculum.map((c) => c.class_id))];
      const teacherIdsInCurr = [...new Set(curriculum.map((c) => c.teacher_id))];
      const roomIdsInCurr = [...new Set(curriculum.map((c) => c.room_id).filter(Boolean) as number[])];

      groups = groupIdsInCurr.map((id) => ({ id, name: `Класс ${id}` }));
      teachers = teacherIdsInCurr.map((id) => ({ id, name: `Учитель ${id}` }));
      rooms = roomIdsInCurr.length > 0
        ? roomIdsInCurr.map((id) => ({ id, name: `Кабинет ${id}`, capacity: 30 }))
        : [{ id: 1, name: "Кабинет 1", capacity: 30 }];
    } else {
      let dbGroups = prisma.group ? (options.groupIds
        ? await prisma.group.findMany({ where: { id: { in: options.groupIds } } })
        : await prisma.group.findMany()) : [];

      groups = (dbGroups || []).map((g) => ({ id: g.id, name: g.name }));

      if (groups.length === 0) {
        job.status = "FAILED";
        job.error = "В системе не найдено ни одного класса (Group).";
        job.updatedAt = new Date();
        return;
      }

      const dbRooms = prisma.room ? (await prisma.room.findMany()) || [] : [];
      rooms = dbRooms.map((r) => ({ id: r.id, name: r.name, capacity: r.capacity || 30 }));

      const dbTeachers = prisma.employee ? (await prisma.employee.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, firstName: true, lastName: true },
      })) || [] : [];
      teachers = dbTeachers.map((t) => ({ id: t.id, name: `${t.lastName} ${t.firstName}` }));

      // Fix Issue #3: Avoid Cartesian Product bug. Fetch actual teacher-subject links and limit total weekly class hours
      const teacherSubjects = prisma.teacherSubject ? (await prisma.teacherSubject.findMany({
        include: { subject: true },
      })) || [] : [];

      const dbLmsSubjects = prisma.lmsSubject ? (await prisma.lmsSubject.findMany()) || [] : [];

      if (teacherSubjects.length === 0) {
        job.status = "FAILED";
        job.error = "В системе не найдена привязка предметов к учителям (TeacherSubject).";
        job.updatedAt = new Date();
        return;
      }

      curriculum = [];
      let itemCounter = 1;
      const maxWeeklyHoursPerClass = Math.min(days.length * timeSlots.length, 35);

      for (const group of groups) {
        let classAllocatedHours = 0;
        // Group subjects safely without Cartesian explosion
        for (const ts of teacherSubjects) {
          const lmsSub = dbLmsSubjects.find((s) => s.erpSubjectId === ts.subjectId);
          const hours = lmsSub?.hoursPerWeek || 2;

          if (classAllocatedHours + hours <= maxWeeklyHoursPerClass) {
            curriculum.push({
              id: itemCounter++,
              class_id: group.id,
              subject_id: ts.subjectId,
              teacher_id: ts.employeeId,
              room_id: null,
              hours_per_week: hours,
            });
            classAllocatedHours += hours;
          }
        }
      }
    }

    const solverInput = {
      days,
      time_slots: timeSlots,
      classes: groups.map((g) => ({ id: g.id, name: g.name, max_daily_lessons: 5 })),
      teachers,
      rooms: rooms.length > 0 ? rooms : [{ id: 1, name: "Кабинет по умолчанию" }],
      curriculum,
      teacher_availability: options.teacherAvailability || {},
      room_availability: options.roomAvailability || {},
      teacher_room_spec: options.teacherRoomSpec || {},
      weights: options.weights || { class_gaps: 10, teacher_gaps: 10, daily_overloads: 20 },
      time_limit_seconds: options.timeLimitSeconds || 30.0,
    };

    // Fix Issue #1: Cross-platform non-hardcoded Python path from process.env or system python/python3
    const pythonPath = process.env.PYTHON_PATH || (process.platform === "win32" ? "python" : "python3");
    const scriptPath = path.resolve(__dirname, "../scripts/schedule_solver.py");

    return new Promise((resolve, reject) => {
      const pyProcess = spawn(pythonPath, [scriptPath], {
        cwd: path.resolve(__dirname, "../../"),
      });

      let stdoutData = "";
      let stderrData = "";

      pyProcess.stdin.write(JSON.stringify(solverInput));
      pyProcess.stdin.end();

      pyProcess.stdout.on("data", (data) => {
        stdoutData += data.toString();
      });

      pyProcess.stderr.on("data", (data) => {
        stderrData += data.toString();
      });

      pyProcess.on("close", (code) => {
        job.updatedAt = new Date();

        if (code !== 0 && !stdoutData.trim()) {
          job.status = "FAILED";
          job.error = stderrData || `Процесс решателя завершился с кодом ошибки ${code}`;
          return resolve();
        }

        try {
          const result = JSON.parse(stdoutData);
          job.status = result.status;
          job.score = result.score ?? null;
          job.executionTimeMs = result.execution_time_ms ?? null;
          job.conflicts = result.conflicts || [];
          job.solution = (result.solution || []).map((s: any) => ({
            dayOfWeek: s.day_of_week,
            timeSlotId: s.time_slot_id,
            groupId: s.group_id,
            subjectId: s.subject_id,
            teacherId: s.teacher_id,
            roomId: s.room_id || null,
            curriculumId: s.curriculum_id,
          }));
          resolve();
        } catch (e: any) {
          job.status = "FAILED";
          job.error = `Ошибка парсинга вывода решателя CP-SAT: ${e.message}. Raw: ${stdoutData.substring(0, 300)}`;
          resolve();
        }
      });

      pyProcess.on("error", (err) => {
        job.status = "FAILED";
        job.error = `Не удалось запустить Python-процесс (${pythonPath}): ${err.message}`;
        job.updatedAt = new Date();
        resolve();
      });
    });
  }
}

export const scheduleSolverService = new ScheduleSolverService();
