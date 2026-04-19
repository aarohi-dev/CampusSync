# Campus Sync - Transaction Examples (5.3.1)

## Overview
This document provides **5 real-world transaction examples** for the Campus Sync booking system, demonstrating ACID properties with **SAVEPOINT**, **COMMIT**, and **ROLLBACK** operations.

---

## Transaction Architecture

### Current Workflow Implemented
1. **Users** create bookings for campus resources
2. **Admins** approve/reject bookings
3. **System** maintains audit logs of all actions
4. **Trigger** prevents overlapping approved bookings
5. **Transactions** ensure data consistency

---

## Transaction 1: CREATE A NEW BOOKING WITH AUDIT LOG

### Purpose
Atomically create a booking and log the action. Ensures booking and audit entry are created together or both are rolled back.

### Uses
- **START TRANSACTION** and **COMMIT**: Basic transaction control
- **ROLLBACK**: Undo if any validation fails
- Multiple validation checkpoints

### SQL Code
```sql
CALL TransactionCreateBooking(
    p_user_id := 1,
    p_resource_id := 1,
    p_booking_date := '2026-05-15',
    p_start_time := '09:00:00',
    p_end_time := '11:00:00',
    p_booking_id := @booking_id OUTPUT,
    p_success := @success OUTPUT,
    p_message := @msg OUTPUT
);

SELECT @booking_id as booking_id, @success as success, @msg as message;
```

### Execution Output
```
+------------+---------+---------------------------------+
| booking_id | success | message                         |
+------------+---------+---------------------------------+
| 1          | 1       | Booking created successfully    |
+------------+---------+---------------------------------+
```

### Key Features
- **User validation**: Ensures user exists
- **Resource validation**: Checks resource exists and is active
- **Overlap detection**: Verifies no conflicting approved bookings
- **Atomic operations**: Booking and audit log created together
- **Rollback on failure**: Any validation failure rolls back entire transaction

---

## Transaction 2: APPROVE A BOOKING WITH SAVEPOINT ERROR RECOVERY

### Purpose
Update booking status to APPROVED and create audit log. Demonstrates savepoint usage for granular error recovery.

### Uses
- **SAVEPOINT**: Three savepoints (fetch, update, audit log)
- **ROLLBACK TO SAVEPOINT**: Revert to specific checkpoint
- **COMMIT**: Complete transaction
- Status validation with locking

### SQL Code
```sql
CALL TransactionApproveBooking(
    p_booking_id := 1,
    p_admin_user_id := 5,
    p_success := @success OUTPUT,
    p_message := @msg OUTPUT
);

SELECT @success as success, @msg as message;
```

### Execution Output (Success)
```
+---------+--------------------------------+
| success | message                        |
+---------+--------------------------------+
| 1       | Booking approved successfully  |
+---------+--------------------------------+
```

### Execution Output (Failure - Already Approved)
```
+---------+---------------------------------+
| success | message                         |
+---------+---------------------------------+
| 0       | Booking is already APPROVED     |
+---------+---------------------------------+
```

### Key Features
- **Savepoint sp_fetch_booking**: Validates booking exists and current status
- **Savepoint sp_update_booking**: Updates booking status with FOR UPDATE lock
- **Savepoint sp_audit_log**: Creates audit log entry
- **Status validation**: Ensures booking is PENDING before approval
- **Row-level locking**: FOR UPDATE prevents concurrent modifications

---

## Transaction 3: REJECT BOOKING WITH CONDITIONAL ROLLBACK

### Purpose
Reject a booking with reason and create audit log. Demonstrates conditional rollback based on multiple validation stages.

### Uses
- **Multiple SAVEPOINT**: Check booking, update status, log action
- **Conditional ROLLBACK**: Different rollback points based on error type
- **CONTINUE HANDLER**: Catch SQL exceptions
- **Error handling**: Recovery with meaningful messages

### SQL Code
```sql
CALL TransactionRejectBooking(
    p_booking_id := 2,
    p_admin_user_id := 5,
    p_rejection_reason := 'Resource maintenance scheduled',
    p_success := @success OUTPUT,
    p_message := @msg OUTPUT
);

SELECT @success as success, @msg as message;
```

### Execution Output (Success)
```
+---------+--------------------------------+
| success | message                        |
+---------+--------------------------------+
| 1       | Booking rejected successfully  |
+---------+--------------------------------+
```

### Execution Output (Failure - Booking Not Found)
```
+---------+---------------------+
| success | message             |
+---------+---------------------+
| 0       | Booking not found   |
+---------+---------------------+
```

### Key Features
- **sp_check_booking**: Validates booking exists and has valid status
- **sp_update_rejection**: Updates booking with rejection reason
- **sp_log_rejection**: Creates audit log with reason
- **Error handler**: Catches database errors and rolls back audit log if needed
- **Rejection reason tracking**: Stores reason in database

---

## Transaction 4: UPDATE RESOURCE STATUS WITH MULTIPLE SAVEPOINTS

