# CampusSync Database Normalization Guide

## Overview
The CampusSync database has been **normalized to 3rd Normal Form (3NF)** to improve data integrity, reduce redundancy, and enhance maintainability. This document explains the normalization process for each table.

---

## Normalization Principles Applied

### 1st Normal Form (1NF)
- Eliminate repeating groups and ENUM types
- Ensure all attributes contain atomic values
- Create lookup tables for enumerated values

### 2nd Normal Form (2NF)
- Remove partial dependencies
- Ensure all non-key attributes depend on the entire primary key
- All attributes are fully dependent on the primary key

### 3rd Normal Form (3NF)
- Remove transitive dependencies
- Ensure non-key attributes depend only on the primary key
- No non-key attribute should depend on another non-key attribute

---

## Table-by-Table Normalization

### 1. **Roles Table** ✓ Already Normalized (1NF, 2NF, 3NF)

**Original:**
```sql
CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_name VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Status:** No changes needed - already normalized
- Single atomic values
- Unique identifier (id)
- No partial or transitive dependencies

---

### 2. **Resource Types Table** (NEW - Addresses 1NF Violation)

**Problem with Original:**
```sql
type ENUM('lab', 'seminar_hall', 'projector')  -- Violates 1NF
```
- ENUM values were hardcoded in the column definition
- Not easily extensible without ALTER TABLE
- Values weren't stored as separate entities

**Solution - New Table:**
```sql
CREATE TABLE resource_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type_name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Benefits:**
- ✓ Separates concerns (type definition from resources)
- ✓ Easily extensible without schema changes
- ✓ Reusable across multiple resources
- ✓ Follows 1NF: atomic, independent entity

---

### 3. **Locations Table** (NEW - Addresses 1NF Violation)

**Problem with Original:**
```sql
location VARCHAR(255) NOT NULL  -- String representation of location
-- Example: 'Building A, 2nd Floor' is a composite value
```
- Location was stored as unstructured text
- Difficult to query by building or floor
- Redundant location data across resources

**Solution - New Table:**
```sql
CREATE TABLE locations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  building_name VARCHAR(100) NOT NULL,
  floor INT,
  room_number VARCHAR(20),
  description VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_location (building_name, floor, room_number)
);
```

**Benefits:**
- ✓ Decomposes composite location into atomic attributes
- ✓ Enables location-based filtering (building, floor)
- ✓ Supports future geolocation features (coordinates)
- ✓ Reduces data redundancy
- ✓ Follows 1NF & 3NF

---

### 4. **Booking Statuses Table** (NEW - Addresses 1NF Violation)

**Problem with Original:**
```sql
status ENUM('PENDING', 'APPROVED', 'REJECTED')  -- Violates 1NF
```
- Status values hardcoded in the column
- Not extensible without schema changes
- Different from resource statuses

**Solution - New Table:**
```sql
CREATE TABLE booking_statuses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  status_name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed data:
-- 1: PENDING
-- 2: APPROVED
-- 3: REJECTED
```

**Benefits:**
- ✓ Eliminates ENUM hardcoding
- ✓ Status is now a first-class entity
- ✓ Extensible for new statuses
- ✓ Follows 1NF: atomic, independent

---

### 5. **Audit Action Types Table** (NEW - Addresses 1NF Violation)

**Problem with Original:**
```sql
action VARCHAR(255) NOT NULL  -- String representation
-- Examples: 'BOOKING_APPROVED', 'RESOURCE_CREATED', etc.
```
- Actions stored as unstructured strings
- Prone to typos and inconsistency
- Difficult to maintain list of valid actions
- No validation at DB level

**Solution - New Table:**
```sql
CREATE TABLE audit_action_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  action_type VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed data includes standard actions:
-- BOOKING_CREATED, BOOKING_APPROVED, BOOKING_REJECTED, etc.
```

**Benefits:**
- ✓ Centralizes action type definitions
- ✓ Enables referential integrity
- ✓ Prevents invalid action entries
- ✓ Follows 1NF: atomic, independent

---

### 6. **Users Table** (Updated - Already 2NF/3NF, Enhanced)

**Changes:**
```sql
-- OLD
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_id INT NOT NULL,
  ...
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- NEW (Enhanced)
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_id INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,  -- NEW: Soft delete support
  ...
  FOREIGN KEY (role_id) REFERENCES roles(id),
  INDEX idx_is_active (is_active)
);
```

**Status:**
- ✓ Already normalized (FK to roles table)
- ✓ Added `is_active` flag for soft deletes
- ✓ Maintains referential integrity

---

### 7. **Resources Table** (Updated - Addresses 1NF Violations)

**Before (Denormalized):**
```sql
CREATE TABLE resources (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  type ENUM('lab', 'seminar_hall', 'projector'),  -- 1NF violation
  location VARCHAR(255) NOT NULL,                  -- Composite data
  capacity INT NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE
);
```

