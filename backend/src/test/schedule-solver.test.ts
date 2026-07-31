import { describe, it, expect } from "vitest";
import { scheduleSolverService } from "../services/ScheduleSolverService";
import { execSync } from "child_process";
import path from "path";

describe("Automated Timetable Generation Engine (CP-SAT Solver) Bug Fix Verifications", () => {
  it("Fix #1 & #5: should execute Python CP-SAT solver self-test with virtual rooms cleanly", () => {
    const scriptPath = path.resolve(__dirname, "../scripts/schedule_solver.py");
    const pythonCmd = process.env.PYTHON_PATH || (process.platform === "win32" ? "python" : "python3");

    const output = execSync(`"${pythonCmd}" "${scriptPath}" --test`, {
      encoding: "utf-8",
    });

    expect(output).toContain("CP-SAT Solver Self-Test Passed Cleanly!");
  });

  it("Fix #2: should create and complete async solver job with TTL pruning", async () => {
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
    while (attempts < 20) {
      const job = scheduleSolverService.getJob(jobId);
      if (job && (job.status === "SUCCESS" || job.status === "FAILED" || job.status === "INFEASIBLE")) {
        expect(job.status).toBe("SUCCESS");
        expect(job.solution.length).toBe(6);
        expect(job.executionTimeMs).toBeGreaterThan(0);
        break;
      }
      await new Promise((r) => setTimeout(r, 200));
      attempts++;
    }
  });

  it("Fix #4: should perform mask-aware live move validation for teacher and room unavailability", async () => {
    // Valid move test
    const validRes = await scheduleSolverService.validateMove({
      groupId: 1,
      teacherId: 100,
      roomId: 201,
      dayOfWeek: 1,
      timeSlotId: 1,
    });
    expect(validRes.valid).toBe(true);

    // Blocked teacher test via teacherAvailability mask
    const blockedTeacherRes = await scheduleSolverService.validateMove({
      groupId: 1,
      teacherId: 100,
      roomId: 201,
      dayOfWeek: 1,
      timeSlotId: 1,
      teacherAvailability: { "100_1_1": 0 },
    });
    expect(blockedTeacherRes.valid).toBe(false);
    expect(blockedTeacherRes.conflicts[0].type).toBe("teacher_availability");

    // Blocked room test via roomAvailability mask
    const blockedRoomRes = await scheduleSolverService.validateMove({
      groupId: 1,
      teacherId: 100,
      roomId: 201,
      dayOfWeek: 1,
      timeSlotId: 1,
      roomAvailability: { "201_1_1": 0 },
    });
    expect(blockedRoomRes.valid).toBe(false);
    expect(blockedRoomRes.conflicts[0].type).toBe("room_availability");
  });
});
