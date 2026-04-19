-- Campus Sync Resource Booking System - MySQL Schema
-- Database for managing campus resource bookings

CREATE DATABASE IF NOT EXISTS campus_sync;
USE campus_sync;

-- 1. Roles Table
CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_name VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
  INDEX idx_email (email),
  INDEX idx_role_id (role_id)
);

-- 3. Resources Table
CREATE TABLE resources (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  type ENUM('lab', 'seminar_hall', 'projector') NOT NULL,
  location VARCHAR(255) NOT NULL,
  capacity INT NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_is_active (is_active)
);

-- 4. Bookings Table
CREATE TABLE bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  resource_id INT NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  rejection_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE RESTRICT,
  INDEX idx_user_id (user_id),   -- foreign key
  INDEX idx_resource_id (resource_id),    -- foreign key
  INDEX idx_status (status),
  INDEX idx_date (booking_date),
  INDEX idx_resource_date (resource_id, booking_date, status),
  CONSTRAINT check_time CHECK (start_time < end_time)
);

-- 5. Audit Logs Table
CREATE TABLE audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  action VARCHAR(255) NOT NULL,
  user_id INT NOT NULL,
  resource_id INT,
  booking_id INT,
  action_details JSON,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE SET NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_timestamp (timestamp)
);

-- create unique constraint to prevent duplicate APPROVED bookings for same resource, date, and overlapping times
-- this is enforced through application logic, but we create a trigger for extra safety
DELIMITER //

CREATE TRIGGER check_booking_overlap BEFORE INSERT ON bookings
FOR EACH ROW
BEGIN
  DECLARE overlap_count INT;
  
  -- Check if there's an overlapping APPROVED booking
  SELECT COUNT(*) INTO overlap_count
  FROM bookings
  WHERE resource_id = NEW.resource_id
    AND booking_date = NEW.booking_date
    AND status = 'APPROVED'
    AND (
      (NEW.start_time < end_time AND NEW.end_time > start_time)
    );
  
  IF overlap_count > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Resource already booked for this time slot';
  END IF;
END //

DELIMITER ;

-- ================================================================================
-- 5.3.1 TRANSACTION EXAMPLES FOR CAMPUS SYNC WORKFLOW
-- ================================================================================
-- These transactions demonstrate ACID properties with SAVEPOINT, COMMIT, and ROLLBACK
-- They implement real-world scenarios from the Campus Sync booking system

-- ==============================================================================
-- TRANSACTION 1: CREATE A NEW BOOKING WITH AUDIT LOG
-- Purpose: Atomically create a booking and log the action
-- Uses: COMMIT, ROLLBACK, basic transaction
-- ==============================================================================
DELIMITER //

