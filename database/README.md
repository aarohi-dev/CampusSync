# Database Documentation

## Overview

Campus Sync uses MySQL 8.0+ with a normalized relational design to ensure data integrity and prevent booking conflicts.

## Database Architecture

### Design Principles

1. **Normalization**: Third Normal Form (3NF) applied
2. **Foreign Keys**: Referential integrity enforced
3. **Indexes**: Optimized for common queries
4. **Constraints**: Date, time, and category validations
5. **Triggers**: Database-level conflict prevention

### Entity-Relationship Diagram

```
  ┌────────┐         ┌───────┐         ┌──────────────┐
  │ roles  │ ◄─────┬─┤ users ├─┐       │ audit_logs   │
  └────────┘       │ └───────┘ │       └──────────────┘
                   │           │
                   │     ┌─────▼──────┐
                   │     │ bookings   │
                   │     └─────┬──────┘
                   │           │
                   └──────┬────┘
                          │
                     ┌────▼────────┐
                     │ resources   │
                     └─────────────┘
```

## Tables

### 1. roles

Stores user roles and permissions.

```sql
CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_name VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id` - Primary key
- `role_name` - Role identifier (STUDENT, FACULTY, ADMIN)
- `created_at` - Timestamp created

**Sample Data:**
```
id | role_name
---|----------
1  | STUDENT
2  | FACULTY
3  | ADMIN
```

### 2. users

Stores user account information.

```sql
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
```

**Fields:**
- `id` - Primary key
- `name` - User's full name
- `email` - Email (unique)
- `password` - Bcrypt hashed password
- `role_id` - Foreign key to roles
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

**Indexes:**
- `idx_email` - Fast email lookups for login
- `idx_role_id` - Role-based queries

**Constraints:**
- Email must be unique (no duplicate accounts)
- Role cannot be deleted if users exist

### 3. resources

Campus resources available for booking.

```sql
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
```

**Fields:**
- `id` - Primary key
- `name` - Resource name
- `type` - Type (lab, seminar_hall, projector)
- `location` - Physical location
- `capacity` - Number of people that can use
- `is_active` - Whether available for booking
- `created_at` - Creation timestamp
- `updated_at` - Last modification timestamp

**Indexes:**
- `idx_type` - Filter resources by type
- `idx_is_active` - Show only active resources

**Sample Data:**
```
id | name              | type          | location               | capacity | is_active
---|-------------------|-----------    |------------------------| ---------|----------
1  | Computer Lab A    | lab           | Building A, 2nd Floor  | 30       | 1
2  | Computer Lab B    | lab           | Building B, 3rd Floor  | 25       | 1
3  | Seminar Hall 101  | seminar_hall  | Building A, 1st Floor  | 50       | 1
```

### 4. bookings

Booking requests for resources.

```sql
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
  INDEX idx_user_id (user_id),
  INDEX idx_resource_id (resource_id),
  INDEX idx_status (status),
  INDEX idx_date (booking_date),
  INDEX idx_resource_date (resource_id, booking_date, status),
  CONSTRAINT check_time CHECK (start_time < end_time)
);
```

**Fields:**
- `id` - Primary key
- `user_id` - Foreign key to users
- `resource_id` - Foreign key to resources
- `booking_date` - Date of booking
- `start_time` - Start time (HH:MM:SS)
- `end_time` - End time (HH:MM:SS)
- `status` - PENDING, APPROVED, or REJECTED
- `rejection_reason` - Why booking was rejected
- `created_at` - Request submission timestamp
- `updated_at` - Last status change timestamp

**Indexes:**
- `idx_user_id` - Find user's bookings
- `idx_resource_id` - Find resource's bookings
- `idx_status` - Filter by status
- `idx_date` - Filter by date
- `idx_resource_date` - Critical: find conflicts for a resource

**Constraints:**
- `check_time` - Ensures start_time < end_time
- Foreign keys enforce referential integrity

**Status Flow:**
```
PENDING → APPROVED (approved by admin)
       ↓
       REJECTED (rejected by admin)
```

### 5. audit_logs

Tracks all system actions for compliance and debugging.

```sql
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
```

**Fields:**
- `id` - Primary key
- `action` - Action type (e.g., BOOKING_APPROVED, USER_LOGIN)
- `user_id` - Who performed the action
- `resource_id` - Related resource (nullable)
- `booking_id` - Related booking (nullable)
- `action_details` - JSON with additional context
- `timestamp` - When action occurred

**Indexes:**
- `idx_user_id` - Track user's actions
- `idx_timestamp` - Time-based queries

**Sample Actions:**
- USER_REGISTRATION
- USER_LOGIN
- BOOKING_CREATED
- BOOKING_APPROVED
- BOOKING_REJECTED
- BOOKING_CANCELLED
- RESOURCE_CREATED
- RESOURCE_UPDATED
- RESOURCE_DELETED

## Triggers

### check_booking_overlap

