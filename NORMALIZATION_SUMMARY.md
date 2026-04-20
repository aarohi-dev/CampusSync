# Database Normalization Summary - CampusSync

## What Was Normalized

Your CampusSync database has been **fully normalized to 3rd Normal Form (3NF)**. Here's what was changed:

### 📊 New Lookup Tables Created

| Table | Purpose | Replaces |
|-------|---------|----------|
| `resource_types` | Stores valid resource types (lab, seminar_hall, projector) | ENUM in resources |
| `locations` | Stores building/floor/room information | VARCHAR location string |
| `booking_statuses` | Stores valid booking statuses (PENDING, APPROVED, REJECTED) | ENUM in bookings |
| `audit_action_types` | Stores valid audit actions (BOOKING_APPROVED, etc.) | VARCHAR action string |

### 🔄 Tables Updated

| Table | Changes |
|-------|---------|
| `resources` | `type` ENUM → `resource_type_id` FK; `location` string → `location_id` FK |
| `bookings` | `status` ENUM → `status_id` FK |
| `audit_logs` | `action` string → `action_type_id` FK |
| `users` | Added `is_active` for soft deletes |

---

## Why Normalization Matters

### ❌ Problems with Denormalized Schema
```sql
-- OLD: ENUM hardcoded in column definition
type ENUM('lab', 'seminar_hall', 'projector')  -- Can't add new types without ALTER TABLE
location VARCHAR(255)  -- Composite data: 'Building A, 2nd Floor' mixes concerns
status ENUM('PENDING', 'APPROVED', 'REJECTED')  -- Change requires schema modification
action VARCHAR(255)  -- Any string accepted, no validation
```

### ✅ Benefits of Normalized Schema
- **Data Integrity:** Foreign keys prevent invalid values
- **Extensibility:** Add new types/statuses/actions without schema changes
- **Maintainability:** Single source of truth for valid values
- **Query Flexibility:** Can filter by building name, floor number, etc.
- **Performance:** Integer lookups faster than string comparisons

---

## Key Changes by Table

### 1. Resources Table

**Before:**
```javascript
{
  id: 1,
  name: 'Computer Lab A',
  type: 'lab',  // ENUM value - hardcoded
  location: 'Building A, 2nd Floor',  // Composite string
  capacity: 30
}
```

**After:**
```javascript
{
  id: 1,
  name: 'Computer Lab A',
  resource_type_id: 1,  // FK to resource_types
  type: 'lab',  // Joined for display
  location_id: 1,  // FK to locations
  building_name: 'Building A',  // Joined from locations
  floor: 2,
  room_number: '201',
  capacity: 30
}
```

**Model Changes:**
- `create()` now requires `resourceTypeId` and `locationId`
- `getAll()` can filter by `building_name`
- `getByType(typeId)` replaces type-based lookup

---

### 2. Bookings Table

**Before:**
```javascript
{
  id: 1,
  user_id: 1,
  resource_id: 1,
  status: 'PENDING',  // ENUM value - hardcoded
  booking_date: '2024-04-20'
}
```

**After:**
```javascript
{
  id: 1,
  user_id: 1,
  resource_id: 1,
  status_id: 1,  // FK to booking_statuses
  status: 'PENDING',  // Joined for display
  booking_date: '2024-04-20'
}
```

**Model Changes:**
- `create()` automatically sets `status_id` to PENDING (1)
- `updateStatus('APPROVED')` internally looks up `status_id`
- `cancel()` new method for soft deletes
- All queries still accept status names, not IDs

---

### 3. Audit Logs Table

**Before:**
```javascript
{
  id: 1,
  action: 'BOOKING_APPROVED',  // String - any value accepted
  user_id: 1,
  booking_id: 5,
  timestamp: '2024-04-20 10:30:00'
}
```

**After:**
```javascript
{
  id: 1,
  action_type_id: 2,  // FK to audit_action_types
  action: 'BOOKING_APPROVED',  // Joined for display
  user_id: 1,
  booking_id: 5,
  timestamp: '2024-04-20 10:30:00'
}
```

**Model Changes:**
- `create()` takes action type name, internally looks up ID
- Prevents typos and invalid action types
- `getAll()` can filter by action type name

---

## Normalization Process Explained

### First Normal Form (1NF) - Atomic Values
**Rule:** No repeating groups; all values must be atomic (indivisible)

**Applied to:**
- ✓ Replaced ENUM `type` with FK to `resource_types` table
- ✓ Replaced ENUM `status` with FK to `booking_statuses` table
- ✓ Replaced string `action` with FK to `audit_action_types` table
- ✓ Replaced composite `location` string with FK to `locations` table with individual fields

### Second Normal Form (2NF) - No Partial Dependencies
**Rule:** All non-key attributes must depend on the entire primary key

**Applied to:**
- ✓ All tables have single-column primary keys
- ✓ All attributes depend on the full primary key
- ✓ No subset of the key determines any attribute

### Third Normal Form (3NF) - No Transitive Dependencies
**Rule:** Non-key attributes must depend only on the primary key

**Applied to:**
- ✓ `resources.type` no longer depends on `resources.id` through `resources.type` value
- ✓ `resources.location` replaced with proper foreign key relationship
- ✓ All lookup tables (resource_types, locations, etc.) are proper entities with their own PK

---

## What Changes for Developers

### ✅ Minimal Changes Required

