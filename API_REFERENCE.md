# API Reference

Complete reference for all Campus Sync API endpoints.

## Base URL

```
http://localhost:5000/api
```

## Authentication

Use JWT token in Authorization header:

```
Authorization: Bearer <token>
```

## Response Format

All responses are JSON:

```json
{
  "success": true,
  "message": "Success message",
  "data": { }
}
```

---

## 🔐 Authentication Endpoints

### POST /auth/register

Register a new user.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@campus.edu",
  "password": "password123",
  "confirmPassword": "password123",
  "role": "STUDENT"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": 1,
    "email": "john@campus.edu",
    "name": "John Doe",
    "role": "STUDENT"
  }
}
```

**Errors:**
- `400` - Missing fields or passwords don't match
- `409` - Email already registered

---

### POST /auth/login

Authenticate user and get JWT token.

**Request:**
```json
{
  "email": "john@campus.edu",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@campus.edu",
      "role": "STUDENT"
    }
  }
}
```

**Errors:**
- `400` - Email or password missing
- `401` - Invalid credentials

---

### GET /auth/profile

Get current logged-in user's profile.

**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@campus.edu",
    "role": "STUDENT",
    "created_at": "2024-02-16T10:30:00Z"
  }
}
```

**Errors:**
- `401` - Not authenticated
- `404` - User not found

---

## 📚 Resource Endpoints

### GET /resources

Get all resources with optional filtering.

**Auth Required:** No

**Query Parameters:**
- `page` (int) - Page number (default: 1)
- `type` (string) - Filter by type: lab, seminar_hall, projector
- `is_active` (boolean) - Filter active resources

**Example:**
```
GET /resources?page=1&type=lab
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Computer Lab A",
      "type": "lab",
      "location": "Building A, 2nd Floor",
      "capacity": 30,
      "is_active": true,
      "created_at": "2024-01-15T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

---

### GET /resources/:id

Get specific resource details.

**Auth Required:** No

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Computer Lab A",
    "type": "lab",
    "location": "Building A, 2nd Floor",
    "capacity": 30,
    "is_active": true
  }
}
```

**Errors:**
- `404` - Resource not found

---

### GET /resources/type/:type

Get resources by type.

**Auth Required:** No

**URL Parameters:**
- `type` - One of: lab, seminar_hall, projector

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Computer Lab A",
      "type": "lab",
      "location": "Building A, 2nd Floor",
      "capacity": 30,
      "is_active": true
    }
  ]
}
```

**Errors:**
- `400` - Invalid type

---

### POST /resources

Create new resource (Admin only).

**Auth Required:** Yes (ADMIN)

**Request:**
```json
{
  "name": "Computer Lab C",
  "type": "lab",
  "location": "Building C, 1st Floor",
  "capacity": 35
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Resource created successfully",
  "data": {
    "id": 7,
    "name": "Computer Lab C",
    "type": "lab",
    "location": "Building C, 1st Floor",
    "capacity": 35,
    "is_active": true,
    "created_at": "2024-02-16T12:00:00Z"
  }
}
```

**Errors:**
- `400` - Invalid data or missing fields
- `401` - Not authenticated
- `403` - Not admin

---

### PUT /resources/:id

Update resource (Admin only).

**Auth Required:** Yes (ADMIN)

**Request (partial update):**
```json
{
  "capacity": 40,
  "location": "Building C, 1st Floor, Room 101"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Resource updated successfully",
  "data": {
    "id": 7,
    "name": "Computer Lab C",
    "type": "lab",
    "location": "Building C, 1st Floor, Room 101",
    "capacity": 40,
    "is_active": true
  }
}
```

**Errors:**
- `400` - Invalid data
- `403` - Not admin
- `404` - Resource not found

---

### DELETE /resources/:id

Delete resource (Admin only).

**Auth Required:** Yes (ADMIN)

**Response (200):**
```json
{
  "success": true,
  "message": "Resource deleted successfully"
}
```

**Errors:**
- `403` - Not admin
- `404` - Resource not found

---

## 📅 Booking Endpoints

### POST /bookings

Create new booking request.

**Auth Required:** Yes

**Request:**
```json
{
  "resourceId": 1,
  "bookingDate": "2024-02-20",
  "startTime": "09:00",
  "endTime": "11:00"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": 15,
    "user_id": 1,
    "resource_id": 1,
    "user_name": "John Doe",
    "user_email": "john@campus.edu",
    "resource_name": "Computer Lab A",
    "resource_type": "lab",
    "booking_date": "2024-02-20",
    "start_time": "09:00:00",
    "end_time": "11:00:00",
    "status": "PENDING",
    "created_at": "2024-02-16T10:00:00Z"
  }
}
```

**Errors:**
- `400` - Invalid data or time range
- `401` - Not authenticated
- `404` - Resource not found
- `409` - Time slot already booked

---

### GET /bookings/my-bookings

Get current user's bookings.

**Auth Required:** Yes

**Query Parameters:**
- `page` (int) - Page number

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "user_id": 1,
      "resource_id": 1,
      "resource_name": "Computer Lab A",
      "resource_type": "lab",
      "location": "Building A, 2nd Floor",
      "booking_date": "2024-02-20",
      "start_time": "09:00:00",
      "end_time": "11:00:00",
      "status": "PENDING",
      "created_at": "2024-02-16T10:00:00Z"
    }
  ]
}
```

---

### GET /bookings/availability

Check resource availability for a date.

**Auth Required:** No

**Query Parameters:**
- `resourceId` (int) - Resource ID (required)
- `date` (string) - Date in YYYY-MM-DD format (required)