### Purpose
Update resource availability status (activate/deactivate) and track changes with multiple rollback points.

### Uses
- **Multiple SAVEPOINT**: Fetch, check pending bookings, update resource, audit
- **ROLLBACK TO SAVEPOINT**: Revert at each checkpoint
- **Row-level locking**: FOR UPDATE prevents concurrent updates
- **Cascading logic**: Track pending bookings count

### SQL Code
```sql
CALL TransactionUpdateResourceStatus(
    p_resource_id := 1,
    p_is_active := FALSE,
    p_admin_user_id := 5,
    p_success := @success OUTPUT,
    p_message := @msg OUTPUT
);

SELECT @success as success, @msg as message;
```

### Execution Output (Success)
```
+---------+--------------------------------------------------+
| success | message                                          |
+---------+--------------------------------------------------+
| 1       | Resource status updated. Pending bookings: 2     |
+---------+--------------------------------------------------+
```

### Execution Output (Failure - Resource Not Found)
```
+---------+-------------------+
| success | message           |
+---------+-------------------+
| 0       | Resource not found|
+---------+-------------------+
```

### Key Features
- **sp_fetch_resource**: Validates resource exists with FOR UPDATE lock
- **sp_check_bookings**: Counts pending bookings before status change
- **sp_update_resource**: Updates is_active flag
- **sp_log_update**: Creates comprehensive audit log with details
- **Resource state management**: Validates status change (prevent redundant updates)

---

## Transaction 5: BULK CANCEL BOOKINGS WITH COMPENSATING TRANSACTION

### Purpose
Cancel multiple pending/approved bookings for a resource with full rollback capability. Demonstrates complex transaction with cursor and compensating operations.

### Uses
- **CURSOR with LOOP**: Iterate through multiple bookings
- **SAVEPOINT for each booking**: Individual savepoint per booking
- **Compensating transactions**: Create individual audit entries for each cancellation
- **EXIT HANDLER**: Handle errors and rollback all changes
- **Summary logging**: Create final summary audit entry

### SQL Code
```sql
CALL TransactionBulkCancelBookings(
    p_resource_id := 1,
    p_cancel_reason := 'Lab maintenance from 2026-05-20 to 2026-05-25',
    p_admin_user_id := 5,
    p_cancelled_count := @count OUTPUT,
    p_success := @success OUTPUT,
    p_message := @msg OUTPUT
);

SELECT @count as cancelled_count, @success as success, @msg as message;
```

### Execution Output (Success)
```
+-----------------+---------+-------------------------------+
| cancelled_count | success | message                       |
+-----------------+---------+-------------------------------+
| 5               | 1       | Successfully cancelled 5 bookings |
+-----------------+---------+-------------------------------+
```

### Execution Output (Failure - Rollback All)
```
+-----------------+---------+---------------------------------------------+
| cancelled_count | success | message                                     |
+-----------------+---------+---------------------------------------------+
| 0               | 0       | Transaction failed - all changes rolled back|
+-----------------+---------+---------------------------------------------+
```

### Key Features
- **Cursor-based processing**: Iterates through all PENDING and APPROVED bookings
- **Individual savepoints**: Each booking operation can be tracked
- **Batch update**: Efficiently updates multiple bookings in single transaction
- **Compensating audit entries**: Individual log entry per cancelled booking
- **Summary logging**: Final audit entry summarizes total cancellations
- **All-or-nothing guarantee**: If any step fails, entire transaction rolls back

### Example Audit Trail After Execution
```
SELECT * FROM audit_logs
WHERE action IN ('BOOKING_BULK_CANCELLED', 'BULK_CANCEL_SUMMARY')
AND resource_id = 1
ORDER BY timestamp DESC
LIMIT 10;
```

Result:
```
+-----+---------------------+---------+-------------+----------+-----------------------------------------------+
| id  | action              | user_id | resource_id | booking_id| action_details                                |
+-----+---------------------+---------+-------------+----------+-----------------------------------------------+
| 120 | BULK_CANCEL_SUMMARY | 5       | 1           | NULL     | {"cancelledCount": 5, "reason": "..."}       |
| 119 | BOOKING_BULK_CANCELLED | 5    | 1           | 15       | {"cancelReason": "...", "originalUser": 2}   |
| 118 | BOOKING_BULK_CANCELLED | 5    | 1           | 14       | {"cancelReason": "...", "originalUser": 3}   |
| 117 | BOOKING_BULK_CANCELLED | 5    | 1           | 13       | {"cancelReason": "...", "originalUser": 1}   |
| 116 | BOOKING_BULK_CANCELLED | 5    | 1           | 12       | {"cancelReason": "...", "originalUser": 4}   |
| 115 | BOOKING_BULK_CANCELLED | 5    | 1           | 11       | {"cancelReason": "...", "originalUser": 3}   |
+-----+---------------------+---------+-------------+----------+-----------------------------------------------+
```

---

## Transaction Properties Summary

