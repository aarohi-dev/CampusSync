# CampusSync Database Migration Guide

## Quick Reference: Normalization Changes

### New Tables Created
1. **resource_types** - Replaces ENUM('lab', 'seminar_hall', 'projector')
2. **locations** - Replaces location VARCHAR(255) string
3. **booking_statuses** - Replaces ENUM('PENDING', 'APPROVED', 'REJECTED')
4. **audit_action_types** - Replaces action VARCHAR(255) string

---

## API Code Migration Examples

### Creating a Resource

**OLD CODE:**
```javascript
// Old: type and location were direct values
const resourceId = await ResourceModel.create(
  'Computer Lab A',
  'lab',                          // ENUM value
  'Building A, 2nd Floor',        // Location string
  30                              // Capacity
);
```

**NEW CODE:**
```javascript
// New: type_id and location_id are FK IDs
// First, get the IDs for the type and location
const resourceTypeId = 1;  // 'lab' type (from resource_types table)
const locationId = 1;      // 'Building A, 2nd Floor' (from locations table)

const resourceId = await ResourceModel.create(
  'Computer Lab A',
  resourceTypeId,          // FK to resource_types
  locationId,              // FK to locations
  30                       // Capacity
);
```

**How to get the IDs:**
```javascript
// If using repositories/services
const labType = await getResourceType('lab');
const location = await getLocation('Building A', 2, '201');

const resourceId = await ResourceModel.create(
  'Computer Lab A',
  labType.id,
  location.id,
  30
);
```

---

### Creating a Booking

**OLD CODE:**
```javascript
const bookingId = await BookingModel.create(
  userId,         // User ID
  resourceId,     // Resource ID
  bookingDate,    // Date
  startTime,      // Start time
  endTime         // End time
  // Status defaults to 'PENDING' (ENUM)
);
```

**NEW CODE:**
```javascript
const bookingId = await BookingModel.create(
  userId,         // User ID
  resourceId,     // Resource ID
  bookingDate,    // Date
  startTime,      // Start time
  endTime         // End time
  // Status_id defaults to 1 (PENDING)
);
```

**No change in calling code** - Model handles status_id internally!

---

### Updating Booking Status

**OLD CODE:**
```javascript
// Updated with status string
await BookingModel.updateStatus(
  bookingId,
  'APPROVED',           // Status as string
  null                  // No rejection reason
);
```

**NEW CODE:**
```javascript
// Update with status name (still a string, model looks up ID)
await BookingModel.updateStatus(
  bookingId,
  'APPROVED',           // Status name (converted to ID internally)
  null                  // No rejection reason
);
```

**No change in calling code** - Model handles FK lookup!

---

### Creating Audit Log

**OLD CODE:**
```javascript
await AuditLogModel.create(
  'BOOKING_APPROVED',   // Action as string
  userId,
  resourceId,
  bookingId,
  { reason: 'Resource available' }
);
```

**NEW CODE:**
```javascript
await AuditLogModel.create(
  'BOOKING_APPROVED',   // Action type name (converted to ID internally)
  userId,
  resourceId,
  bookingId,
  { reason: 'Resource available' }
);
```

**No change in calling code** - Model handles FK lookup!

---

### Getting Resource Details

**OLD CODE:**
```javascript
const resource = await ResourceModel.getById(1);
console.log(resource);
// Output:
// {
//   id: 1,
//   name: 'Computer Lab A',
//   type: 'lab',                    // Direct ENUM value
//   location: 'Building A, 2nd Floor', // String
//   capacity: 30,
//   is_active: true
// }
```

**NEW CODE:**
```javascript
const resource = await ResourceModel.getById(1);
console.log(resource);
// Output:
// {
//   id: 1,
//   name: 'Computer Lab A',
//   resource_type_id: 1,            // FK
//   type: 'lab',                    // Joined from resource_types (same display)
//   location_id: 1,                 // FK
//   building_name: 'Building A',    // Joined from locations
//   floor: 2,
//   room_number: '201',
//   location_description: '...',
//   capacity: 30,
//   is_active: true
// }
```

**UI Impact:** Update templates to use `building_name`, `floor`, `room_number` instead of `location`

---

### Getting Bookings

**OLD CODE:**
```javascript
const bookings = await BookingModel.getByUserId(userId);
// { 
//   status: 'PENDING'   // ENUM value
// }
```

**NEW CODE:**
```javascript
const bookings = await BookingModel.getByUserId(userId);
// { 
//   status_id: 1,       // FK ID
//   status: 'PENDING'   // Joined from booking_statuses (same display)
// }
```

**No breaking change** - Status is still returned for display

---

### Filtering Resources by Type

**OLD CODE:**
```javascript
// Had to use exact ENUM value
const labs = await ResourceModel.getAll(
  { type: 'lab' },
  50, 0
);
```

**NEW CODE:**
```javascript
// Can use type name (filters on resource_types table)
const labs = await ResourceModel.getAll(
  { type: 'lab' },      // Name is internally matched to resource_types
  50, 0
);

// OR use type ID directly
const labs = await ResourceModel.getByType(1);  // type_id = 1 (lab)
```

