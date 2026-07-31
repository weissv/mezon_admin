#!/usr/bin/env python3
"""
Automated Timetable Generation Engine using Google OR-Tools CP-SAT Solver.
Mezon ERP Engine.
"""

import sys
import json
import time
import argparse
from typing import Dict, List, Any
from ortools.sat.python import cp_model

def solve_schedule(input_data: Dict[str, Any]) -> Dict[str, Any]:
    start_time = time.time()
    
    # ----------------------------------------------------
    # 1. Parse Input Parameters
    # ----------------------------------------------------
    days = input_data.get("days", [1, 2, 3, 4, 5, 6])  # 1..6 (Mon..Sat)
    time_slots = input_data.get("time_slots", [1, 2, 3, 4, 5, 6, 7])  # Slot numbers 1..7
    classes = input_data.get("classes", [])  # [{"id": 1, "name": "1A", "max_daily_lessons": 5}]
    teachers = input_data.get("teachers", [])  # [{"id": 10, "name": "Teacher Name"}]
    input_rooms = input_data.get("rooms", [])  # [{"id": 101, "name": "Room 101"}]
    curriculum = input_data.get("curriculum", [])  # [{"id": 1, "class_id": 1, "subject_id": 10, "teacher_id": 2, "room_id": 101, "hours_per_week": 4}]
    
    teacher_availability = input_data.get("teacher_availability", {})  # "teacherId_day_slot": 0 or 1
    room_availability = input_data.get("room_availability", {})        # "roomId_day_slot": 0 or 1
    teacher_room_spec = input_data.get("teacher_room_spec", {})        # "teacherId_roomId": 0 or 1
    
    weights = input_data.get("weights", {
        "class_gaps": 10,
        "teacher_gaps": 10,
        "daily_overloads": 20
    })
    time_limit_seconds = float(input_data.get("time_limit_seconds", 30.0))

    # Fix Issue #5: Ensure Virtual Room (id: 0) exists for general unassigned lessons to prevent room shortage INFEASIBLE crashes
    virtual_room = {"id": 0, "name": "Без кабинета"}
    rooms = [r for r in input_rooms if r["id"] != 0]
    all_rooms = rooms + [virtual_room]

    # Build Quick Lookup Maps
    class_map = {c["id"]: c for c in classes}
    teacher_map = {t["id"]: t for t in teachers}
    room_map = {r["id"]: r for r in all_rooms}
    
    total_weekly_slots = len(days) * len(time_slots)

    # ----------------------------------------------------
    # 2. Pre-Solve Infeasibility Diagnostic Check
    # ----------------------------------------------------
    conflicts = []
    
    # Teacher Capacity Check
    teacher_req_hours: Dict[int, int] = {}
    class_req_hours: Dict[int, int] = {}
    room_req_hours: Dict[int, int] = {}

    for item in curriculum:
        c_id = item["class_id"]
        t_id = item["teacher_id"]
        r_id = item.get("room_id")
        hpw = item.get("hours_per_week", 1)

        teacher_req_hours[t_id] = teacher_req_hours.get(t_id, 0) + hpw
        class_req_hours[c_id] = class_req_hours.get(c_id, 0) + hpw
        if r_id and r_id != 0:
            room_req_hours[r_id] = room_req_hours.get(r_id, 0) + hpw

    for t_id, req_h in teacher_req_hours.items():
        avail_count = 0
        for d in days:
            for ts in time_slots:
                mask_key = f"{t_id}_{d}_{ts}"
                if teacher_availability.get(mask_key, 1) == 1:
                    avail_count += 1
        if req_h > avail_count:
            t_name = teacher_map.get(t_id, {}).get("name", f"ID {t_id}")
            conflicts.append(f"Учитель '{t_name}' имеет недостаточно доступных слотов ({avail_count}) для требуемой нагрузки ({req_h} ч).")

    for c_id, req_h in class_req_hours.items():
        if req_h > total_weekly_slots:
            c_name = class_map.get(c_id, {}).get("name", f"ID {c_id}")
            conflicts.append(f"У класса '{c_name}' недельная нагрузка ({req_h} ч) превышает общее кол-во слотов ({total_weekly_slots}).")

    for r_id, req_h in room_req_hours.items():
        avail_count = 0
        for d in days:
            for ts in time_slots:
                mask_key = f"{r_id}_{d}_{ts}"
                if room_availability.get(mask_key, 1) == 1:
                    avail_count += 1
        if req_h > avail_count:
            r_name = room_map.get(r_id, {}).get("name", f"ID {r_id}")
            conflicts.append(f"Кабинет '{r_name}' имеет недостаточно доступных слотов ({avail_count}) для требуемых уроков ({req_h} ч).")

    if conflicts:
        return {
            "status": "INFEASIBLE",
            "score": None,
            "execution_time_ms": int((time.time() - start_time) * 1000),
            "conflicts": conflicts,
            "solution": []
        }

    # ----------------------------------------------------
    # 3. Model & Decision Variable Creation
    # ----------------------------------------------------
    model = cp_model.CpModel()

    # Decision Tensor: x[curr_idx, d, ts, r_id] -> 0 or 1
    x = {}
    
    for idx, item in enumerate(curriculum):
        t_id = item["teacher_id"]
        specified_room_id = item.get("room_id")
        
        # If specific room requested, use it; otherwise allow any physical room OR virtual room 0
        if specified_room_id and specified_room_id != 0:
            target_rooms = [specified_room_id]
        else:
            target_rooms = [r["id"] for r in all_rooms]

        for d in days:
            for ts in time_slots:
                # Check teacher availability mask
                if teacher_availability.get(f"{t_id}_{d}_{ts}", 1) == 0:
                    continue

                for r_id in target_rooms:
                    # Virtual room 0 ignores availability masks
                    if r_id != 0 and room_availability.get(f"{r_id}_{d}_{ts}", 1) == 0:
                        continue
                    
                    # Virtual room 0 ignores specialization mask
                    if r_id != 0 and teacher_room_spec and teacher_room_spec.get(f"{t_id}_{r_id}", 1) == 0:
                        continue

                    x[(idx, d, ts, r_id)] = model.NewBoolVar(f"x_{idx}_{d}_{ts}_{r_id}")

    # Auxiliary variables: Class Occupation u[d, ts, c_id]
    u = {}
    for c in classes:
        c_id = c["id"]
        for d in days:
            for ts in time_slots:
                u[(d, ts, c_id)] = model.NewBoolVar(f"u_{d}_{ts}_{c_id}")

    # Auxiliary variables: Teacher Occupation v[d, ts, t_id]
    v = {}
    for t in teachers:
        t_id = t["id"]
        for d in days:
            for ts in time_slots:
                v[(d, ts, t_id)] = model.NewBoolVar(f"v_{d}_{ts}_{t_id}")

    # ----------------------------------------------------
    # 4. Hard Constraints
    # ----------------------------------------------------
    
    # C1: Curriculum Completion (Required hours per week)
    for idx, item in enumerate(curriculum):
        req_hours = item.get("hours_per_week", 1)
        item_vars = [var for key, var in x.items() if key[0] == idx]
        model.Add(sum(item_vars) == req_hours)

    # Link u[d, ts, c_id] to x and enforce Hard Constraint C3: Class No-Overlap
    for c in classes:
        c_id = c["id"]
        for d in days:
            for ts in time_slots:
                class_slot_vars = [var for key, var in x.items() if key[1] == d and key[2] == ts and curriculum[key[0]]["class_id"] == c_id]
                model.Add(sum(class_slot_vars) == u[(d, ts, c_id)])
                model.Add(u[(d, ts, c_id)] <= 1)

    # Link v[d, ts, t_id] to x and enforce Hard Constraint C2: Teacher No-Overlap
    for t in teachers:
        t_id = t["id"]
        for d in days:
            for ts in time_slots:
                teacher_slot_vars = [var for key, var in x.items() if key[1] == d and key[2] == ts and curriculum[key[0]]["teacher_id"] == t_id]
                model.Add(sum(teacher_slot_vars) == v[(d, ts, t_id)])
                model.Add(v[(d, ts, t_id)] <= 1)

    # C4: Room No-Overlap (Only enforced for physical rooms r_id > 0)
    for r in rooms:
        r_id = r["id"]
        if r_id == 0:
            continue
        for d in days:
            for ts in time_slots:
                room_slot_vars = [var for key, var in x.items() if key[1] == d and key[2] == ts and key[3] == r_id]
                model.Add(sum(room_slot_vars) <= 1)

    # ----------------------------------------------------
    # 5. Soft Constraints & Objective Function
    # ----------------------------------------------------
    # O1: Class Gap Minimization (Windows)
    class_gap_vars = []
    sorted_ts = sorted(time_slots)
    
    if len(sorted_ts) > 2:
        for c in classes:
            c_id = c["id"]
            for d in days:
                for idx_ts in range(1, len(sorted_ts) - 1):
                    ts = sorted_ts[idx_ts]
                    earlier_slots = sorted_ts[:idx_ts]
                    later_slots = sorted_ts[idx_ts + 1:]

                    has_earlier = model.NewBoolVar(f"has_earlier_c{c_id}_d{d}_ts{ts}")
                    has_later = model.NewBoolVar(f"has_later_c{c_id}_d{d}_ts{ts}")
                    is_gap = model.NewBoolVar(f"is_gap_c{c_id}_d{d}_ts{ts}")

                    model.Add(sum(u[(d, e_ts, c_id)] for e_ts in earlier_slots) >= 1).OnlyEnforceIf(has_earlier)
                    model.Add(sum(u[(d, e_ts, c_id)] for e_ts in earlier_slots) == 0).OnlyEnforceIf(has_earlier.Not())

                    model.Add(sum(u[(d, l_ts, c_id)] for l_ts in later_slots) >= 1).OnlyEnforceIf(has_later)
                    model.Add(sum(u[(d, l_ts, c_id)] for l_ts in later_slots) == 0).OnlyEnforceIf(has_later.Not())

                    model.AddBoolAnd([has_earlier, has_later, u[(d, ts, c_id)].Not()]).OnlyEnforceIf(is_gap)
                    model.AddBoolOr([has_earlier.Not(), has_later.Not(), u[(d, ts, c_id)]]).OnlyEnforceIf(is_gap.Not())

                    class_gap_vars.append(is_gap)

    # O2: Teacher Gap Minimization (Windows)
    teacher_gap_vars = []
    if len(sorted_ts) > 2:
        for t in teachers:
            t_id = t["id"]
            for d in days:
                for idx_ts in range(1, len(sorted_ts) - 1):
                    ts = sorted_ts[idx_ts]
                    earlier_slots = sorted_ts[:idx_ts]
                    later_slots = sorted_ts[idx_ts + 1:]

                    has_earlier = model.NewBoolVar(f"has_earlier_t{t_id}_d{d}_ts{ts}")
                    has_later = model.NewBoolVar(f"has_later_t{t_id}_d{d}_ts{ts}")
                    is_gap = model.NewBoolVar(f"is_gap_t{t_id}_d{d}_ts{ts}")

                    model.Add(sum(v[(d, e_ts, t_id)] for e_ts in earlier_slots) >= 1).OnlyEnforceIf(has_earlier)
                    model.Add(sum(v[(d, e_ts, t_id)] for e_ts in earlier_slots) == 0).OnlyEnforceIf(has_earlier.Not())

                    model.Add(sum(v[(d, l_ts, t_id)] for l_ts in later_slots) >= 1).OnlyEnforceIf(has_later)
                    model.Add(sum(v[(d, l_ts, t_id)] for l_ts in later_slots) == 0).OnlyEnforceIf(has_later.Not())

                    model.AddBoolAnd([has_earlier, has_later, v[(d, ts, t_id)].Not()]).OnlyEnforceIf(is_gap)
                    model.AddBoolOr([has_earlier.Not(), has_later.Not(), v[(d, ts, t_id)]]).OnlyEnforceIf(is_gap.Not())

                    teacher_gap_vars.append(is_gap)

    # O3: Daily Load Overload Balance
    overload_vars = []
    for c in classes:
        c_id = c["id"]
        max_daily = c.get("max_daily_lessons", 5)
        for d in days:
            daily_sum = sum(u[(d, ts, c_id)] for ts in time_slots)
            overload = model.NewIntVar(0, len(time_slots), f"overload_c{c_id}_d{d}")
            model.Add(overload >= daily_sum - max_daily)
            overload_vars.append(overload)

    # Objective Function Formulation
    w1 = int(weights.get("class_gaps", 10))
    w2 = int(weights.get("teacher_gaps", 10))
    w3 = int(weights.get("daily_overloads", 20))

    model.Minimize(
        w1 * sum(class_gap_vars) +
        w2 * sum(teacher_gap_vars) +
        w3 * sum(overload_vars)
    )

    # ----------------------------------------------------
    # 6. Solve Model
    # ----------------------------------------------------
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = time_limit_seconds
    solver.parameters.num_workers = 4

    status = solver.Solve(model)
    execution_time_ms = int((time.time() - start_time) * 1000)

    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        solution_slots = []
        for key, var in x.items():
            if solver.Value(var) == 1:
                curr_idx, d, ts, r_id = key
                curr_item = curriculum[curr_idx]
                solution_slots.append({
                    "day_of_week": d,
                    "time_slot_id": ts,
                    "group_id": curr_item["class_id"],
                    "subject_id": curr_item["subject_id"],
                    "teacher_id": curr_item["teacher_id"],
                    "room_id": r_id if r_id != 0 else None,
                    "curriculum_id": curr_item.get("id")
                })
        
        return {
            "status": "SUCCESS",
            "solver_status": solver.StatusName(status),
            "score": int(solver.ObjectiveValue()),
            "execution_time_ms": execution_time_ms,
            "conflicts": [],
            "solution": solution_slots
        }
    elif status == cp_model.INFEASIBLE:
        return {
            "status": "INFEASIBLE",
            "solver_status": "INFEASIBLE",
            "score": None,
            "execution_time_ms": execution_time_ms,
            "conflicts": ["Модель расписания математически недостижима. Проверьте совместную доступность учителей и кабинетов."],
            "solution": []
        }
    else:
        return {
            "status": "FAILED",
            "solver_status": solver.StatusName(status),
            "score": None,
            "execution_time_ms": execution_time_ms,
            "conflicts": [f"Решатель завершил работу со статусом: {solver.StatusName(status)}"],
            "solution": []
        }