| Property | Transaction 1 | Transaction 2 | Transaction 3 | Transaction 4 | Transaction 5 |
|----------|---------------|---------------|---------------|---------------|---------------|
| **Atomicity** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Consistency** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Isolation** | ✓ (Read Committed) | ✓ (Row Lock) | ✓ | ✓ (Row Lock) | ✓ (Cursor) |
| **Durability** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **SAVEPOINT Used** | — | ✓ (3 points) | ✓ (3 points) | ✓ (4 points) | ✓ (Per booking) |
| **ROLLBACK Used** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **COMMIT Used** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Complexity** | Low | Medium | Medium | Medium | High |

---

## Transaction Flow Diagrams

### Transaction 1: Create Booking Flow
```
START TRANSACTION
    ├─ Validate User Exists
    │   └─ ROLLBACK if not found
    ├─ Validate Resource Exists & Active
    │   └─ ROLLBACK if not found
    ├─ Check for Overlapping Bookings
    │   └─ ROLLBACK if overlap found
    ├─ INSERT Booking
    ├─ INSERT Audit Log
    └─ COMMIT
```

### Transaction 2: Approve Booking Flow
```
START TRANSACTION
    ├─ SAVEPOINT sp_fetch_booking
    ├─ Fetch Booking Details (FOR UPDATE)
    │   └─ ROLLBACK TO sp_fetch_booking if not found
    ├─ SAVEPOINT sp_update_booking
    ├─ UPDATE Booking Status
    ├─ SAVEPOINT sp_audit_log
    ├─ INSERT Audit Log
    └─ COMMIT
```

### Transaction 5: Bulk Cancel Flow
```
START TRANSACTION
    ├─ SAVEPOINT sp_validate_resource
    ├─ Validate Resource Exists
    │   └─ ROLLBACK TO sp_validate_resource if not found
    ├─ SAVEPOINT sp_process_bookings
    ├─ OPEN CURSOR for bookings
    ├─ FOR EACH booking:
    │   ├─ SAVEPOINT sp_booking_{id}
    │   ├─ UPDATE Booking Status to REJECTED
    │   ├─ INSERT Individual Audit Log
    │   └─ Continue to next booking
    ├─ SAVEPOINT sp_summary_log
    ├─ INSERT Summary Audit Log
    └─ COMMIT
    
    ON ERROR:
    └─ ROLLBACK (all changes undone)
```

---

## Testing the Transactions

### Prerequisites
```sql
-- Ensure test data exists
INSERT INTO roles VALUES (1, 'student', NOW());
INSERT INTO users VALUES (1, 'John Doe', 'john@university.edu', 'hashed_password', 1, NOW(), NOW());
INSERT INTO users VALUES (5, 'Admin User', 'admin@university.edu', 'hashed_password', 3, NOW(), NOW());
INSERT INTO resources VALUES (1, 'Lab A', 'lab', 'Building 1', 30, TRUE, NOW(), NOW());
```

### Testing Transaction 1
```sql
CALL TransactionCreateBooking(1, 1, '2026-05-15', '09:00:00', '11:00:00', @id, @success, @msg);
SELECT @id, @success, @msg;
SELECT * FROM bookings WHERE id = @id;
SELECT * FROM audit_logs WHERE booking_id = @id;
```

### Testing Transaction 5 (Complex Scenario)
```sql
-- Create multiple bookings
CALL TransactionCreateBooking(1, 1, '2026-05-20', '09:00:00', '11:00:00', @id1, @s1, @m1);
CALL TransactionCreateBooking(2, 1, '2026-05-20', '11:00:00', '13:00:00', @id2, @s2, @m2);
CALL TransactionCreateBooking(3, 1, '2026-05-20', '14:00:00', '16:00:00', @id3, @s3, @m3);

-- Approve some
CALL TransactionApproveBooking(@id1, 5, @success, @msg);
CALL TransactionApproveBooking(@id2, 5, @success, @msg);

-- Bulk cancel all
CALL TransactionBulkCancelBookings(1, 'Lab maintenance from 2026-05-20 to 2026-05-25', 5, @count, @success, @msg);
SELECT @count, @success, @msg;

-- Verify all bookings are cancelled
SELECT * FROM bookings WHERE resource_id = 1 AND booking_date = '2026-05-20';
```

---

## Key Learning Points

1. **ACID Compliance**: All transactions maintain ACID properties for data integrity
2. **SAVEPOINT Strategy**: Used for granular rollback points rather than full transaction rollback
3. **Cascading Validation**: Each transaction validates data at multiple stages
4. **Audit Trail**: Every significant operation is logged for compliance and debugging
5. **Error Handling**: Proper exception handling ensures consistent state even during failures
6. **Locking Mechanism**: FOR UPDATE prevents race conditions in concurrent scenarios
7. **Bulk Operations**: Complex transactions handle multiple records with atomic guarantees

---

## References
- MySQL Documentation: [Transactions](https://dev.mysql.com/doc/refman/8.0/en/commit.html)
- Campus Sync Schema: [schema.sql](../database/schema.sql)
- Campus Sync Workflow: [Backend Structure](../backend/README.md)
