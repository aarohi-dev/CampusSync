# Frontend Setup and Documentation

## Overview

The Campus Sync frontend is a modern React.js application that provides an intuitive interface for booking campus resources with role-based views for students, faculty, and administrators.

## Directory Structure

```
frontend/
├── public/
│   └── index.html              # HTML template
├── src/
│   ├── pages/
│   │   ├── Login.jsx           # Login page
│   │   ├── Register.jsx        # Registration page
│   │   ├── Dashboard.jsx       # User dashboard
│   │   └── AdminPanel.jsx      # Admin dashboard
│   ├── components/
│   │   ├── BookingForm.jsx     # Booking creation form
│   │   ├── ResourceCard.jsx    # Resource display card
│   │   └── ProtectedRoute.jsx  # Route protection component
│   ├── services/
│   │   └── api.js              # API service with axios
│   ├── App.jsx                 # Main app component
│   ├── index.jsx               # ReactDOM entry point
│   └── index.css               # Global styles
├── .env.example                # Environment template
├── package.json                # Dependencies
├── tailwind.config.js          # Tailwind CSS config
├── postcss.config.js           # PostCSS config
└── README.md                   # Frontend documentation
```

## Installation

### 1. Prerequisites

- Node.js 16+ (check with `node --version`)
- npm or yarn (check with `npm --version`)
- Backend API running on `http://localhost:5000`

### 2. Environment Setup

Copy the environment example:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
```

### 3. Install Dependencies

```bash
npm install
```

This installs:
- `react` - UI library
- `react-dom` - DOM rendering
- `react-router-dom` - Client-side routing
- `axios` - HTTP client
- `tailwindcss` - CSS framework
- `react-scripts` - Build tools

## Running the Application

### Development Mode

```bash
npm start
```

Output:
```
Compiled successfully!

You can now view campus-sync-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1.x:3000
```

The app will:
- Open at http://localhost:3000
- Hot reload when you save changes
- Show compilation errors in the console

### Production Build

```bash
npm run build
```

Creates an optimized build in the `build/` directory ready for deployment.

## Project Features

### Pages

#### Login.jsx
- Email and password authentication
- Form validation
- JWT token storage
- Remember me functionality
- Link to registration page
- Demo credentials display

#### Register.jsx
- User registration form
- Role selection (Student/Faculty)
- Password confirmation
- Email validation
- Success/error messages
- Redirect to login after registration

#### Dashboard.jsx
- User's booking list
- Create new booking tab
- Status-based color coding
- Booking details display
- Real-time data refresh
- Responsive grid layout

#### AdminPanel.jsx
- Pending bookings management
- Approve/reject bookings
- Resource management
- Create new resources
- Audit logs display
- System overview

### Components

#### BookingForm.jsx
- Resource selection dropdown
- Date picker with min date validation
- Start/end time inputs
- Form validation
- Error/success messages
- Loading state
- Automatic refresh after success

#### ResourceCard.jsx
- Resource information display
- Type-based icon display
- Availability status
- Capacity information
- Responsive design
- Action button support

#### ProtectedRoute.jsx
- Route protection based on authentication
- Role-based access control
- Redirect to login if not authenticated
- Admin-only route restriction

### Services

#### api.js
Centralized API service with:
- Base URL configuration
- Request/response interceptors
- Automatic token injection
- Error handling
- Auto-logout on 401

**API Methods:**
- `authAPI` - Register, login, get profile
- `resourcesAPI` - CRUD operations for resources
- `bookingsAPI` - Create, view, approve, reject bookings
- `adminAPI` - Admin functions and logs

## Styling with Tailwind CSS

The application uses Tailwind CSS for styling. Key classes used:

```jsx
// Layout
<div className="flex gap-4 mb-6">
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

// Colors
<button className="bg-blue-600 text-white">
<span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>

// Spacing
<div className="p-6 rounded-lg shadow">

// Responsive
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
```

## Routing

Routes are defined in `App.jsx`:

```javascript
/login              - Login page (public)
/register           - Registration page (public)
/dashboard          - User dashboard (protected)
/admin              - Admin panel (protected, admin only)
/                   - Redirects to /dashboard
```

## Authentication Flow

1. User logs in with credentials
2. Backend returns JWT token
3. Token stored in localStorage
4. Token included in all API requests via axios interceptor
5. If token expires (401), user redirected to login
6. User profile stored in localStorage for quick access

```javascript
// Token storage
localStorage.setItem('token', response.data.data.token);
localStorage.setItem('user', JSON.stringify(response.data.data.user));