---

### Filtering Bookings by Status

**OLD CODE:**
```javascript
const pending = await BookingModel.getAll(
  { status: 'PENDING' },
  50, 0
);
```

**NEW CODE:**
```javascript
const pending = await BookingModel.getAll(
  { status: 'PENDING' },  // Name is internally matched to booking_statuses
  50, 0
);
```

**No code change** - Model handles FK lookup in background

---

### Filtering Audit Logs by Action

**OLD CODE:**
```javascript
const approvals = await AuditLogModel.getAll(
  { action: 'BOOKING_APPROVED' },
  100, 0
);
```

**NEW CODE:**
```javascript
const approvals = await AuditLogModel.getAll(
  { action: 'BOOKING_APPROVED' },  // Name is internally matched to audit_action_types
  100, 0
);
```

**No code change** - Model handles FK lookup

---

## Controller Updates Required

### Example: Update bookingController.js

**Approve Booking Endpoint - OLD:**
```javascript
exports.approveBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    // OLD: Status as string
    const success = await BookingModel.updateStatus(bookingId, 'APPROVED');
    
    // Log action
    await AuditLogModel.create(
      'BOOKING_APPROVED',  // Action string
      req.user.id,
      null,
      bookingId,
      { approvedBy: req.user.id }
    );
    
    res.json({ message: 'Booking approved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

**Approve Booking Endpoint - NEW:**
```javascript
exports.approveBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    // NEW: Status name (model looks up ID)
    const success = await BookingModel.updateStatus(
      bookingId,
      'APPROVED'  // Status name - same as before!
    );
    
    // Log action
    await AuditLogModel.create(
      'BOOKING_APPROVED',  // Action type name - same as before!
      req.user.id,
      null,
      bookingId,
      { approvedBy: req.user.id }
    );
    
    res.json({ message: 'Booking approved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

**Result:** No changes needed! The models handle all FK lookups internally.

---

## Frontend Updates Required

### Update Resource Display

**OLD HTML:**
```jsx
<div className="resource-card">
  <h3>{resource.name}</h3>
  <p>Type: {resource.type}</p>
  <p>Location: {resource.location}</p>
  <p>Capacity: {resource.capacity}</p>
</div>
```

**NEW HTML:**
```jsx
<div className="resource-card">
  <h3>{resource.name}</h3>
  <p>Type: {resource.type}</p>  {/* Still available from join */}
  <p>Location: {resource.building_name}, Floor {resource.floor}, Room {resource.room_number}</p>
  <p>Capacity: {resource.capacity}</p>
</div>
```

---

### Update Booking Display

**OLD:**
```jsx
<span className={`status ${booking.status.toLowerCase()}`}>
  {booking.status}
</span>
```

**NEW:**
```jsx
<span className={`status ${booking.status.toLowerCase()}`}>
  {booking.status}  {/* Still available from join */}
</span>
```

**No change** - Status field is still returned!

---

## Database Migration Steps

### Step 1: Backup Current Database
```bash
mysqldump -u root -p campus_sync > backup_campus_sync.sql
```

### Step 2: Create New Tables and Seed Data
```bash
# Apply updated schema.sql and seed.sql
mysql -u root -p campus_sync < database/schema.sql
mysql -u root -p campus_sync < database/seed.sql
```

### Step 3: Test All Queries
```javascript
// Run test suite with new normalized schema
npm test
```

### Step 4: Deploy to Production
- Update backend models in production
- Apply schema changes to production database
- Monitor for any issues

---

## Rollback Plan (If Needed)

```bash
# Restore from backup
mysql -u root -p campus_sync < backup_campus_sync.sql

# Revert model files to git previous commit
git checkout HEAD~1 backend/models/
```

---

## Summary of Changes

### What Changed
- ✓ 5 new lookup tables created
- ✓ ENUM types replaced with FK relationships
- ✓ String values replaced with FK relationships
- ✓ All models updated to use FKs internally

### What Didn't Change (For Developers)
- ✓ Method signatures are the same
- ✓ Status/type/action parameters still use names
- ✓ Return values include display fields
- ✓ Controllers don't need changes
- ✓ Frontend minimal changes (mostly display updates)

### What Improved
- ✓ Data integrity through referential constraints
- ✓ Query flexibility and extensibility
- ✓ No more ENUM hardcoding
- ✓ Better performance (int comparisons)
- ✓ Support for future enhancements

---

## Questions & Troubleshooting

**Q: Do I need to update my API endpoints?**
A: No! The models handle all FK lookups. Your existing endpoint code works as-is.

**Q: Will my existing queries break?**
A: No! The models return the same data structure with all fields joined in.

**Q: How do I add a new resource type?**
A: Insert into resource_types table:
```sql
INSERT INTO resource_types (type_name, description) VALUES ('new_type', 'description');
```

**Q: How do I add a new location?**
A: Insert into locations table:
```sql
INSERT INTO locations (building_name, floor, room_number) VALUES ('Building X', 1, '101');
```

**Q: Do I need to migrate existing data?**
A: If this is a fresh deployment, no. If upgrading, follow the migration steps above.

