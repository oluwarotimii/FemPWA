Perfect! Now I have all the information needed. Let me create a comprehensive table of permissions and endpoints for the leave management system:

    Leave Management Permissions & Endpoints Matrix

    Permission Overview Table


    ┌──────────────────────────┬────────────────────────────────────┬──────────────────┬───────────────┐
    │ Permission Key           │ Description                        │ Module           │ Access Level  │
    ├──────────────────────────┼────────────────────────────────────┼──────────────────┼───────────────┤
    │ leave:read               │ View all leave requests            │ Leave Management │ Read          │
    │ leave:create             │ Create new leave requests          │ Leave Management │ Create        │
    │ leave:update             │ Update/modify leave requests       │ Leave Management │ Update        │
    │ leave:delete             │ Delete/cancel leave requests       │ Leave Management │ Delete        │
    │ leave:request            │ Submit leave requests (basic user) │ Leave Management │ Basic         │
    │ leave:approve            │ Approve/reject leave requests      │ Leave Management │ Admin/Manager │
    │ time_off_bank:read         │ View time off bank balances        │ Leave Management │ Read          │
    │ time_off_bank:create       │ Create/assign time off banks       │ Leave Management │ Admin/HR      │
    │ time_off_bank:update       │ Update time off bank details       │ Leave Management │ Admin/HR      │
    │ time_off_bank:delete       │ Delete time off banks              │ Leave Management │ Admin/HR      │
    │ schedule_request:read    │ View schedule requests             │ Schedule         │ Read          │
    │ schedule_request:create  │ Create schedule requests           │ Schedule         │ Create        │
    │ schedule_request:update  │ Update schedule requests           │ Schedule         │ Update        │
    │ schedule_request:approve │ Approve schedule requests          │ Schedule         │ Admin/HR      │
    │ schedule_request:reject  │ Reject schedule requests           │ Schedule         │ Admin/HR      │
    └──────────────────────────┴────────────────────────────────────┴──────────────────┴───────────────┘


    ---

    Complete Endpoints Table


    ┌────────────────────────────────────┬────────┬──────────────────────────┬───────────────────────────────────────┬─────────────────────────────────────────┐
    │ Endpoint                           │ Method │ Permission Required      │ Description                           │ UI Component Gating                     │
    ├────────────────────────────────────┼────────┼──────────────────────────┼───────────────────────────────────────┼─────────────────────────────────────────┤
    │ Leave Requests                     │        │                          │                                       │                                         │
    │ /api/leave/requests                │ GET    │ leave:read               │ Get all leave requests (with filters) │ Show all requests list (Admin/Manager)  │
    │ /api/leave/my-requests             │ GET    │ Authenticated            │ Get current user's own leave requests │ Show "My Requests" section (All Users)  │
    │ /api/leave/balance                 │ GET    │ Authenticated            │ Get current user's leave balances     │ Show leave balance cards (All Users)    │
    │ /api/leave/history                 │ GET    │ Authenticated            │ Get leave history                     │ Show leave history timeline (All Users) │
    │ /api/leave/:id                     │ GET    │ Authenticated            │ Get specific leave request            │ View request details (Owner or Admin)   │
    │ /api/leave                         │ POST   │ leave:create             │ Create new leave request              │ Show "Request Leave" button/form        │
    │ /api/leave/:id                     │ PUT    │ leave:update             │ Update leave request (status)         │ Show "Approve/Reject" actions           │
    │ /api/leave/:id                     │ DELETE │ leave:delete             │ Cancel leave request                  │ Show "Cancel Request" button            │
    │ Leave Types                        │        │                          │                                       │                                         │
    │ /api/leave-types                   │ GET    │ Authenticated            │ List all leave types                  │ Show leave type dropdowns (All Users)   │
    │ /api/leave-types/:id               │ GET    │ Authenticated            │ Get leave type by ID                  │ View leave type details (All Users)     │
    │ /api/leave-types                   │ POST   │ leave:request            │ Create new leave type                 │ Show "Add Leave Type" (Admin/HR)        │
    │ /api/leave-types/:id               │ PUT    │ leave:approve            │ Update leave type                     │ Show "Edit Leave Type" (Admin/HR)       │
    │ /api/leave-types/:id               │ DELETE │ leave:approve            │ Deactivate leave type                 │ Show "Deactivate" (Admin/HR)            │
    │ Time Off Banks                     │        │                          │                                       │                                         │
    │ /api/time-off-banks                │ GET    │ time_off_bank:read         │ Get all time off banks                │ View all time off banks (Admin/HR)      │
    │ /api/time-off-banks/:id            │ GET    │ time_off_bank:read         │ Get specific time off bank            │ View time off bank details (Admin/HR)   │
    │ /api/time-off-banks                │ POST   │ time_off_bank:create       │ Create time off bank                  │ Show "Create Time Off Bank" (Admin/HR)  │
    │ /api/time-off-banks/:id            │ PUT    │ time_off_bank:update       │ Update time off bank                  │ Show "Edit Time Off Bank" (Admin/HR)    │
    │ /api/time-off-banks/:id            │ DELETE │ time_off_bank:delete       │ Delete time off bank                  │ Show "Delete Time Off Bank" (Admin/HR)  │
    │ /api/time-off-banks/assign         │ POST   │ time_off_bank:create       │ Assign time off to employee           │ Show "Assign Time Off" (Admin/HR)       │
    │ Schedule Requests                  │        │                          │                                       │                                         │
    │ /api/schedule-requests             │ GET    │ Authenticated            │ Get schedule requests                 │ View schedule requests list             │
    │ /api/schedule-requests/:id         │ GET    │ Authenticated            │ Get specific schedule request         │ View request details                    │
    │ /api/schedule-requests             │ POST   │ Authenticated            │ Create schedule request               │ Show "Request Schedule Change"          │
    │ /api/schedule-requests/:id         │ PUT    │ Authenticated            │ Update schedule request               │ Show "Edit Request" (Owner)             │
    │ /api/schedule-requests/:id/cancel  │ PUT    │ Authenticated            │ Cancel schedule request               │ Show "Cancel Request" (Owner)           │
    │ /api/schedule-requests/:id/approve │ PUT    │ schedule_request:approve │ Approve schedule request              │ Show "Approve" button (Admin/HR)        │
    │ /api/schedule-requests/:id/reject  │ PUT    │ schedule_request:reject  │ Reject schedule request               │ Show "Reject" button (Admin/HR)         │
    └────────────────────────────────────┴────────┴──────────────────────────┴───────────────────────────────────────┴─────────────────────────────────────────┘

    ---

    Frontend UI Gating Strategy

    Component Visibility Matrix


    ┌────────────────────────────┬──────────────────────────┬──────────────────────┐
    │ UI Component/Section       │ Required Permission      │ User Roles           │
    ├────────────────────────────┼──────────────────────────┼──────────────────────┤
    │ Leave Dashboard            │                          │                      │
    │ View own leave balance     │ Authenticated            │ All Users            │
    │ View all employees' leave  │ leave:read               │ Admin, HR, Manager   │
    │ "Request Leave" button     │ leave:create             │ All Users            │
    │ "Approve/Reject" actions   │ leave:approve            │ Admin, HR, Manager   │
    │ "Cancel Request" button    │ leave:delete             │ Request Owner, Admin │
    │ Export leave reports       │ leave:read               │ Admin, HR            │
    │ Leave Type Management      │                          │                      │
    │ View leave types           │ Authenticated            │ All Users            │
    │ "Add Leave Type" button    │ leave:request            │ Admin, HR            │
    │ "Edit Leave Type" button   │ leave:approve            │ Admin, HR            │
    │ "Deactivate Leave Type"    │ leave:approve            │ Admin, HR            │
    │ Time Off Bank Management   │                          │                      │
    │ View time off banks        │ time_off_bank:read         │ Admin, HR            │
    │ "Create Time Off Bank"     │ time_off_bank:create       │ Admin, HR            │
    │ "Edit Time Off Bank"       │ time_off_bank:update       │ Admin, HR            │
    │ "Delete Time Off Bank"     │ time_off_bank:delete       │ Admin, HR            │
    │ "Assign Time Off"          │ time_off_bank:create       │ Admin, HR            │
    │ Schedule Requests          │                          │                      │
    │ View own schedule requests │ Authenticated            │ All Users            │
    │ View all schedule requests │ schedule_request:read    │ Admin, HR, Manager   │
    │ "Request Schedule Change"  │ Authenticated            │ All Users            │
    │ "Approve Schedule"         │ schedule_request:approve │ Admin, HR            │
    │ "Reject Schedule"          │ schedule_request:reject  │ Admin, HR            │
    └────────────────────────────┴──────────────────────────┴──────────────────────┘


    ---

    Recommended Role-Based Permission Sets


    ┌──────────┬─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
    │ Role     │ Permissions                                                                                                         │
    ├──────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
    │ Employee │ leave:create, leave:request                                                                                         │
    │ Manager  │ leave:read, leave:approve, schedule_request:read, schedule_request:approve, schedule_request:reject                   │
    │ HR       │ leave:read, leave:create, leave:update, leave:delete, leave:request, leave:approve, time_off_bank:*, schedule_request:* │
    │ Admin    │ All permissions (*)                                                                                                 │
    └──────────┴─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

    ---

    Implementation Notes for Frontend

     1. Permission Manifest: On login, the backend returns a permission manifest (Record<string, boolean>) that should be stored in your frontend state management (Redux, Context, etc.)

     2. Component Wrapper: Create a reusable permission gate component:

     1    <PermissionGate required="leave:approve">
     2      <ApproveButton />
     3    </PermissionGate>

     3. Route Protection: Protect routes based on permissions:

     1    <ProtectedRoute permission="leave:read">
     2      <LeaveDashboard />
     3    </ProtectedRoute>

     4. Button/Action Level: Hide/show individual buttons based on permissions

     5. Data Filtering: Some endpoints return different data based on role (e.g., /api/leave/requests shows all for admin, own for regular users)

    Would you like me to create a sample frontend permission gate component or expand on any specific section?