**After (Normalized):**
```sql
CREATE TABLE resources (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  resource_type_id INT NOT NULL,      -- FK to resource_types
  location_id INT NOT NULL,            -- FK to locations
  capacity INT NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (resource_type_id) REFERENCES resource_types(id),
  FOREIGN KEY (location_id) REFERENCES locations(id),
  INDEX idx_resource_type_id (resource_type_id),
  INDEX idx_location_id (location_id)
);
```

**Normalization Applied:**
- ✓ **1NF:** Replaced ENUM with FK to resource_types
- ✓ **1NF:** Replaced location string with FK to locations
- ✓ **2NF:** All attributes fully depend on resource_id
- ✓ **3NF:** No transitive dependencies

**Benefits:**
- ✓ Type and location now separate, reusable entities
- ✓ Eliminates ENUM schema changes
- ✓ Enables complex location queries
- ✓ Consistent type definitions

---

### 8. **Bookings Table** (Updated - Addresses 1NF Violation)

**Before (Denormalized):**
```sql
CREATE TABLE bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  resource_id INT NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED'),  -- 1NF violation
  rejection_reason VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (resource_id) REFERENCES resources(id)
);
```

**After (Normalized):**
```sql
CREATE TABLE bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  resource_id INT NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status_id INT NOT NULL,              -- FK to booking_statuses
  rejection_reason VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (resource_id) REFERENCES resources(id),
  FOREIGN KEY (status_id) REFERENCES booking_statuses(id)
);
```

**Normalization Applied:**
- ✓ **1NF:** Replaced ENUM status with FK to booking_statuses
- ✓ **2NF:** All attributes fully depend on booking_id
- ✓ **3NF:** No transitive dependencies

**Migration Example:**
```sql
-- Map old status values to new IDs
UPDATE bookings SET status_id = 1 WHERE status = 'PENDING';
UPDATE bookings SET status_id = 2 WHERE status = 'APPROVED';
UPDATE bookings SET status_id = 3 WHERE status = 'REJECTED';
```

---

### 9. **Audit Logs Table** (Updated - Addresses 1NF Violation)

**Before (Denormalized):**
```sql
CREATE TABLE audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  action VARCHAR(255) NOT NULL,  -- String representation (1NF violation)
  user_id INT NOT NULL,
  resource_id INT,
  booking_id INT,
  action_details JSON,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**After (Normalized):**
```sql
CREATE TABLE audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  action_type_id INT NOT NULL,    -- FK to audit_action_types
  user_id INT NOT NULL,
  resource_id INT,
  booking_id INT,
  action_details JSON,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (action_type_id) REFERENCES audit_action_types(id),
  INDEX idx_action_type_id (action_type_id)
);
```

**Normalization Applied:**
- ✓ **1NF:** Replaced action string with FK to audit_action_types
- ✓ **2NF:** All attributes fully depend on audit_log_id
- ✓ **3NF:** No transitive dependencies
- ✓ Prevents invalid action types

---

## Data Migration Strategy

### Step 1: Create New Lookup Tables
```sql
-- Insert resource types
INSERT INTO resource_types (type_name) VALUES ('lab'), ('seminar_hall'), ('projector');

-- Insert booking statuses
INSERT INTO booking_statuses (status_name) VALUES ('PENDING'), ('APPROVED'), ('REJECTED');

-- Insert audit action types
INSERT INTO audit_action_types (action_type) VALUES 
  ('BOOKING_CREATED'), ('BOOKING_APPROVED'), ('BOOKING_REJECTED'),
  ('RESOURCE_CREATED'), ('RESOURCE_UPDATED'), ...;

-- Insert locations (after decomposing location strings)
-- ...
```

### Step 2: Migrate Foreign Keys
```sql
-- Map old ENUM values to new FKs
UPDATE resources r
JOIN resource_types rt ON r.type = rt.type_name
SET r.resource_type_id = rt.id;

UPDATE bookings b
JOIN booking_statuses bs ON b.status = bs.status_name
SET b.status_id = bs.id;

