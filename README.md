# Campus Sync - Smart Campus Resource Booking System

A complete full-stack web application for automating the booking of campus resources (labs, seminar halls, projectors) with role-based access control and conflict prevention.

## 📋 Project Overview

Campus Sync streamlines the process of booking campus resources by providing:
- **User-friendly booking interface** for students and faculty
- **Real-time availability checking** to prevent double bookings
- **Admin dashboard** for managing resources and approving/rejecting bookings
- **Comprehensive audit logging** for all system actions
- **Role-based access control** (Student, Faculty, Admin)

## 🏗️ Architecture

### Frontend
- **Framework**: React.js 18+
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **State Management**: React Hooks

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Database Adapter**: mysql2/promise

### Database
- **System**: MySQL 8.0+
- **Architecture**: Relational with proper foreign keys
- **Data Models**: Users, Roles, Resources, Bookings, Audit Logs

## 📁 Project Structure

```
CampusSync/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── bookingController.js
│   │   ├── resourceController.js
│   │   └── adminController.js
│   ├── models/
│   │   ├── userModel.js
│   │   ├── bookingModel.js
│   │   ├── resourceModel.js
│   │   └── auditLogModel.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── resourceRoutes.js
│   │   └── adminRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── roleMiddleware.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── AdminPanel.jsx
│   │   ├── components/
│   │   │   ├── BookingForm.jsx
│   │   │   ├── ResourceCard.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
├── database/
│   ├── schema.sql
│   └── seed.sql
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- MySQL 8.0+
- Git

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database credentials:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=campus_sync
   DB_PORT=3306
   PORT=5000
   JWT_SECRET=your_secret_key_here
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Create database and tables**
   ```bash
   mysql -u root -p campus_sync < ../database/schema.sql
   mysql -u root -p campus_sync < ../database/seed.sql
   ```

5. **Start the server**
   ```bash
   npm run dev
   ```
   Server runs on: `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local`:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. **Start the development server**
   ```bash
   npm start
   ```
   Application runs on: `http://localhost:3000`

## 🔐 Authentication & Authorization

### User Roles

1. **Student**
   - View all available resources
   - Create booking requests
   - View their own bookings
   - Cancel pending bookings

2. **Faculty**
   - Same as Student
   - Typically higher booking priority

3. **Admin**
   - View all resources
   - Create/edit/delete resources
   - Approve/reject booking requests
   - View all bookings and user bookings
   - Access audit logs

### JWT Token Structure
```json
{
  "id": 1,
  "email": "user@campus.edu",
  "role": "STUDENT",
  "name": "John Doe",
  "iat": 1234567890,
  "exp": 1234654290
}
```

## 📡 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user, returns JWT |
| GET | `/api/auth/profile` | Get current user profile |

### Resource Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---|
| GET | `/api/resources` | Get all resources | No |
| GET | `/api/resources/:id` | Get resource by ID | No |
| GET | `/api/resources/type/:type` | Get resources by type | No |
| POST | `/api/resources` | Create resource | Yes (Admin Only) |
| PUT | `/api/resources/:id` | Update resource | Yes (Admin Only) |
| DELETE | `/api/resources/:id` | Delete resource | Yes (Admin Only) |

### Booking Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---|
| POST | `/api/bookings` | Create booking | Yes |
| GET | `/api/bookings/user/:id` | Get user bookings | Yes |
| GET | `/api/bookings/my-bookings` | Get current user bookings | Yes |
| GET | `/api/bookings/availability` | Check resource availability | No |
| GET | `/api/bookings/admin/all` | Get all bookings | Yes (Admin Only) |
| PUT | `/api/bookings/:id/approve` | Approve booking | Yes (Admin Only) |
| PUT | `/api/bookings/:id/reject` | Reject booking | Yes (Admin Only) |
| DELETE | `/api/bookings/:id/cancel` | Cancel booking | Yes |

### Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---|
| GET | `/api/admin/logs` | Get audit logs | Yes (Admin Only) |
| GET | `/api/admin/stats` | Get dashboard statistics | Yes (Admin Only) |
| GET | `/api/admin/users` | Get all users | Yes (Admin Only) |
| GET | `/api/admin/bookings/pending` | Get pending bookings | Yes (Admin Only) |
| GET | `/api/admin/overview` | Get system overview | Yes (Admin Only) |

