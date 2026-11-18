
import { useEffect, useState } from 'react';
import './Admin.css';

const API_URL = 'http://localhost:5000/api';

function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingUser, setUpdatingUser] = useState('');

  // Search and filter states
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [donationStatusFilter, setDonationStatusFilter] = useState('all');

  const token = localStorage.getItem('foodbridgeToken');

  let currentUser = null;

  try {
    currentUser = JSON.parse(
      localStorage.getItem('foodbridgeUser')
    );
  } catch {
    currentUser = null;
  }

  // API request helper
  async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Request failed.');
    }

    return data;
  }

  // Load dashboard information
  async function loadDashboard() {
    setLoading(true);
    setError('');

    try {
      const [statsData, usersData, donationsData] =
        await Promise.all([
          apiRequest('/admin/stats'),
          apiRequest('/admin/users'),
          apiRequest('/admin/donations'),
        ]);

      setStats(statsData.stats);
      setUsers(usersData.users || []);
      setDonations(donationsData.donations || []);
    } catch (err) {
      setError(err.message || 'Unable to load admin dashboard.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  // Filter users by name, email and role
  const filteredUsers = users.filter((user) => {
    const search = userSearch.trim().toLowerCase();

    const matchesSearch =
      user.name?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search);

    const matchesRole =
      roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Filter donations by status
  const filteredDonations = donations.filter((donation) => {
    return (
      donationStatusFilter === 'all' ||
      donation.status?.toLowerCase() ===
        donationStatusFilter.toLowerCase()
    );
  });

  // Activate or deactivate user
  async function toggleUserStatus(user) {
    if (
      user._id === currentUser?.id ||
      user._id === currentUser?._id
    ) {
      alert('You cannot change your own account status.');
      return;
    }

    const newStatus = !user.isActive;

    const confirmed = window.confirm(
      `Are you sure you want to ${
        newStatus ? 'activate' : 'deactivate'
      } this account?`
    );

    if (!confirmed) return;

    setUpdatingUser(user._id);

    try {
      const data = await apiRequest(
        `/admin/users/${user._id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            isActive: newStatus,
          }),
        }
      );

      setUsers((previousUsers) =>
        previousUsers.map((item) =>
          item._id === user._id ? data.user : item
        )
      );
    } catch (err) {
      alert(err.message || 'Unable to update user status.');
    } finally {
      setUpdatingUser('');
    }
  }

  // Format dates
  function formatDate(date) {
    if (!date) return 'Not available';

    return new Date(date).toLocaleDateString('en-IN');
  }

  // Loading screen
  if (loading) {
    return (
      <main className="admin-page">
        <p className="admin-message">
          Loading admin dashboard...
        </p>
      </main>
    );
  }

  return (
    <main className="admin-page">

      {/* Dashboard Heading */}
      <section className="admin-heading">
        <div>
          <span className="admin-eyebrow">
            FOODBRIDGE CONTROL PANEL
          </span>

          <h1>Admin Dashboard</h1>

          <p>
            Monitor platform activity, users and food donations.
          </p>
        </div>

        <button
          className="admin-refresh"
          onClick={loadDashboard}
          disabled={loading}
        >
          Refresh Data
        </button>
      </section>

      {/* Error Message */}
      {error && (
        <div className="admin-error" role="alert">
          {error}
          <button onClick={loadDashboard}>
            Try Again
          </button>
        </div>
      )}

      {/* Platform Statistics */}
      {stats && (
        <>
          <section className="admin-section">
            <h2>Platform Overview</h2>

            <div className="admin-stats-grid">
              <StatCard
                title="Total Users"
                value={stats.totalUsers}
              />

              <StatCard
                title="Total Donors"
                value={stats.totalDonors}
              />

              <StatCard
                title="Total NGOs"
                value={stats.totalNGOs}
              />

              <StatCard
                title="Total Volunteers"
                value={stats.totalVolunteers}
              />

              <StatCard
                title="Total Donations"
                value={stats.totalDonations}
              />
            </div>
          </section>

          {/* Donation Statistics */}
          <section className="admin-section">
            <h2>Donation Status</h2>

            <div className="admin-stats-grid">
              <StatCard
                title="Available"
                value={stats.availableDonations}
              />

              <StatCard
                title="Reserved"
                value={stats.reservedDonations}
              />

              <StatCard
                title="Collected"
                value={stats.collectedDonations}
              />

              <StatCard
                title="Delivered"
                value={stats.deliveredDonations}
              />
            </div>
          </section>
        </>
      )}

      {/* User Management */}
      <section className="admin-section">
        <h2>User Management</h2>

        <p className="admin-description">
          View registered accounts and manage their active status.
        </p>

        {/* User Search and Role Filter */}
        <div className="admin-filters">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="donor">Donors</option>
            <option value="ngo">NGOs</option>
            <option value="volunteer">Volunteers</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Account Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => {
                const isCurrentUser =
                  user._id === currentUser?.id ||
                  user._id === currentUser?._id;

                return (
                  <tr key={user._id}>
                    <td>{user.name}</td>

                    <td>{user.email}</td>

                    <td className="admin-role">
                      {user.role}
                    </td>

                    <td>
                      <span
                        className={
                          user.isActive
                            ? 'admin-status active'
                            : 'admin-status inactive'
                        }
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td>
                      <button
                        className="admin-action"
                        disabled={
                          isCurrentUser ||
                          updatingUser === user._id
                        }
                        onClick={() => toggleUserStatus(user)}
                      >
                        {updatingUser === user._id
                          ? 'Updating...'
                          : user.isActive
                            ? 'Deactivate'
                            : 'Activate'}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Donation Monitoring */}
      <section className="admin-section">
        <h2>Donation Monitoring</h2>

        <p className="admin-description">
          View all food donations registered on FoodBridge.
        </p>

        {/* Donation Status Filter */}
        <div className="admin-filters">
          <select
            value={donationStatusFilter}
            onChange={(e) =>
              setDonationStatusFilter(e.target.value)
            }
          >
            <option value="all">
              All Donation Statuses
            </option>

            <option value="Available">Available</option>
            <option value="Reserved">Reserved</option>
            <option value="Collected">Collected</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Food Name</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Pickup Deadline</th>
              </tr>
            </thead>

            <tbody>
              {filteredDonations.map((donation) => (
                <tr key={donation._id}>
                  <td>
                    {donation.foodName || 'Not specified'}
                  </td>

                  <td>
                    {donation.quantity ?? '—'}
                  </td>

                  <td>
                    <span className="admin-status active">
                      {donation.status || 'Unknown'}
                    </span>
                  </td>

                  <td>
                    {formatDate(donation.pickupDeadline)}
                  </td>
                </tr>
              ))}

              {filteredDonations.length === 0 && (
                <tr>
                  <td colSpan="4">
                    No donations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

    </main>
  );
}

// Reusable Statistics Card
function StatCard({ title, value }) {
  return (
    <article className="admin-stat-card">
      <p>{title}</p>
      <h3>{value ?? 0}</h3>
    </article>
  );
}

export default Admin;
