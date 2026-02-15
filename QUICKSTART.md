# Quick Start Guide

## ⚡ Get Running in 5 Minutes

### Prerequisites
- Node.js 16+
- MySQL 8.0+
- Git

### Step 1: Clone & Navigate

```bash
cd CampusSync
```

### Step 2: Set Up Database

```bash
# Create database and tables
mysql -u root -p < database/schema.sql

# Insert sample data
mysql -u root -p < database/seed.sql
```

### Step 3: Start Backend

```bash
cd backend

# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Start server
npm run dev
```

⏳ Wait for: "✓ Database connected successfully"
🚀 Server: http://localhost:5000

### Step 4: Start Frontend

Open a NEW terminal window:

```bash
cd frontend

# Copy environment file
cp .env.example .env.local

# Install dependencies
npm install

# Start app
npm start
```

⏳ Wait for: "Compiled successfully!"
🌐 App: http://localhost:3000

## 🧪 Test the App

### 1. Login (Choose One)

**Student Account:**
- Email: `john.doe@campus.edu`
- Password: `student123`

**Admin Account:**
- Email: `admin@campus.edu`
- Password: `admin123`

### 2. Create a Booking (Student)

1. Click "New Booking"
2. Select "Computer Lab A"
3. Pick a date
4. Set time: 09:00 - 11:00
5. Click "Create Booking"
6. Status shows as "PENDING"

### 3. Approve Booking (Admin)

1. Logout (red button top-right)
2. Login with admin account
3. Go to Admin Panel
4. See pending booking
5. Click "Approve"
6. Check audit logs

## 🔑 Key Features to Try

✅ **User Registration** - `/register`
✅ **Login System** - `/login` (with JWT)
✅ **View Resources** - Dashboard, select any resource
✅ **Book Resources** - Create booking request
✅ **Admin Approval** - Approve/reject as admin
✅ **Conflict Prevention** - Try double-booking same slot
✅ **Audit Logs** - Admin panel shows all actions

## 🐛 Common Issues

### "Cannot connect to MySQL"

```bash
# Check MySQL is running
mysql -u root -p
# Type your password and exit
exit
```

### "Port 3000 already in use"

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
# Or use different port: PORT=3001 npm start
```

### "Module not found"

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📁 Project Structure

```
CampusSync/
├── backend/          ← Node.js API server
├── frontend/         ← React web app
├── database/         ← MySQL schemas
└── README.md         ← Full documentation
```

## 📚 Documentation

- **Full Setup**: [README.md](README.md)
- **Backend API**: [backend/README.md](backend/README.md)
- **Frontend UI**: [frontend/README.md](frontend/README.md)
- **Database**: [database/README.md](database/README.md)

## 🚀 Next Steps

1. **Customize Users** - Edit `database/seed.sql`
2. **Add Resources** - Use Admin Panel
3. **Deploy** - See deployment section in README.md
4. **Styling** - Modify in `frontend/src/index.css`
5. **API Routes** - Add to `backend/routes/`

## 💡 Tips

- Backend runs on `http://localhost:5000`
- Frontend runs on `http://localhost:3000`
- API URL: `http://localhost:5000/api`
- Check browser console (F12) for errors
- Check backend terminal for server logs
- Use demo credentials for testing

## ✨ That's It!

Your campus resource booking system is ready! 🎉

Need help? Check the full [README.md](README.md)
