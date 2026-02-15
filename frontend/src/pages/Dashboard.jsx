import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingsAPI, resourcesAPI } from '../services/api';
import BookingForm from '../components/BookingForm';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  const [bookings, setBookings] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('bookings');
  const [showBookingForm, setShowBookingForm] = useState(false);

  useEffect(() => {
    if (!user.id) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user.id, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, resourcesRes] = await Promise.all([
        bookingsAPI.getUserBookings(),
        resourcesAPI.getAll(),
      ]);

      if (bookingsRes.data.success) {
        setBookings(bookingsRes.data.data);
      }
      if (resourcesRes.data.success) {
        setResources(resourcesRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleBookingSuccess = () => {
    setShowBookingForm(false);
    fetchData();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campus Sync</h1>
            <p className="text-gray-600">Welcome, {user.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'bookings'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            My Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('makeBooking')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'makeBooking'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            New Booking
          </button>
        </div>

        {loading && <div className="text-center py-8 text-gray-600">Loading...</div>}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && !loading && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Bookings</h2>
            {bookings.length === 0 ? (
              <div className="bg-white p-8 rounded-lg text-center text-gray-600">
                No bookings yet. Start by creating a new booking!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="bg-white p-6 rounded-lg shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-gray-900">
                        {booking.resource_name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      📍 {booking.location}
                    </p>
                    <p className="text-gray-600 text-sm">
                      📅 {new Date(booking.booking_date).toLocaleDateString()}
                    </p>
                    <p className="text-gray-600 text-sm">
                      🕐 {booking.start_time} - {booking.end_time}
                    </p>
                    {booking.rejection_reason && (
                      <p className="text-red-600 text-sm mt-2">
                        Reason: {booking.rejection_reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* New Booking Tab */}
        {activeTab === 'makeBooking' && !loading && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Booking</h2>
            <BookingForm
              resources={resources}
              onSuccess={handleBookingSuccess}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