**Example:**
```
GET /bookings/availability?resourceId=1&date=2024-02-20
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "resource": {
      "id": 1,
      "name": "Computer Lab A",
      "type": "lab",
      "capacity": 30
    },
    "date": "2024-02-20",
    "bookedSlots": [
      {
        "start_time": "09:00:00",
        "end_time": "11:00:00"
      },
      {
        "start_time": "14:00:00",
        "end_time": "16:00:00"
      }
    ]
  }
}
```

---

### GET /bookings/admin/all

Get all bookings (Admin only).

**Auth Required:** Yes (ADMIN)

**Query Parameters:**
- `page` (int) - Page number
- `status` (string) - Filter by: PENDING, APPROVED, REJECTED
- `resource_id` (int) - Filter by resource
- `user_id` (int) - Filter by user

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "user_id": 1,
      "resource_id": 1,
      "user_name": "John Doe",
      "user_email": "john@campus.edu",
      "resource_name": "Computer Lab A",
      "resource_type": "lab",
      "booking_date": "2024-02-20",
      "start_time": "09:00:00",
      "end_time": "11:00:00",
      "status": "PENDING",
      "created_at": "2024-02-16T10:00:00Z"
    }
  ]
}
```

---

### PUT /bookings/:id/approve

Approve pending booking (Admin only).

**Auth Required:** Yes (ADMIN)

**Response (200):**
```json
{
  "success": true,
  "message": "Booking approved successfully",
  "data": {
    "id": 15,
    "status": "APPROVED",
    "user_name": "John Doe",
    "resource_name": "Computer Lab A"
  }
}
```

**Errors:**
- `400` - Booking not in PENDING status
- `403` - Not admin
- `404` - Booking not found

---

### PUT /bookings/:id/reject

Reject pending booking (Admin only).

**Auth Required:** Yes (ADMIN)

**Request:**
```json
{
  "reason": "Resource maintenance scheduled"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Booking rejected successfully",
  "data": {
    "id": 15,
    "status": "REJECTED",
    "rejection_reason": "Resource maintenance scheduled",
    "user_name": "John Doe",
    "resource_name": "Computer Lab A"
  }
}
```

**Errors:**
- `400` - Booking not in PENDING status
- `403` - Not admin
- `404` - Booking not found

---

### DELETE /bookings/:id/cancel

Cancel own booking (PENDING only).

**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "message": "Booking cancelled successfully"
}
```

**Errors:**
- `400` - Booking not in PENDING status
- `403` - Not owner of booking
- `404` - Booking not found

---

## 🔧 Admin Endpoints

### GET /admin/logs

Get audit logs (Admin only).

**Auth Required:** Yes (ADMIN)

**Query Parameters:**
- `page` (int) - Page number
- `action` (string) - Filter by action type
- `user_id` (int) - Filter by user
- `start_date` (date) - Filter by date range
- `end_date` (date) - Filter by date range

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "action": "BOOKING_APPROVED",
      "user_id": 3,
      "user_name": "Admin User",
      "user_email": "admin@campus.edu",
      "resource_id": 1,
      "booking_id": 15,
      "action_details": {
        "user": "John Doe",
        "resource": "Computer Lab A"
      },
      "timestamp": "2024-02-16T12:00:00Z"
    }
  ]
}
```

---

### GET /admin/stats

Get dashboard statistics (Admin only).

**Auth Required:** Yes (ADMIN)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalUsers": 5,
    "totalResources": 6,
    "totalBookings": 12,
    "pendingBookings": 3,
    "approvedBookings": 8,
    "rejectedBookings": 1
  }
}
```

---

### GET /admin/users

Get all users (Admin only).

**Auth Required:** Yes (ADMIN)

**Query Parameters:**
- `page` (int) - Page number

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@campus.edu",
      "role": "STUDENT",
      "created_at": "2024-01-15T08:00:00Z"
    }
  ]
}
```

---

### GET /admin/bookings/pending

Get pending booking requests (Admin only).

**Auth Required:** Yes (ADMIN)

**Query Parameters:**
- `page` (int) - Page number

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "user_name": "John Doe",
      "user_email": "john@campus.edu",
      "resource_name": "Computer Lab A",
      "resource_type": "lab",
      "booking_date": "2024-02-20",
      "start_time": "09:00:00",
      "end_time": "11:00:00",
      "status": "PENDING",
      "created_at": "2024-02-16T10:00:00Z"
    }
  ]
}
```

---

### GET /admin/overview

Get system overview (Admin only).

**Auth Required:** Yes (ADMIN)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "timestamp": "2024-02-16T12:00:00Z",
    "system": {
      "status": "operational"
    }
  }
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid data |
| 401 | Unauthorized - Missing/invalid auth |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Double-booking conflict |
| 500 | Server Error - Internal error |

---

## Error Examples

### Missing Authentication

```json
{
  "success": false,
  "message": "No authentication token provided"
}
```

### Insufficient Permissions

```json
{
  "success": false,
  "message": "Access denied. Required role(s): ADMIN"
}
```

### Double-Booking Conflict

```json
{
  "success": false,
  "message": "Resource is already booked for this time slot"
}
```

### Validation Error

```json
{
  "success": false,
  "message": "All fields are required"
}
```

---

## Rate Limiting

No rate limiting implemented. Production deployment should add rate limiting.

---

## Pagination

Use `page` parameter (1-indexed):
- Default limit: 20 items per page
- Response includes `pagination` object

```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15
  }
}
```

---

## Testing with cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"pass123","confirmPassword":"pass123","role":"STUDENT"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123"}'

# Get Resources
curl http://localhost:5000/api/resources

# Create Booking (requires token)
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"resourceId":1,"bookingDate":"2024-02-20","startTime":"09:00","endTime":"11:00"}'
```

---

For more information, see [README.md](README.md)
