import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingsAPI, adminAPI, resourcesAPI } from '../services/api';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  const [activeTab, setActiveTab] = useState('bookings');
  const [pendingBookings, setPendingBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [resources, setResources] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'lab',
    location: '',
    capacity: 1,
  });
  const [showResourceForm, setShowResourceForm] = useState(false);

  useEffect(() => {
    if (!user.id || user.role !== 'ADMIN') {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user.id, navigate, user.role]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pendingRes, allRes, resourcesRes, logsRes] = await Promise.all([
        adminAPI.getPendingBookings(),
        bookingsAPI.getAllBookings(),
        resourcesAPI.getAll(),
        adminAPI.getAuditLogs(),
      ]);

      if (pendingRes.data.success) setPendingBookings(pendingRes.data.data);
      if (allRes.data.success) setAllBookings(allRes.data.data);
      if (resourcesRes.data.success) setResources(resourcesRes.data.data);
      if (logsRes.data.success) setAuditLogs(logsRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveBooking = async (bookingId) => {
    try {
      const response = await bookingsAPI.approve(bookingId);
      if (response.data.success) {
        alert('Booking approved successfully');
        fetchData();
      }
    } catch (error) {
      alert('Error approving booking: ' + error.response?.data?.message);
    }
  };

  const handleRejectBooking = async (bookingId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      const response = await bookingsAPI.reject(bookingId, reason);
      if (response.data.success) {
        alert('Booking rejected successfully');
        fetchData();
      }
    } catch (error) {
      alert('Error rejecting booking: ' + error.response?.data?.message);
    }
  };

  const handleCreateResource = async (e) => {
    e.preventDefault();
    try {
      const response = await resourcesAPI.create(
        formData.name,
        formData.type,
        formData.location,
        formData.capacity
      );
      if (response.data.success) {
        alert('Resource created successfully');
        setFormData({ name: '', type: 'lab', location: '', capacity: 1 });
        setShowResourceForm(false);
        fetchData();
      }
    } catch (error) {
      alert('Error creating resource: ' + error.response?.data?.message);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600">Campus Sync Management</p>
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
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['bookings', 'resources', 'logs'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'bookings' && ` (${pendingBookings.length})`}
              {tab === 'resources' && ` (${resources.length})`}
            </button>
          ))}
        </div>

        {loading && <div className="text-center py-8 text-gray-600">Loading...</div>}

        {/* Pending Bookings */}
        {activeTab === 'bookings' && !loading && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Pending Bookings ({pendingBookings.length})
            </h2>
            {pendingBookings.length === 0 ? (
              <div className="bg-white p-8 rounded-lg text-center text-gray-600">
                No pending bookings
              </div>
            ) : (
              <div className="space-y-4">
                {pendingBookings.map((booking) => (
                  <div key={booking.id} className="bg-white p-6 rounded-lg shadow">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-gray-600 text-sm">Resource</p>
                        <p className="font-bold text-gray-900">{booking.resource_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Requestor</p>
                        <p className="font-bold text-gray-900">{booking.user_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Date & Time</p>
                        <p className="font-bold text-gray-900">
                          {new Date(booking.booking_date).toLocaleDateString()} {booking.start_time}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveBooking(booking.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectBooking(booking.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Resources Management */}
        {activeTab === 'resources' && !loading && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Resources</h2>
              <button
                onClick={() => setShowResourceForm(!showResourceForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Add Resource
              </button>
            </div>

            {showResourceForm && (
              <div className="bg-white p-6 rounded-lg shadow mb-4">
                <form onSubmit={handleCreateResource} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resource Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Computer Lab A"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="lab">Lab</option>
                        <option value="seminar_hall">Seminar Hall</option>
                        <option value="projector">Projector</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Building A, 2nd Floor"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Capacity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.capacity}
                        onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResourceForm(false)}
                      className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources.map((resource) => (
                <div key={resource.id} className="bg-white p-6 rounded-lg shadow">
                  <h3 className="font-bold text-lg text-gray-900">{resource.name}</h3>
                  <p className="text-gray-600 text-sm">Type: {resource.type}</p>
                  <p className="text-gray-600 text-sm">Location: {resource.location}</p>
                  <p className="text-gray-600 text-sm">Capacity: {resource.capacity}</p>
                  <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                    resource.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {resource.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit Logs */}
        {activeTab === 'logs' && !loading && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Audit Logs</h2>
            {auditLogs.length === 0 ? (
              <div className="bg-white p-8 rounded-lg text-center text-gray-600">
                No audit logs
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Action</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">User</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {auditLogs.slice(0, 10).map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm text-gray-900">{log.action}</td>
                        <td className="px-6 py-3 text-sm text-gray-900">{log.user_name}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
