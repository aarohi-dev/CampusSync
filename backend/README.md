# Backend Setup and Documentation

## Overview

The Campus Sync backend is built with Node.js and Express.js, providing a RESTful API for managing campus resource bookings.

## Directory Structure

```
backend/
├── config/
│   └── db.js                 # Database connection configuration
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── bookingController.js  # Booking management
│   ├── resourceController.js # Resource management
│   └── adminController.js    # Admin operations
├── models/
│   ├── userModel.js          # User database queries
│   ├── bookingModel.js       # Booking database queries
│   ├── resourceModel.js      # Resource database queries
│   └── auditLogModel.js      # Audit log queries
├── routes/
│   ├── authRoutes.js         # Auth endpoints
│   ├── bookingRoutes.js      # Booking endpoints
│   ├── resourceRoutes.js     # Resource endpoints
│   └── adminRoutes.js        # Admin endpoints
├── middleware/
│   ├── authMiddleware.js     # JWT verification
│   └── roleMiddleware.js     # Role-based access control
├── .env.example              # Environment template
├── package.json              # Dependencies
└── server.js                 # Main application file
```

## Installation

### 1. Prerequisites
- Node.js 16+ (check with `node --version`)
- npm or yarn (check with `npm --version`)
- MySQL 8.0+

### 2. Environment Setup

Copy the environment example and configure:

```bash
cp .env.example .env
```

Edit `.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=campus_sync
DB_PORT=3306

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_secret_key_change_this_in_production_12345
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### 3. Install Dependencies

```bash
npm install
```

This installs:
- `express` - Web framework
- `mysql2/promise` - MySQL driver with promises
- `jsonwebtoken` - JWT generation/verification
- `bcrypt` - Password hashing
- `cors` - Cross-origin requests
- `dotenv` - Environment variables
- `nodemon` - Development auto-reload (dev only)

## Database Setup

### 1. Create Database

```bash
mysql -u root -p

# In MySQL shell:
SOURCE ../database/schema.sql;
SOURCE ../database/seed.sql;
EXIT;
```

Or as a single command:

```bash
mysql -u root -p < ../database/schema.sql
mysql -u root -p < ../database/seed.sql
```

### 2. Verify Tables

```bash
mysql -u root -p campus_sync

# In MySQL shell:
SHOW TABLES;
SELECT * FROM roles;
SELECT * FROM users;
```

## Running the Server

### Development Mode (with hot reload)

```bash
npm run dev
```

Output:
```
╔══════════════════════════════════════╗
║  Campus Sync Server Started          ║
║  Port: 5000                          ║
║  Environment: development            ║
║  Database: campus_sync               ║
╚══════════════════════════════════════╝

🚀 API available at http://localhost:5000
🏥 Health check: http://localhost:5000/health
```

### Production Mode

```bash
npm start
```

## API Testing

### Health Check

```bash
curl http://localhost:5000/health
```

Response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-02-16T12:00:00.000Z"
}
```

### Sample API Requests

#### Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@campus.edu",
    "password": "password123",
    "confirmPassword": "password123",
    "role": "STUDENT"
  }'
```

#### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@campus.edu",
    "password": "student123"
  }'
```

Response includes a JWT token:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@campus.edu",
      "role": "STUDENT"
    }
  }
}
```

#### Get Resources (No Auth Required)

```bash
curl http://localhost:5000/api/resources
```

#### Create Booking (Auth Required)

```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "resourceId": 1,
    "bookingDate": "2024-02-20",
    "startTime": "09:00",
    "endTime": "11:00"
  }'