Prevents double-booking at the database level:

```sql
CREATE TRIGGER check_booking_overlap BEFORE INSERT ON bookings
FOR EACH ROW
BEGIN
  DECLARE overlap_count INT;
  
  SELECT COUNT(*) INTO overlap_count
  FROM bookings
  WHERE resource_id = NEW.resource_id
    AND booking_date = NEW.booking_date
    AND status = 'APPROVED'
    AND (NEW.start_time < end_time AND NEW.end_time > start_time);
  
  IF overlap_count > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Resource already booked for this time slot';
  END IF;
END;
```

**Logic:**
- Checks for overlapping APPROVED bookings
- Prevents insertion if conflict found
- Time overlap check: `start_time < end_time AND end_time > start_time`

## Critical Queries

### Check for Booking Conflicts

```sql
-- Find overlapping APPROVED bookings
SELECT COUNT(*) as overlap_count
FROM bookings
WHERE resource_id = 1
  AND booking_date = '2024-02-20'
  AND status = 'APPROVED'
  AND ('09:00:00' < end_time AND '11:00:00' > start_time);
```

### Get User's Bookings

```sql
SELECT 
  b.*,
  r.name as resource_name,
  r.type as resource_type,
  r.location
FROM bookings b
JOIN resources r ON b.resource_id = r.id
WHERE b.user_id = 1
ORDER BY b.booking_date DESC, b.start_time DESC;
```

### Get Admin Pending Bookings

```sql
SELECT 
  b.*,
  u.name as user_name,
  u.email as user_email,
  r.name as resource_name
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN resources r ON b.resource_id = r.id
WHERE b.status = 'PENDING'
ORDER BY b.created_at ASC;
```

### Resource Availability for a Date

```sql
-- Find booked time slots for a resource
SELECT start_time, end_time
FROM bookings
WHERE resource_id = 1
  AND booking_date = '2024-02-20'
  AND status = 'APPROVED'
ORDER BY start_time;
```

### Audit Trail for a User

```sql
SELECT *
FROM audit_logs
WHERE user_id = 1
ORDER BY timestamp DESC
LIMIT 50;
```

## Performance Optimization

### Index Usage

1. **idx_email** - Login queries
2. **idx_resource_date** - Conflict checking (most critical)
3. **idx_status** - Filter bookings by status
4. **idx_user_id** - User-specific queries

### Query Optimization

```sql
-- Good: Uses resource_date index
SELECT * FROM bookings
WHERE resource_id = 1
  AND booking_date = '2024-02-20'
  AND status = 'APPROVED';

-- Less efficient: Doesn't use optimal index
SELECT * FROM bookings
WHERE status = 'PENDING'
  AND resource_id = 1;
```

## Data Integrity

### Foreign Key Constraints

1. **users.role_id** → **roles.id**
   - ON DELETE RESTRICT (can't delete role if users exist)

2. **bookings.user_id** → **users.id**
   - ON DELETE CASCADE (delete bookings when user deleted)

3. **bookings.resource_id** → **resources.id**
   - ON DELETE RESTRICT (can't delete resource with bookings)

### CHECK Constraints

```sql
-- Ensure start_time < end_time
CONSTRAINT check_time CHECK (start_time < end_time)
```

## Backup and Recovery

### Backup Database

```bash
# Full backup
mysqldump -u root -p campus_sync > backup.sql

# With timestamp
mysqldump -u root -p campus_sync > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database

```bash
mysql -u root -p campus_sync < backup.sql
```

## Database Maintenance

### Check Table Integrity

```sql
CHECK TABLE bookings;
CHECK TABLE users;
CHECK TABLE resources;
```

### Optimize Tables

```sql
OPTIMIZE TABLE bookings;
OPTIMIZE TABLE users;
OPTIMIZE TABLE resources;
```

### View Table Statistics

```sql
SELECT 
  TABLE_NAME,
  TABLE_ROWS,
  ROUND(DATA_LENGTH / 1024 / 1024, 2) as 'Size(MB)'
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'campus_sync';
```

## Data Validation Rules

### Bookings
- Start time must be before end time
- Booking date cannot be in the past
- Resource must exist and be active
- User must exist

### Resources
- Capacity must be ≥ 1
- Type must be one of: lab, seminar_hall, projector
- Name and location required

### Users
- Email must be unique
- Valid email format
- Password minimum 6 characters
- Role must exist

## Migration Guide

If upgrading or modifying schema:

```sql
-- Add new column (example)
ALTER TABLE bookings ADD COLUMN notes VARCHAR(500);

-- Modify column
ALTER TABLE users MODIFY COLUMN name VARCHAR(150);

-- Drop old column
ALTER TABLE bookings DROP COLUMN old_column;

-- Recreate index
DROP INDEX idx_resource_date ON bookings;
CREATE INDEX idx_resource_date ON bookings(resource_id, booking_date, status);
```

---

For more information, see the main [README.md](../README.md)