1. **API Endpoints:** No changes needed!
   - Models handle FK lookups internally
   - Return values include display fields

2. **Controllers:** No changes needed!
   - Still pass status names: `'APPROVED'`
   - Still pass action names: `'BOOKING_APPROVED'`

3. **Frontend:** Minor updates needed
   - Display location as: `${building_name}, Floor ${floor}, Room ${room_number}`
   - Display type and status: no changes (still in returned data)

### Example: Creating a Resource

```javascript
// OLD - Same concept, different parameters
await ResourceModel.create('Lab A', 'lab', 'Building A, Floor 2', 30);

// NEW - Must look up IDs first
const typeId = 1;  // Get from resource_types table
const locationId = 1;  // Get from locations table
await ResourceModel.create('Lab A', typeId, locationId, 30);
```

### Example: Updating Booking Status

```javascript
// SAME - Both old and new accept status name
await BookingModel.updateStatus(bookingId, 'APPROVED');
```

---

## Database Schema Diagram

```
┌─────────────────┐
│  resource_types │  ← Types (lab, seminar_hall, projector)
├─────────────────┤
│ id (PK)         │
│ type_name       │
│ description     │
└────────┬────────┘
         │
         │ FK
         ▼
┌─────────────────┐      ┌─────────────────┐
│   resources     │      │    locations    │  ← Locations (building, floor, room)
├─────────────────┤      ├─────────────────┤
│ id (PK)         │      │ id (PK)         │
│ name            │      │ building_name   │
│ resource_type_id├──────┤ floor           │
│ location_id     ├─────►│ room_number     │
│ capacity        │      │ latitude        │
└─────────────────┘      └─────────────────┘

┌─────────────────┐      ┌──────────────────┐
│    bookings     │      │ booking_statuses │  ← Statuses (PENDING, APPROVED, REJECTED)
├─────────────────┤      ├──────────────────┤
│ id (PK)         │      │ id (PK)          │
│ user_id (FK)    │      │ status_name      │
│ resource_id (FK)├─────►│ description      │
│ status_id (FK)  │      │                  │
│ booking_date    │      │                  │
└─────────────────┘      └──────────────────┘

┌─────────────────┐      ┌─────────────────────┐
│  audit_logs     │      │audit_action_types   │  ← Actions (BOOKING_APPROVED, etc.)
├─────────────────┤      ├─────────────────────┤
│ id (PK)         │      │ id (PK)             │
│ action_type_id  ├─────►│ action_type         │
│ user_id (FK)    │      │ description         │
│ resource_id (FK)│      │                     │
│ booking_id (FK) │      │                     │
└─────────────────┘      └─────────────────────┘
```

---

## Common Tasks After Normalization

### Adding a New Resource Type
```sql
INSERT INTO resource_types (type_name, description) 
VALUES ('multipurpose_room', 'General purpose room for various activities');
```

### Adding a New Location
```sql
INSERT INTO locations (building_name, floor, room_number, description)
VALUES ('Building D', 3, '301', 'Engineering Lab');
```

### Adding a New Audit Action
```sql
INSERT INTO audit_action_types (action_type, description)
VALUES ('USER_DEACTIVATED', 'User account was deactivated');
```

### Creating a Resource with New FK Values
```javascript
// Get the type and location IDs
const typeId = await getResourceTypeId('lab');
const locationId = await getLocationId('Building A', 2, '201');

// Create resource
const resourceId = await ResourceModel.create(
  'New Lab',
  typeId,
  locationId,
  25
);
```

---

## Testing Checklist

- [ ] All lookup tables populated
- [ ] Foreign key constraints working
- [ ] Cannot insert resource without valid type_id
- [ ] Cannot insert booking without valid status_id
- [ ] Cannot insert audit log without valid action_type_id
- [ ] Cascade deletes work correctly
- [ ] Queries return data with all joins
- [ ] Model methods work with new FK structure
- [ ] API endpoints return correct response format
- [ ] Status/type filters still work (by name)

---

## Performance Impact

### ✅ Positive
- Integer PK/FK lookups faster than string comparisons
- Smaller memory footprint (1-4 byte integers vs strings)
- Better index performance on FK columns
- Reduced redundancy in data

### ⚠️ Considerations
- Additional JOIN operations required
- Lookup tables very small (minimal cost)
- Overall query performance: negligible impact or slight improvement

---

## Documentation Files Created

1. **DATABASE_NORMALIZATION.md** - Complete technical explanation
2. **MIGRATION_GUIDE.md** - Step-by-step migration instructions
3. **NORMALIZATION_SUMMARY.md** (this file) - Quick reference

---

## Next Steps

1. ✅ **Review the changes** - Check DATABASE_NORMALIZATION.md for detailed explanation
2. ✅ **Update your code** - Model files already updated, minimal frontend changes needed
3. ✅ **Test thoroughly** - Run test suite to verify all functionality
4. ✅ **Deploy carefully** - Use MIGRATION_GUIDE.md for step-by-step deployment
5. ✅ **Monitor performance** - Track query performance after deployment

---

## Questions?

Refer to the detailed documentation:
- **Why was this normalized?** → DATABASE_NORMALIZATION.md
- **How do I migrate?** → MIGRATION_GUIDE.md
- **Code examples?** → MIGRATION_GUIDE.md
- **Database design details?** → DATABASE_NORMALIZATION.md