def run_self_test():
    """Runs a self-test with benchmark feasible and infeasible datasets."""
    print("=== Running CP-SAT Solver Self-Test ===")
    
    # 1. Feasible Dataset Test
    feasible_input = {
        "days": [1, 2, 3, 4, 5],
        "time_slots": [1, 2, 3, 4, 5, 6],
        "classes": [{"id": 1, "name": "5A", "max_daily_lessons": 5}, {"id": 2, "name": "5B", "max_daily_lessons": 5}],
        "teachers": [{"id": 10, "name": "Учитель Математики"}, {"id": 11, "name": "Учитель Физики"}],
        "rooms": [{"id": 101, "name": "Кабинет 101"}, {"id": 102, "name": "Кабинет 102"}],
        "curriculum": [
            {"id": 1, "class_id": 1, "subject_id": 100, "teacher_id": 10, "room_id": 101, "hours_per_week": 4},
            {"id": 2, "class_id": 1, "subject_id": 101, "teacher_id": 11, "room_id": 102, "hours_per_week": 3},
            {"id": 3, "class_id": 2, "subject_id": 100, "teacher_id": 10, "room_id": 101, "hours_per_week": 4},
            {"id": 4, "class_id": 2, "subject_id": 101, "teacher_id": 11, "room_id": 102, "hours_per_week": 3}
        ],
        "time_limit_seconds": 10.0
    }
    
    res1 = solve_schedule(feasible_input)
    print(f"Feasible Test Status: {res1['status']} (Execution: {res1['execution_time_ms']}ms, Score: {res1['score']}, Slots: {len(res1['solution'])})")
    assert res1["status"] == "SUCCESS", f"Expected SUCCESS, got {res1['status']}"
    assert len(res1["solution"]) == 14, f"Expected 14 total lesson slots, got {len(res1['solution'])}"

    # 2. Infeasible Dataset Test (Teacher Overcommitted)
    infeasible_input = {
        "days": [1, 2],
        "time_slots": [1, 2], # Only 4 total slots in week
        "classes": [{"id": 1, "name": "5A"}],
        "teachers": [{"id": 10, "name": "Перегруженный Учитель"}],
        "rooms": [{"id": 101, "name": "Кабинет 101"}],
        "curriculum": [
            {"id": 1, "class_id": 1, "subject_id": 100, "teacher_id": 10, "room_id": 101, "hours_per_week": 10} # 10 hours required in 4 slot week
        ]
    }
    
    res2 = solve_schedule(infeasible_input)
    print(f"Infeasible Test Status: {res2['status']} (Conflicts: {res2['conflicts']})")
    assert res2["status"] == "INFEASIBLE", f"Expected INFEASIBLE, got {res2['status']}"
    assert len(res2["conflicts"]) > 0, "Expected non-empty conflict report"

    print("=== CP-SAT Solver Self-Test Passed Cleanly! ===")

def main():
    parser = argparse.ArgumentParser(description="Mezon ERP CP-SAT Timetable Solver")
    parser.add_argument("--test", action="store_true", help="Run internal self-test suite")
    parser.add_argument("--input", type=str, help="Path to input JSON file")
    
    args = parser.parse_args()

    if args.test:
        run_self_test()
        sys.exit(0)

    if args.input:
        with open(args.input, "r", encoding="utf-8") as f:
            input_data = json.load(f)
    else:
        input_data = json.load(sys.stdin)

    result = solve_schedule(input_data)
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