CREATE PROCEDURE TransactionCreateBooking(
    IN p_user_id INT,
    IN p_resource_id INT,
    IN p_booking_date DATE,
    IN p_start_time TIME,
    IN p_end_time TIME,
    OUT p_booking_id INT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE exit_code INT DEFAULT 0;
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        SET exit_code = 1;
    END;
    
    -- Start transaction
    START TRANSACTION;
    
    BEGIN
        -- Step 1: Verify user exists
        IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
            SET p_message = 'User does not exist';
            SET p_success = FALSE;
            ROLLBACK;
            LEAVE;
        END IF;
        
        -- Step 2: Verify resource exists and is active
        IF NOT EXISTS (SELECT 1 FROM resources WHERE id = p_resource_id AND is_active = TRUE) THEN
            SET p_message = 'Resource not found or inactive';
            SET p_success = FALSE;
            ROLLBACK;
            LEAVE;
        END IF;
        
        -- Step 3: Verify no overlapping APPROVED bookings (trigger will also check)
        IF EXISTS (
            SELECT 1 FROM bookings
            WHERE resource_id = p_resource_id
            AND booking_date = p_booking_date
            AND status = 'APPROVED'
            AND (p_start_time < end_time AND p_end_time > start_time)
        ) THEN
            SET p_message = 'Resource already booked for this time slot';
            SET p_success = FALSE;
            ROLLBACK;
            LEAVE;
        END IF;
        
        -- Step 4: Insert booking
        INSERT INTO bookings (user_id, resource_id, booking_date, start_time, end_time, status)
        VALUES (p_user_id, p_resource_id, p_booking_date, p_start_time, p_end_time, 'PENDING');
        SET p_booking_id = LAST_INSERT_ID();
        
        -- Step 5: Create audit log entry
        INSERT INTO audit_logs (action, user_id, resource_id, booking_id, action_details)
        VALUES ('BOOKING_CREATED', p_user_id, p_resource_id, p_booking_id,
                JSON_OBJECT('date', p_booking_date, 'startTime', p_start_time, 'endTime', p_end_time));
        
        -- Commit transaction
        COMMIT;
        SET p_success = TRUE;
        SET p_message = 'Booking created successfully';
    END;
    
    -- Handle any exceptions
    IF exit_code = 1 THEN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = 'Transaction failed due to database error';
    END IF;
END//

DELIMITER ;

-- ==============================================================================
-- TRANSACTION 2: APPROVE A BOOKING WITH SAVEPOINT ERROR RECOVERY
-- Purpose: Update booking status and create audit log with savepoint rollback
-- Uses: SAVEPOINT, COMMIT, ROLLBACK to savepoint
-- ==============================================================================
DELIMITER //

CREATE PROCEDURE TransactionApproveBooking(
    IN p_booking_id INT,
    IN p_admin_user_id INT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE approval_user_id INT;
    DECLARE approval_resource_id INT;
    DECLARE approval_date DATE;
    DECLARE approval_status VARCHAR(50);
    
    START TRANSACTION;
    
    -- Savepoint 1: Before fetching booking details
    SAVEPOINT sp_fetch_booking;
    
    -- Fetch booking details
    SELECT user_id, resource_id, booking_date, status
    INTO approval_user_id, approval_resource_id, approval_date, approval_status
    FROM bookings
    WHERE id = p_booking_id
    FOR UPDATE;
    
    -- Validate booking exists
    IF approval_user_id IS NULL THEN
        SET p_success = FALSE;
        SET p_message = 'Booking not found';
        ROLLBACK TO SAVEPOINT sp_fetch_booking;
        ROLLBACK;
        LEAVE;
    END IF;
    
    -- Validate booking is still PENDING
    IF approval_status != 'PENDING' THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('Booking is already ', approval_status);
        ROLLBACK TO SAVEPOINT sp_fetch_booking;
        ROLLBACK;
        LEAVE;
    END IF;
    
    -- Savepoint 2: Before updating booking status
    SAVEPOINT sp_update_booking;
    
    -- Update booking status to APPROVED
    UPDATE bookings
    SET status = 'APPROVED', updated_at = CURRENT_TIMESTAMP
    WHERE id = p_booking_id;
    
    -- Savepoint 3: Before creating audit log
    SAVEPOINT sp_audit_log;
    
    -- Create audit log entry
    INSERT INTO audit_logs (action, user_id, resource_id, booking_id, action_details)
    VALUES ('BOOKING_APPROVED', p_admin_user_id, approval_resource_id, p_booking_id,
            JSON_OBJECT('approvedFor', approval_user_id, 'date', approval_date));
    
    -- If we reach here, commit all changes
    COMMIT;
    SET p_success = TRUE;
    SET p_message = 'Booking approved successfully';
END//

DELIMITER ;

-- ==============================================================================
-- TRANSACTION 3: REJECT BOOKING WITH CONDITIONAL ROLLBACK
-- Purpose: Reject a booking and log the action with validation
-- Uses: Multiple SAVEPOINT, conditional ROLLBACK, error handling
-- ==============================================================================
DELIMITER //

CREATE PROCEDURE TransactionRejectBooking(
    IN p_booking_id INT,
    IN p_admin_user_id INT,
    IN p_rejection_reason VARCHAR(255),
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE rejection_status VARCHAR(50);
    DECLARE rejection_user_id INT;
    DECLARE rejection_resource_id INT;
    DECLARE error_occurred BOOLEAN DEFAULT FALSE;
    
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        SET error_occurred = TRUE;
    END;
    
    START TRANSACTION;
    
    -- Savepoint: Check booking exists
    SAVEPOINT sp_check_booking;
    
    SELECT status, user_id, resource_id
    INTO rejection_status, rejection_user_id, rejection_resource_id
    FROM bookings
    WHERE id = p_booking_id
    FOR UPDATE;
    
    IF rejection_status IS NULL THEN
        SET p_success = FALSE;
        SET p_message = 'Booking not found';
        ROLLBACK TO SAVEPOINT sp_check_booking;
        ROLLBACK;
        LEAVE;
    END IF;
    
    IF rejection_status NOT IN ('PENDING', 'APPROVED') THEN
        SET p_success = FALSE;
        SET p_message = 'Booking cannot be rejected in current status';
        ROLLBACK TO SAVEPOINT sp_check_booking;
        ROLLBACK;
        LEAVE;
    END IF;
    
    -- Savepoint: Before updating booking
    SAVEPOINT sp_update_rejection;
    
    -- Update booking status to REJECTED
    UPDATE bookings
    SET status = 'REJECTED',
        rejection_reason = p_rejection_reason,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_booking_id;
    
    -- Savepoint: Before audit log
    SAVEPOINT sp_log_rejection;
    
    -- Create audit log entry
    INSERT INTO audit_logs (action, user_id, resource_id, booking_id, action_details)
    VALUES ('BOOKING_REJECTED', p_admin_user_id, rejection_resource_id, p_booking_id,
            JSON_OBJECT('rejectedBooking', rejection_user_id, 'reason', p_rejection_reason));
    
    IF error_occurred THEN
        ROLLBACK TO SAVEPOINT sp_log_rejection;
        SET p_success = FALSE;
        SET p_message = 'Failed to create audit log';
        ROLLBACK;
    ELSE
        COMMIT;
        SET p_success = TRUE;
        SET p_message = 'Booking rejected successfully';
    END IF;
END//

DELIMITER ;

-- ==============================================================================
-- TRANSACTION 4: UPDATE RESOURCE STATUS WITH MULTIPLE SAVEPOINTS
-- Purpose: Update resource availability and track all changes with rollback capability
-- Uses: Multiple SAVEPOINT, nested ROLLBACK, resource state management
-- ==============================================================================
DELIMITER //

CREATE PROCEDURE TransactionUpdateResourceStatus(
    IN p_resource_id INT,
    IN p_is_active BOOLEAN,
    IN p_admin_user_id INT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE current_status BOOLEAN;
    DECLARE pending_bookings_count INT;
    DECLARE resource_name VARCHAR(100);
    DECLARE affected_bookings INT DEFAULT 0;
    
    START TRANSACTION;
    
    -- Savepoint: Fetch and validate resource
    SAVEPOINT sp_fetch_resource;
    
    SELECT is_active, name
    INTO current_status, resource_name
    FROM resources
    WHERE id = p_resource_id
    FOR UPDATE;
    
    IF resource_name IS NULL THEN
        SET p_success = FALSE;
        SET p_message = 'Resource not found';
        ROLLBACK TO SAVEPOINT sp_fetch_resource;
        ROLLBACK;
        LEAVE;
    END IF;
    
    IF current_status = p_is_active THEN
        SET p_success = FALSE;
        SET p_message = 'Resource already has this status';
        ROLLBACK TO SAVEPOINT sp_fetch_resource;
        ROLLBACK;
        LEAVE;
    END IF;
    
    -- Savepoint: Check pending bookings
    SAVEPOINT sp_check_bookings;
    
    SELECT COUNT(*) INTO pending_bookings_count
    FROM bookings
    WHERE resource_id = p_resource_id
    AND status = 'PENDING';
    
    -- Savepoint: Update resource status
    SAVEPOINT sp_update_resource;
    
    UPDATE resources
    SET is_active = p_is_active,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_resource_id;
    
    -- Savepoint: Create audit log
    SAVEPOINT sp_log_update;
    
    INSERT INTO audit_logs (action, user_id, resource_id, action_details)
    VALUES ('RESOURCE_STATUS_UPDATED', p_admin_user_id, p_resource_id,
            JSON_OBJECT('previousStatus', current_status, 'newStatus', p_is_active,
                       'resourceName', resource_name, 'pendingBookings', pending_bookings_count));
    
    COMMIT;
    SET p_success = TRUE;
    SET p_message = CONCAT('Resource status updated. Pending bookings: ', pending_bookings_count);
END//

DELIMITER ;

-- ==============================================================================
-- TRANSACTION 5: BULK CANCEL BOOKINGS WITH COMPENSATING TRANSACTION
-- Purpose: Cancel multiple pending bookings for a resource with full rollback capability
-- Uses: SAVEPOINT for each booking, ROLLBACK for compensation, complex transaction logic
-- ==============================================================================
DELIMITER //

CREATE PROCEDURE TransactionBulkCancelBookings(
    IN p_resource_id INT,
    IN p_cancel_reason VARCHAR(255),
    IN p_admin_user_id INT,
    OUT p_cancelled_count INT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE booking_id_var INT;
    DECLARE booking_user_id INT;
    DECLARE done INT DEFAULT FALSE;
    DECLARE bookings_cursor CURSOR FOR
        SELECT id, user_id FROM bookings
        WHERE resource_id = p_resource_id
        AND status IN ('PENDING', 'APPROVED')
        ORDER BY id;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = 'Transaction failed - all changes rolled back';
    END;
    
    SET p_cancelled_count = 0;
    SET p_success = FALSE;
    
    START TRANSACTION;
    
    -- Savepoint: Validate resource exists
    SAVEPOINT sp_validate_resource;
    
    IF NOT EXISTS (SELECT 1 FROM resources WHERE id = p_resource_id) THEN
        SET p_message = 'Resource not found';
        ROLLBACK TO SAVEPOINT sp_validate_resource;
        ROLLBACK;
        LEAVE;
    END IF;
    
    -- Savepoint: Before processing bookings
    SAVEPOINT sp_process_bookings;
    
    OPEN bookings_cursor;
    
    read_loop: LOOP
        FETCH bookings_cursor INTO booking_id_var, booking_user_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Savepoint for each booking operation
        SET @sp_name = CONCAT('sp_booking_', booking_id_var);
        SAVEPOINT sp_booking;
        
        -- Update booking status
        UPDATE bookings
        SET status = 'REJECTED',
            rejection_reason = p_cancel_reason,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = booking_id_var;
        
        -- Create individual audit log entry
        INSERT INTO audit_logs (action, user_id, resource_id, booking_id, action_details)
        VALUES ('BOOKING_BULK_CANCELLED', p_admin_user_id, p_resource_id, booking_id_var,
                JSON_OBJECT('cancelReason', p_cancel_reason, 'originalUser', booking_user_id));
        
        SET p_cancelled_count = p_cancelled_count + 1;
    END LOOP;
    
    CLOSE bookings_cursor;
    
    -- Savepoint: Before final summary log
    SAVEPOINT sp_summary_log;
    
    -- Create summary audit log
    INSERT INTO audit_logs (action, user_id, resource_id, action_details)
    VALUES ('BULK_CANCEL_SUMMARY', p_admin_user_id, p_resource_id,
            JSON_OBJECT('cancelledCount', p_cancelled_count, 'reason', p_cancel_reason));
    
    COMMIT;
    SET p_success = TRUE;
    SET p_message = CONCAT('Successfully cancelled ', p_cancelled_count, ' bookings');
END//

DELIMITER ;

-- ================================================================================
-- DEMONSTRATION OUTPUTS AND USAGE EXAMPLES
-- ================================================================================
-- These are example outputs showing how the transactions would be used:

-- OUTPUT 1: CREATE BOOKING TRANSACTION
-- CALL TransactionCreateBooking(1, 1, '2026-05-15', '09:00:00', '11:00:00', @booking_id, @success, @msg);
-- SELECT @booking_id as booking_id, @success as success, @msg as message;
-- Expected Output:
-- | booking_id | success | message                           |
-- |------------|---------|-----------------------------------|
-- | 1          | 1       | Booking created successfully      |

-- OUTPUT 2: APPROVE BOOKING TRANSACTION
-- CALL TransactionApproveBooking(1, 5, @success, @msg);
-- SELECT @success as success, @msg as message;
-- Expected Output:
-- | success | message                        |
-- |---------|--------------------------------|
-- | 1       | Booking approved successfully  |

-- OUTPUT 3: REJECT BOOKING WITH REASON TRANSACTION
-- CALL TransactionRejectBooking(2, 5, 'Resource maintenance scheduled', @success, @msg);
-- SELECT @success as success, @msg as message;
-- Expected Output:
-- | success | message                        |
-- |---------|--------------------------------|
-- | 1       | Booking rejected successfully  |

-- OUTPUT 4: UPDATE RESOURCE STATUS TRANSACTION
-- CALL TransactionUpdateResourceStatus(1, FALSE, 5, @success, @msg);
-- SELECT @success as success, @msg as message;
-- Expected Output:
-- | success | message                                          |
-- |---------|--------------------------------------------------|
-- | 1       | Resource status updated. Pending bookings: 2     |

-- OUTPUT 5: BULK CANCEL BOOKINGS TRANSACTION
-- CALL TransactionBulkCancelBookings(1, 'Lab maintenance from 2026-05-20 to 2026-05-25', 5, @count, @success, @msg);
-- SELECT @count as cancelled_count, @success as success, @msg as message;
-- Expected Output:
-- | cancelled_count | success | message                          |
-- |-----------------|---------|----------------------------------|
-- | 5               | 1       | Successfully cancelled 5 bookings|

-- ================================================================================
-- QUERY DEMONSTRATION: View Transaction Audit Trail
-- ================================================================================
-- SELECT * FROM audit_logs
-- WHERE action IN ('BOOKING_CREATED', 'BOOKING_APPROVED', 'BOOKING_REJECTED', 
--                  'RESOURCE_STATUS_UPDATED', 'BOOKING_BULK_CANCELLED', 'BULK_CANCEL_SUMMARY')
-- ORDER BY timestamp DESC
-- LIMIT 10;
