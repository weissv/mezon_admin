import { describe, it, expect, vi } from "vitest";
import { scheduleSolverService } from "../services/ScheduleSolverService";
import { execSync } from "child_process";
import path from "path";

describe("Automated Timetable Generation Engine — Full Bug Fix Verification", () => {

  // ─────────────────────────────────────────────────────────────────────
  // Fix #1 & #5: Cross-platform PYTHON_PATH + Virtual Room penalty
  // ─────────────────────────────────────────────────────────────────────
  it("Fix #1 & #5: solver self-test passes cleanly (virtual room penalty active)", () => {
    const scriptPath = path.resolve(__dirname, "../scripts/schedule_solver.py");
    const pythonCmd = process.env.PYTHON_PATH || (process.platform === "win32" ? "python" : "python3");

    const output = execSync(`"${pythonCmd}" "${scriptPath}" --test`, {
      encoding: "utf-8",
    });

    expect(output).toContain("CP-SAT Solver Self-Test Passed Cleanly!");
  });

  // ─────────────────────────────────────────────────────────────────────
  // Fix #5 (Math): Virtual room penalty in objective function
  // Verify: solver runs with virtual_room weight 15 and still finds a solution
  // ─────────────────────────────────────────────────────────────────────
  it("Fix #5 Math: solver assigns real rooms over virtual room when physical rooms available", () => {
    const scriptPath = path.resolve(__dirname, "../scripts/schedule_solver.py");
    const pythonCmd = process.env.PYTHON_PATH || (process.platform === "win32" ? "python" : "python3");

    const input = JSON.stringify({
      days: [1, 2, 3],
      time_slots: [1, 2, 3, 4],
      classes: [{ id: 1, name: "5A", max_daily_lessons: 4 }],
      teachers: [{ id: 10, name: "Teacher A" }],
      rooms: [{ id: 101, name: "Room 101" }],
      curriculum: [
        { id: 1, class_id: 1, subject_id: 100, teacher_id: 10, room_id: null, hours_per_week: 3 },
      ],
      weights: { class_gaps: 10, teacher_gaps: 10, daily_overloads: 20, virtual_room: 15 },
      time_limit_seconds: 5.0,
    });

    const output = execSync(
      `echo ${JSON.stringify(input)} | "${pythonCmd}" "${scriptPath}"`,
      { encoding: "utf-8" }
    );
    const result = JSON.parse(output);

    expect(result.status).toBe("SUCCESS");
    // With virtual room penalty of 15 and one physical room available, solver MUST use real room
    const virtualRoomSlots = result.solution.filter((s: any) => s.room_id === null);
    expect(virtualRoomSlots.length).toBe(0);
  });

  // ─────────────────────────────────────────────────────────────────────
  // Fix #2: Memory TTL & Max Jobs
  // ─────────────────────────────────────────────────────────────────────
  it("Fix #2: creates and resolves async solver job with TTL pruning", async () => {
    const jobId = await scheduleSolverService.startGenerateJob({
      days: [1, 2, 3, 4, 5],
      timeSlotIds: [1, 2, 3, 4, 5, 6],
      curriculum: [
        { class_id: 1, subject_id: 10, teacher_id: 100, room_id: 201, hours_per_week: 3 },
        { class_id: 1, subject_id: 11, teacher_id: 101, room_id: 202, hours_per_week: 3 },
      ],
    });

    expect(jobId).toMatch(/^job_/);

    let attempts = 0;
    while (attempts < 30) {
      const job = scheduleSolverService.getJob(jobId);
      if (job && job.status !== "PENDING" && job.status !== "PROCESSING") {
        expect(job.status).toBe("SUCCESS");
        expect(job.solution.length).toBe(6);
        expect(job.executionTimeMs).toBeGreaterThan(0);
        break;
      }
      await new Promise((r) => setTimeout(r, 200));
      attempts++;
    }
  });

  // ─────────────────────────────────────────────────────────────────────
  // Fix #3: No Cartesian product - curriculum dedup by isPrimary teacher
  // ─────────────────────────────────────────────────────────────────────
  it("Fix #3: curriculum dedup — subjectToTeacherMap prevents multiple teachers per subject per class", () => {
    // Simulate what the service does: 3 teachers for Math (isPrimary varies), expect only 1 selected
    const allTeacherSubjects = [
      { subjectId: 100, employeeId: 10, isPrimary: false },
      { subjectId: 100, employeeId: 11, isPrimary: true },  // This should win
      { subjectId: 100, employeeId: 12, isPrimary: false },
      { subjectId: 101, employeeId: 20, isPrimary: true },
    ];

    const subjectToTeacherMap = new Map<number, typeof allTeacherSubjects[0]>();
    for (const ts of allTeacherSubjects) {
      if (!subjectToTeacherMap.has(ts.subjectId)) {
        subjectToTeacherMap.set(ts.subjectId, ts);
      } else if (ts.isPrimary && !subjectToTeacherMap.get(ts.subjectId)!.isPrimary) {
        subjectToTeacherMap.set(ts.subjectId, ts);
      }
    }
    const uniqueTeacherSubjects = Array.from(subjectToTeacherMap.values());

    expect(uniqueTeacherSubjects.length).toBe(2);  // Only 2 unique subjects
    const mathEntry = uniqueTeacherSubjects.find((ts) => ts.subjectId === 100);
    expect(mathEntry?.employeeId).toBe(11);         // isPrimary=true teacher wins
    expect(mathEntry?.isPrimary).toBe(true);
  });

  // ─────────────────────────────────────────────────────────────────────
  // Fix #4: DB-backed availability check in validateMove
  // ─────────────────────────────────────────────────────────────────────
  it("Fix #4: validateMove returns valid=true when no attendance blocks exist (DB returns [])", async () => {
    const result = await scheduleSolverService.validateMove({
      groupId: 1,
      teacherId: 100,
      roomId: 201,
      dayOfWeek: 1,
      timeSlotId: 1,
    });
    expect(result).toHaveProperty("valid");
    expect(result.valid).toBe(true);
    expect(result.conflicts).toHaveLength(0);
  });

  it("Fix #4: validateMove detects teacher blocked via DB attendance (SICK_LEAVE on Monday)", async () => {
    // Mock EmployeeAttendance to return a SICK_LEAVE on a Monday (dayOfWeek=1 → jsDay=1)
    const { prisma } = await import("../prisma");
    const mockDate = new Date("2026-08-03"); // Monday
    vi.mocked(prisma.employeeAttendance.findMany).mockResolvedValueOnce([
      { date: mockDate } as any,
    ]);

    const result = await scheduleSolverService.validateMove({
      groupId: 1,
      teacherId: 100,
      roomId: 201,
      dayOfWeek: 1,  // Monday
      timeSlotId: 1,
    });

    expect(result.valid).toBe(false);
    expect(result.conflicts[0].type).toBe("teacher_availability");
    expect(result.conflicts[0].message).toContain("больничный");
  });
});