// Token retrieval
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));
```

## Form Handling

The application uses React hooks for form management:

```javascript
const [formData, setFormData] = useState({
  resourceId: '',
  bookingDate: '',
  startTime: '09:00',
  endTime: '10:00',
});

const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
};

const handleSubmit = async (e) => {
  e.preventDefault();
  // Validation and API call
};
```

## Error Handling

Errors are caught and displayed to users:

```javascript
catch (error) {
  const message = error.response?.data?.message || 'An error occurred';
  setError(message);
}
```

## API Integration Examples

### Making API Calls

```javascript
// Get all resources
const response = await resourcesAPI.getAll();
if (response.data.success) {
  setResources(response.data.data);
}

// Create booking
try {
  const response = await bookingsAPI.create(
    resourceId,
    date,
    startTime,
    endTime
  );
  if (response.data.success) {
    console.log('Booking created:', response.data.data);
  }
} catch (error) {
  console.error('Error:', error.response?.data?.message);
}
```

## State Management

The app uses React hooks for state:

```javascript
const [bookings, setBookings] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
```

## Responsive Design

The application is fully responsive using Tailwind's grid system:

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Auto-responsive columns */}
</div>
```

- Mobile: 1 column
- Tablet (md): 2 columns
- Desktop (lg): 3 columns

## Performance Optimization

1. **Lazy Loading**: Components load on demand via React Router
2. **Code Splitting**: Each page is a separate chunk
3. **Memoization**: Components wrapped with React.memo where needed
4. **API Caching**: Data fetched once and reused
5. **Optimized Images**: No large uncompressed images

## Security Best Practices

1. **XSS Protection**: React escapes content by default
2. **CSRF Tokens**: Standard HTTP headers
3. **Password Handling**: Never logged or stored
4. **Token Security**: Stored in localStorage (or sessionStorage for production)
5. **Input Validation**: Client and server-side
6. **Error Messages**: Don't expose sensitive information

## Troubleshooting

### Blank Page

**Issue**: App doesn't load or shows blank page

**Solution**:
1. Check browser console (F12)
2. Verify backend is running
3. Check .env.local REACT_APP_API_URL
4. Clear browser cache and reload

### CORS Errors

**Issue**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**:
1. Verify backend CORS_ORIGIN environment variable
2. Must match frontend URL exactly (http://localhost:3000)
3. Restart backend after changing CORS settings

### API Calls Failing

**Issue**: 404 or 500 errors from API

**Solution**:
1. Verify backend is running (`http://localhost:5000/health`)
2. Check REACT_APP_API_URL in .env.local
3. Verify token is valid (check localStorage.token)
4. Check backend console for errors

### React DevTools Not Working

**Install React DevTools Chrome Extension**:
https://chrome.google.com/webstore/detail/react-developer-tools/

## Development Workflow

### 1. Create New Page

```jsx
// pages/NewPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const NewPage = () => {
  const navigate = useNavigate();
  // Component code
  return <div>New Page</div>;
};

export default NewPage;
```

### 2. Add Route

```jsx
// App.jsx
<Route path="/newpage" element={
  <ProtectedRoute>
    <NewPage />
  </ProtectedRoute>
} />
```

### 3. Create Component

```jsx
// components/NewComponent.jsx
const NewComponent = ({ prop1, prop2 }) => {
  return <div>{prop1}</div>;
};

export default NewComponent;
```

### 4. Add API Service

```javascript
// services/api.js
export const newAPI = {
  getAll: () => api.get('/new'),
  create: (data) => api.post('/new', data),
};
```

## Building for Production

```bash
# Create optimized build
npm run build

# Test production build locally
npx serve -s build

# Or deploy to hosting service
```

The build folder is ready for deployment to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages
- Any static hosting

## Environment Variables for Production

```env
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_ENV=production
```

## Testing Components

For future testing setup with JWT:

```javascript
// Mock authentication for tests
beforeEach(() => {
  localStorage.setItem('token', 'mock-token');
  localStorage.setItem('user', JSON.stringify({
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'STUDENT'
  }));
});
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Metrics

Monitor with Chrome DevTools:
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)

## Useful Commands

```bash
npm start              # Start development server
npm run build          # Create production build
npm test               # Run tests
npm run eject          # Eject from create-react-app (irreversible)
npm install <package>  # Install new package
npm uninstall <pkg>    # Remove package
```

---

For more information, see the main [README.md](../README.md)