## 🗄️ Database Schema

### Roles Table
```sql
- id (PK)
- role_name (UNIQUE)
- created_at
```

### Users Table
```sql
- id (PK)
- name
- email (UNIQUE)
- password (bcrypt hashed)
- role_id (FK -> roles.id)
- created_at
- updated_at
```

### Resources Table
```sql
- id (PK)
- name
- type (lab, seminar_hall, projector)
- location
- capacity
- is_active
- created_at
- updated_at
```

### Bookings Table
```sql
- id (PK)
- user_id (FK -> users.id)
- resource_id (FK -> resources.id)
- booking_date
- start_time
- end_time
- status (PENDING, APPROVED, REJECTED)
- rejection_reason
- created_at
- updated_at
```

### Audit Logs Table
```sql
- id (PK)
- action (describes the action)
- user_id (FK -> users.id)
- resource_id (FK -> resources.id)
- booking_id (FK -> bookings.id)
- action_details (JSON)
- timestamp
```

## ⚙️ Business Logic

### Booking Conflict Prevention

The system prevents double-booking using:

1. **Database Trigger**: Automatic validation at the MySQL level
2. **Application Logic**: Pre-insertion validation in the backend
3. **Overlap Check**: Validates time slots don't conflict with APPROVED bookings

```sql
-- Check for overlapping APPROVED bookings
SELECT COUNT(*) FROM bookings
WHERE resource_id = ? 
  AND booking_date = ? 
  AND status = 'APPROVED'
  AND (? < end_time AND ? > start_time)
```

### Booking Status Flow

```
User Creates Booking
        ↓
    PENDING
    ↙       ↘
APPROVED   REJECTED
```

## 🔑 Demo Credentials

Use these credentials to test the application:

### Student Account
- Email: `john.doe@campus.edu`
- Password: `student123`

### Faculty Account
- Email: `sarah.smith@campus.edu`
- Password: `faculty123`

### Admin Account
- Email: `admin@campus.edu`
- Password: `admin123`

## 📝 Key Features

✅ **JWT Authentication** - Secure token-based authentication
✅ **Role-Based Access Control** - Student, Faculty, and Admin roles
✅ **Booking Conflict Prevention** - Prevents double-booking with database constraints
✅ **Real-time Availability** - Check resource availability before booking
✅ **Admin Approval Workflow** - All bookings require admin approval
✅ **Audit Logging** - Complete audit trail of all actions
✅ **Responsive Design** - Works on desktop, tablet, and mobile
✅ **Error Handling** - Comprehensive error messages and validation
✅ **RESTful API** - Clean, RESTful API design

## 🛠️ Development

### Backend Development

Start the development server with nodemon:
```bash
cd backend
npm run dev
```

The server will automatically restart on file changes.

### Frontend Development

The frontend includes hot reload:
```bash
cd frontend
npm start
```

Changes to React files will automatically reload in the browser.

## 🧪 Testing

### Test Students/Faculty Login (Dashboard)
1. Go to http://localhost:3000/login
2. Use demo credentials above
3. You'll see your bookings and can create new ones

### Test Admin Functions
1. Login with admin account
2. Navigate to `/admin` or click Admin Panel
3. View pending bookings, approve/reject them
4. Create new resources
5. View audit logs

### Test Booking Conflict Prevention
1. Book a resource for a specific time slot
2. Try booking the same resource for an overlapping time
3. System should prevent the double-booking

## 📦 Deployment

### Backend Deployment (Heroku/Railway/AWS)

1. Set environment variables
2. Deploy with: `git push`
3. Ensure MySQL database is accessible

### Frontend Deployment (Vercel/Netlify)

1. Build the application:
   ```bash
   npm run build
   ```
2. Deploy the `build` folder
3. Set `REACT_APP_API_URL` to your backend API URL

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 💬 Support

For issues and questions, please create an issue in the repository or contact the development team.

## 🎯 Future Enhancements

- [ ] Calendar visualization with FullCalendar integration
- [ ] Email notifications for booking approvals
- [ ] Recurrence patterns for regular bookings
- [ ] Resource categories and filtering
- [ ] Advanced analytics dashboard
- [ ] Integration with campus systems
- [ ] Mobile app (React Native)
- [ ] WebSocket support for real-time updates

---

**Built with ❤️ for Campus Sync**
