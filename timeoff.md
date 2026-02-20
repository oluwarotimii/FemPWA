🏖️ Time Off Bank - Use Case Scenarios

    What is a Time Off Bank?
    A Time Off Bank is a pool of leave days allocated to an employee for a specific period (validity cycle). It tracks how many days an employee has, how many they've used, and how many
    remain.

    ---

    Scenario 1: Annual Leave Allocation (New Employee)

    Context: Sarah joins Femtech as a Software Engineer on January 1, 2026.

    HR Action:
     - HR creates a Time Off Bank for Sarah with:
       - Program: Annual Leave 2026
       - Available Days: 21 days (company policy)
       - Valid From: Jan 1, 2026
       - Valid To: Dec 31, 2026
       - Used Days: 0 (fresh allocation)

    Employee View:

     1 ┌─────────────────────────────────────┐
     2 │  SARAH'S LEAVE BALANCE              │
     3 ├─────────────────────────────────────┤
     4 │  Annual Leave 2026                  │
     5 │  ████████████████░░░░  21 days left │
     6 │  Used: 0 | Available: 21            │
     7 │  Valid: Jan 1 - Dec 31, 2026        │
     8 └─────────────────────────────────────┘

    When Sarah Requests Leave:
     - Sarah requests 5 days leave (March 10-14, 2026)
     - System checks: Does she have ≥5 days in her Time Off Bank? ✓ Yes (21 days)
     - Upon approval: Used Days = 5, Available Days = 16

    ---

    Scenario 2: Carry-Over from Previous Year

    Context: John had 10 unused leave days from 2025. Company policy allows carrying over maximum 5 days.

    HR Action (January 2026):

     1 Time Off Bank Created:
     2 ├─ Employee: John Doe
     3 ├─ Program: Annual Leave 2026
     4 ├─ Allocated Days: 21 (new year allocation)
     5 ├─ Carried Over Days: 5 (from 2025, capped)
     6 ├─ Total Available: 26 days
     7 ├─ Valid From: Jan 1, 2026
     8 └─ Valid To: Dec 31, 2026

    Business Rule:
     - Employees can carry over maximum 5 days
     - Carried over days expire first (use-it-or-lose-it)
     - Remaining unused days from previous year beyond cap are forfeited

    ---

    Scenario 3: Mid-Year Leave Top-Up (Promotion)

    Context: Mary gets promoted from Junior to Senior Engineer in June 2026. Senior engineers get 28 days annual leave instead of 21.

    HR Action:
     - Original Time Off Bank: 21 days (Jan - Dec 2026)
     - Mary has used: 8 days (Jan - May)
     - HR creates adjustment:
       - Additional 7 days added (28 - 21 = 7)
       - Updated Available Days: 20 (was 13, now 13 + 7)

    Updated Time Off Bank:

     1 ┌─────────────────────────────────────┐
     2 │  MARY'S LEAVE BALANCE (Updated)     │
     3 ├─────────────────────────────────────┤
     4 │  Annual Leave 2026                  │
     5 │  ████████████░░░░░░░░  20 days left │
     6 │  Used: 8 | Available: 20            │
     7 │  ★ Promotion adjustment: +7 days    │
     8 └─────────────────────────────────────┘

    ---

    Scenario 4: Sick Leave Bank (Separate from Annual Leave)

    Context: Company provides separate leave types with different banks.

    Time Off Banks for One Employee:

      1 ┌──────────────────────────────────────────────┐
      2 │  EMPLOYEE: Jane Smith                        │
      3 ├──────────────────────────────────────────────┤
      4 │  Leave Type      │ Available │ Used │ Total │
      5 ├──────────────────────────────────────────────┤
      6 │  Annual Leave    │    15     │   6  │  21   │
      7 │  Sick Leave      │    10     │   2  │  12   │
      8 │  Compassionate   │     5     │   0  │   5   │
      9 │  Study Leave     │    10     │   0  │  10   │
     10 └──────────────────────────────────────────────┘

    Use Case:
     - Jane requests Sick Leave for 3 days
     - System deducts from Sick Leave Bank only
     - Annual Leave remains untouched

    ---

    Scenario 5: Probation Employee (Restricted Leave)

    Context: New employees on probation (first 3 months) cannot take annual leave except emergencies.

    HR Action:

     1 Time Off Bank Created:
     2 ├─ Employee: Tom (Probation)
     3 ├─ Program: Annual Leave 2026
     4 ├─ Available Days: 21
     5 ├─ Used Days: 0
     6 ├─ Valid From: Jan 1, 2026
     7 ├─ Valid To: Dec 31, 2026
     8 └─ Status: LOCKED (until probation ends)

    Employee View:

     1 ┌─────────────────────────────────────┐
     2 │  ⚠️ Leaveon hold during probation  │
     3 │                                     │
     4 │  Accruing: 21 days                  │
     5 │  Available after: April 1, 2026     │
     6 └─────────────────────────────────────┘

    ---

    Scenario 6: Exiting Employee (Leave Encashment)

    Context: David resigns and has 12 unused leave days. Company policy: unused leave can be paid out.

    HR Action:

     1 Final Time Off Bank Statement:
     2 ├─ Employee: David (Last day: Feb 28, 2026)
     3 ├─ Total Allocated: 21 days
     4 ├─ Used: 9 days
     5 ├─ Unused: 12 days
     6 └─ Action: Encash 12 days OR Forfeit (if policy says use-it-or-lose-it)

    Payroll Integration:
     - 12 days × Daily Rate = Added to final salary

    ---

    📅 Schedule Request - Use Case Scenarios

    What is a Schedule Request?
    A Schedule Request is when an employee requests changes to their work schedule (shift timing, work-from-home, time off, compensatory time, etc.) that requires manager approval.

    ---

    Scenario 1: Shift Change Request (Personal Commitment)

    Context: Alice normally works 9:00 AM - 5:00 PM but has childcare responsibilities starting next week.

    Employee Action:

      1 ┌─────────────────────────────────────┐
      2 │  SCHEDULE CHANGE REQUEST            │
      3 ├─────────────────────────────────────┤
      4 │  Employee: Alice                    │
      5 │  Request Type: Shift Timing Change  │
      6 │  Current Shift: 09:00 - 17:00       │
      7 │  Requested Shift: 07:00 - 15:00     │
      8 │  Date: Feb 23, 2026 onwards         │
      9 │  Reason: Childcare arrangement      │
     10 └─────────────────────────────────────┘

    Manager View & Action:

     1 ┌─────────────────────────────────────┐
     2 │  PENDING APPROVALS (3)              │
     3 ├─────────────────────────────────────┤
     4 │  ✓ Alice - Shift Change             │
     5 │    09:00→07:00 | Feb 23 onwards     │
     6 │    [APPROVE] [REJECT] [VIEW]        │
     7 └─────────────────────────────────────┘

    After Approval:
     - System creates a Shift Exception for Alice
     - Her attendance is now expected from 07:00 instead of 09:00
     - No late marks for arriving at 07:15

    ---

    Scenario 2: Compensatory Time Off (Comp-Off)

    Context: Bob worked on Saturday (Feb 14, 2026) for a product launch. Company policy: weekend work earns 1 comp-off day.

    System Auto-Creation:

     1 Time Off Bank Created Automatically:
     2 ├─ Employee: Bob
     3 ├─ Program: Compensatory Time
     4 ├─ Available Days: 1
     5 ├─ Earned From: Weekend work (Feb 14)
     6 ├─ Valid From: Feb 14, 2026
     7 └─ Valid To: Mar 14, 2026 (expires in 30 days)

    Bob's Request:

     1 ┌─────────────────────────────────────┐
     2 │  TIME OFF REQUEST                   │
     3 ├─────────────────────────────────────┤
     4 │  Type: Compensatory Time Use        │
     5 │  Date: Feb 20, 2026 (1 day)         │
     6 │  Reason: Using comp-off for Sat work│
     7 └─────────────────────────────────────┘

    After Approval:
     - Comp-off bank: Used = 1, Available = 0
     - Attendance marked as Comp-Off (not absent)

    ---

    Scenario 3: Work From Home Request

    Context: Carol needs to work from home for 3 days due to home repairs.

    Employee Request:

     1 ┌─────────────────────────────────────┐
     2 │  WORK FROM HOME REQUEST             │
     3 ├─────────────────────────────────────┤
     4 │  Employee: Carol                    │
     5 │  Request Type: Remote Work          │
     6 │  Dates: Feb 25-27, 2026 (3 days)    │
     7 │  Reason: Home renovation            │
     8 │  Availability: Fully available      │
     9 └─────────────────────────────────────┘

    Manager Approval Flow:
     1. Manager receives notification
     2. Reviews team capacity (no conflicts)
     3. Approves request

    System Actions:
     - Attendance location requirement waived for those days
     - GPS check-in not required
     - Status: Remote Work (not Leave)

    ---

    Scenario 4: Overtime → Comp-Off Conversion

    Context: Daniel worked 4 hours overtime on Feb 10. Company policy: 4 OT hours = 0.5 comp-off day.

    System Calculation:

     1 Overtime Logged:
     2 ├─ Date: Feb 10, 2026
     3 ├─ Regular End: 17:00
     4 ├─ Actual End: 21:00
     5 ├─ Overtime Hours: 4 hours
     6 └─ Comp-Off Earned: 0.5 days

    Employee Request:

     1 ┌─────────────────────────────────────┐
     2 │  SCHEDULE REQUEST                   │
     3 ├─────────────────────────────────────┤
     4 │  Type: Compensatory Time Use        │
     5 │  Duration: 0.5 days (4 hours)       │
     6 │  Date: Feb 18, 2026 (Afternoon off) │
     7 │  Half-Day: PM (13:00 onwards)       │
     8 └─────────────────────────────────────┘

    ---

    Scenario 5: Shift Swap Request (Peer-to-Peer)

    Context: Eve has a doctor's appointment on Feb 20 (her shift: 08:00-16:00). Frank agrees to cover.

    Employee Request:

      1 ┌─────────────────────────────────────┐
      2 │  SHIFT SWAP REQUEST                 │
      3 ├─────────────────────────────────────┤
      4 │  Requester: Eve                     │
      5 │  Covering Employee: Frank           │
      6 │  Date: Feb 20, 2026                 │
      7 │  Shift: 08:00 - 16:00               │
      8 │  Reason: Medical appointment        │
      9 │  Frank's Consent: ✓ Confirmed       │
     10 └─────────────────────────────────────┘

    Manager Approval:
     - Both employees' schedules updated
     - Eve: Marked as Covered (not absent)
     - Frank: Marked as Working (gets attendance credit)

    ---

    Scenario 6: Emergency Leave (Retroactive Approval)

    Context: Grace had a family emergency on Feb 15 and couldn't come to work or request leave in advance.

    Employee Request (Feb 16):

     1 ┌─────────────────────────────────────┐
     2 │  RETROACTIVE LEAVE REQUEST          │
     3 ├─────────────────────────────────────┤
     4 │  Type: Emergency Leave              │
     5 │  Date: Feb 15, 2026 (Yesterday)     │
     6 │  Reason: Family emergency           │
     7 │  Note: Requesting after the fact    │
     8 └─────────────────────────────────────┘

    Manager Action:
     - Can approve with note: "Emergency - approved retroactively"
     - System creates exception for Feb 15 attendance
     - No late/absent mark

    ---

    📊 Relationship Between Time Off Bank & Schedule Request

      1 ┌─────────────────────────────────────────────────────────────┐
      2 │                    LEAVE REQUEST FLOW                       │
      3 └─────────────────────────────────────────────────────────────┘
      4 
      5 Employee Submits Leave Request
      6          │
      7          ▼
      8 ┌─────────────────────────┐
      9 │ Check Time Off Bank     │
     10 │ - Has sufficient days?  │
     11 │ - Within validity?      │
     12 └─────────────────────────┘
     13          │
     14     ┌────┴────┐
     15     │  YES    │  NO
     16     ▼         ▼
     17 ┌─────────┐  ┌──────────────────┐
     18 │ Create  │  │ Reject with      │
     19 │ Schedule│  │ message:         │
     20 │ Request │  │ "Insufficient    │
     21 └─────────┘  │ leave balance"   │
     22              └──────────────────┘

    Example Integration:


    ┌──────┬────────────────────────────────┬─────────────────────────────┐
    │ Step │ Action                         │ System Check                │
    ├──────┼────────────────────────────────┼─────────────────────────────┤
    │ 1    │ Employee requests 5 days leave │ Check Time Off Bank balance │
    │ 2    │ Balance = 10 days ✓            │ Sufficient balance          │
    │ 3    │ Schedule Request created       │ Status: pending             │
    │ 4    │ Manager approves               │ Status: approved            │
    │ 5    │ System updates Time Off Bank   │ Used: 5, Available: 5       │
    │ 6    │ Attendance marked              │ Days marked as leave        │
    └──────┴────────────────────────────────┴─────────────────────────────┘


    ---

    Permission-Based UI Visibility Examples

    Employee View:

      1 ┌─────────────────────────────────────┐
      2 │  MY LEAVE DASHBOARD                 │
      3 ├─────────────────────────────────────┤
      4 │  Annual Leave: 15 days remaining    │
      5 │                                     │
      6 │  [+ Request Leave] ← visible        │
      7 │  [View History] ← visible           │
      8 │  [Approve Requests] ← HIDDEN        │
      9 │  [Manage Banks] ← HIDDEN            │
     10 └─────────────────────────────────────┘

    Manager View:

      1 ┌─────────────────────────────────────┐
      2 │  TEAM LEAVE DASHBOARD               │
      3 ├─────────────────────────────────────┤
      4 │  Pending Approvals: 3               │
      5 │                                     │
      6 │  [+ Request Leave] ← visible        │
      7 │  [View History] ← visible           │
      8 │  [Approve Requests] ← visible (3)   │
      9 │  [Manage Banks] ← HIDDEN            │
     10 └─────────────────────────────────────┘

    HR/Admin View:

      1 ┌─────────────────────────────────────┐
      2 │  LEAVE MANAGEMENT                   │
      3 ├─────────────────────────────────────┤
      4 │  All Employees | Pending: 12        │
      5 │                                     │
      6 │  [+ Request Leave] ← visible        │
      7 │  [View History] ← visible           │
      8 │  [Approve Requests] ← visible (12)  │
      9 │  [Manage Banks] ← visible           │
     10 │  [Create Time Off Bank] ← visible   │
     11 │  [Reports] ← visible                │
     12 └─────────────────────────────────────┘

    ---