UPDATE audit_logs al
JOIN audit_action_types aat ON al.action = aat.action_type
SET al.action_type_id = aat.id;
```

### Step 3: Drop Old Columns
```sql
-- After verifying all data migrated
ALTER TABLE resources DROP COLUMN type, DROP COLUMN location;
ALTER TABLE bookings DROP COLUMN status;
ALTER TABLE audit_logs DROP COLUMN action;
```

---

## Code Changes Summary

### Model Updates

#### **UserModel** (`userModel.js`)
- ✓ Added `is_active` field support
- ✓ Queries now include active status filtering
- ✓ Added `deactivate()` method for soft deletes
- ✓ Maintained existing role joins

#### **ResourceModel** (`resourceModel.js`)
- ✓ Replaced `type` ENUM with `resource_type_id` FK
- ✓ Replaced `location` string with `location_id` FK
- ✓ Queries now join `resource_types` and `locations` tables
- ✓ `create()` method now requires `resource_type_id` and `location_id`
- ✓ `getAll()` supports filtering by building name
- ✓ Added `getByType()` method (queries by type ID)

#### **BookingModel** (`bookingModel.js`)
- ✓ Replaced `status` ENUM with `status_id` FK
- ✓ Queries now join `booking_statuses` table
- ✓ `create()` automatically assigns PENDING status (status_id = 1)
- ✓ `updateStatus()` now takes status name and looks up ID
- ✓ Overlap checks now use status_id instead of status string
- ✓ Added `getByDateRange()` method for range queries
- ✓ Added `cancel()` method for soft deletes

#### **AuditLogModel** (`auditLogModel.js`)
- ✓ Replaced `action` string with `action_type_id` FK
- ✓ Queries now join `audit_action_types` table
- ✓ `create()` now takes action type name and looks up ID
- ✓ `getAll()` supports filtering by action type name
- ✓ All results include `action` field for display

---

## Benefits of Normalization

### Data Integrity
- ✓ Referential integrity through FKs
- ✓ No orphaned records (FKs prevent deletion of parent records)
- ✓ Prevents invalid status/type/action values
- ✓ Database-level validation

### Query Flexibility
- ✓ Filter by resource type name instead of hardcoded ENUM
- ✓ Filter by location attributes (building, floor, room)
- ✓ Filter by action type name
- ✓ Join with lookup tables for detailed reports

### Maintainability
- ✓ Adding new types/statuses/actions doesn't require schema changes
- ✓ Centralized definitions (single source of truth)
- ✓ Easier to audit and track data changes
- ✓ Clear table relationships and dependencies

### Performance
- ✓ Lookup tables are small (fast joins)
- ✓ Proper indexes on FK columns
- ✓ Reduced string comparisons in WHERE clauses
- ✓ Integer comparisons faster than string comparisons

### Scalability
- ✓ Schema supports multiple environments
- ✓ Easy to add new resource types, statuses, or actions
- ✓ Consistent with SQL best practices
- ✓ Ready for future extensions (soft deletes, audit trails, etc.)

---

## Example Queries - Before vs After

### Example 1: Get all Computer Labs

**Before (Denormalized):**
```sql
-- Had to use ENUM value directly
SELECT * FROM resources 
WHERE type = 'lab' AND is_active = TRUE;
```

**After (Normalized):**
```sql
-- Uses FK join with lookup table
SELECT r.* FROM resources r
JOIN resource_types rt ON r.resource_type_id = rt.id
WHERE rt.type_name = 'lab' AND r.is_active = TRUE;
```

**Benefits:**
- ✓ Type name is now configurable
- ✓ Easy to join with type description
- ✓ No hardcoded ENUM values

---

### Example 2: Get all approved bookings for a resource

**Before (Denormalized):**
```sql
SELECT * FROM bookings 
WHERE resource_id = 1 AND status = 'APPROVED';
```

**After (Normalized):**
```sql
SELECT b.* FROM bookings b
JOIN booking_statuses bs ON b.status_id = bs.id
WHERE b.resource_id = 1 AND bs.status_name = 'APPROVED';
```

**Benefits:**
- ✓ Status description available for display
- ✓ Integer comparison is faster
- ✓ FK ensures only valid statuses exist

---

### Example 3: Get all user actions with details

**Before (Denormalized):**
```sql
SELECT * FROM audit_logs 
WHERE user_id = 5 AND action = 'BOOKING_APPROVED';
```

**After (Normalized):**
```sql
SELECT al.id, al.timestamp, aat.action_type, aat.description
FROM audit_logs al
JOIN audit_action_types aat ON al.action_type_id = aat.id
WHERE al.user_id = 5 AND aat.action_type = 'BOOKING_APPROVED';
```

**Benefits:**
- ✓ Can include action description
- ✓ Prevents typos in action names
- ✓ Easy to audit all valid action types

---

## Testing Checklist

- [ ] All lookup tables populated with seed data
- [ ] FK relationships properly configured
- [ ] Model methods return correct data structure
- [ ] Queries with JOINs perform well
- [ ] No orphaned records after cascading operations
- [ ] Soft deletes work correctly
- [ ] Audit logs capture all action types
- [ ] Old ENUM values no longer appear in queries

---

## Conclusion

Your CampusSync database is now **fully normalized to 3NF**. The schema provides:
- ✓ Better data integrity through referential constraints
- ✓ Improved query flexibility and maintainability
- ✓ Elimination of ENUM hardcoding
- ✓ Support for future enhancements
- ✓ Consistency with database design best practices