```

## Controllers

### authController.js

Handles user authentication:
- `register()` - Create new user account
- `login()` - User login and JWT generation
- `getProfile()` - Retrieve current user profile

### bookingController.js

Manages booking operations:
- `createBooking()` - Create new booking request
- `getUserBookings()` - Get user's bookings
- `getAllBookings()` - Get all bookings (admin)
- `approveBooking()` - Approve pending booking (admin)
- `rejectBooking()` - Reject booking with reason (admin)
- `cancelBooking()` - Cancel pending booking
- `getResourceAvailability()` - Check resource availability

### resourceController.js

Manages resources:
- `getAllResources()` - List all resources
- `getResourceById()` - Get specific resource
- `createResource()` - Add new resource (admin)
- `updateResource()` - Update resource details (admin)
- `deleteResource()` - Remove resource (admin)
- `getResourcesByType()` - Filter by type

### adminController.js

Admin-specific operations:
- `getAuditLogs()` - View system audit logs
- `getDashboardStats()` - Get system statistics
- `getAllUsers()` - List all users
- `getPendingBookings()` - Get pending approvals
- `getSystemOverview()` - System status overview

## Middleware

### authMiddleware.js

Verifies JWT token from Authorization header:
```javascript
Authorization: Bearer <token>
```

Attaches user data to `req.user`:
```javascript
{
  id: 1,
  email: "user@campus.edu",
  role: "STUDENT",
  name: "John Doe"
}
```

### roleMiddleware.js

Restricts access based on user role:
```javascript
router.post('/resource',
  authMiddleware,
  roleMiddleware(['ADMIN']),
  resourceController.createResource
);
```

## Models

### User Model

```javascript
UserModel.findByEmail(email)           // Find user by email
UserModel.findById(id)                 // Find user by ID
UserModel.create(name, email, password, roleId)
UserModel.getRoleIdByName(roleName)
UserModel.getAll(limit, offset)
```

### Booking Model

```javascript
BookingModel.create(userId, resourceId, date, startTime, endTime)
BookingModel.getById(bookingId)
BookingModel.getByUserId(userId)
BookingModel.getAll(filters, limit, offset)
BookingModel.updateStatus(bookingId, status, reason)
BookingModel.delete(bookingId)
BookingModel.getResourceAvailability(resourceId, date)
```

### Resource Model

```javascript
ResourceModel.getAll(filters, limit, offset)
ResourceModel.getById(resourceId)
ResourceModel.create(name, type, location, capacity)
ResourceModel.update(resourceId, updateData)
ResourceModel.delete(resourceId)
ResourceModel.getByType(type)
ResourceModel.getAvailableCount(resourceId, date, startTime, endTime)
```

## Error Handling

Standard error response format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

### HTTP Status Codes

- `200 OK` - Successful request
- `201 Created` - Resource created
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing/invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., double-booking)
- `500 Internal Server Error` - Server error

## Security Features

1. **Password Hashing**: bcrypt with salt rounds = 10
2. **JWT Tokens**: Signed with secret key, 7-day expiration
3. **CORS**: Restricted to frontend origin
4. **SQL Injection Prevention**: Parameterized queries throughout
5. **Double-booking Prevention**: Database triggers and application logic
6. **Input Validation**: All inputs validated before processing
7. **Error Messages**: Generic messages in production, detailed in development

## Performance Optimization

1. **Database Indexes**: Added on frequently queried columns
2. **Pagination**: Bookings and resources list with limit/offset
3. **Connection Pooling**: MySQL connection pool for efficiency
4. **Async/Await**: Non-blocking database operations
5. **Error Recovery**: Graceful error handling

## Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solution**:
- Verify MySQL is running
- Check DB_HOST, DB_PORT in .env
- Verify MySQL credentials

### JWT Token Expired

```
Error: jwt expired
```

**Solution**:
- Clear localStorage token
- User must login again
- Or increase JWT_EXPIRE in .env

### CORS Error

```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution**:
- Verify CORS_ORIGIN in .env matches frontend URL
- Restart server after changing .env

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution**:
- Kill process on port 5000: `lsof -ti:5000 | xargs kill -9`
- Or change PORT in .env

## Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET`
- [ ] Configure production database
- [ ] Set `CORS_ORIGIN` to production frontend
- [ ] Enable HTTPS
- [ ] Set up monitoring/logging
- [ ] Configure backup strategy
- [ ] Test all API endpoints
- [ ] Load testing
- [ ] Security audit

---

For more information, see the main [README.md](../README.md)
