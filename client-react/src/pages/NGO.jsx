
import { useEffect, useState } from 'react';
import {
  getDonations,
  getMyReservations,
  reserveDonation,
  confirmReceipt,
} from '../services/api';

function NGO() {
  const currentUser = JSON.parse(
    localStorage.getItem('foodbridgeUser') || 'null'
  );

  const [donations, setDonations] = useState([]);
  const [myReservations, setMyReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [reservingId, setReservingId] = useState(null);
  const [notice, setNotice] = useState('');
  const [confirmingId, setConfirmingId] = useState(null);

  // Fetch all donations
  async function loadDonations() {
    try {
      setLoading(true);
      setError('');

      const data = await getDonations();
      setDonations(data || []);
    } catch (err) {
      console.error('Error loading donations:', err);
      setError(err.message || 'Unable to load donations.');
    } finally {
      setLoading(false);
    }
  }

  // Fetch reservations belonging to this NGO
  async function loadMyReservations() {
    try {
      const data = await getMyReservations();
      setMyReservations(data || []);
    } catch (err) {
      console.error('Error loading NGO reservations:', err);
      setError(err.message || 'Failed to load your reservations.');
    }
  }

  // Reserve an available donation
  async function handleReserve(id) {
    const ngoName = window.prompt('Enter your NGO name:');

    if (!ngoName || !ngoName.trim()) {
      return;
    }

    const ngoPhone = window.prompt(
      'Enter your 10-digit mobile number:'
    );

    if (!ngoPhone || !/^[6-9]\d{9}$/.test(ngoPhone.trim())) {
      window.alert('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    const deliveryAddress = window.prompt(
      'Enter the food delivery address:'
    );

    if (!deliveryAddress || !deliveryAddress.trim()) {
      return;
    }

    try {
      setReservingId(id);
      setNotice('');
      setError('');

      const result = await reserveDonation(id, {
        ngoName: ngoName.trim(),
        ngoPhone: ngoPhone.trim(),
        deliveryAddress: deliveryAddress.trim(),
      });

      setNotice(result.message || 'Food reserved successfully!');

      await loadDonations();
      await loadMyReservations();
    } catch (err) {
      console.error('Error reserving donation:', err);
      setError(err.message || 'Failed to reserve donation.');
    } finally {
      setReservingId(null);
    }
  }

  // Confirm receipt of delivered food
  async function handleConfirmReceipt(donation) {
    try {
      setConfirmingId(donation._id);
      setNotice('');
      setError('');

      const result = await confirmReceipt(donation._id);

      setNotice(result.message || 'Food receipt confirmed successfully!');

      await loadDonations();
      await loadMyReservations();
    } catch (err) {
      setError(err.message || 'Failed to confirm receipt.');
    } finally {
      setConfirmingId(null);
    }
  }

  // Load data when the page opens
  useEffect(() => {
    loadDonations();
    loadMyReservations();
  }, []);

  // Filter donations by status
  const filteredDonations =
    statusFilter === 'All'
      ? donations
      : donations.filter(
          (donation) => donation.status === statusFilter
        );

  return (
    <main className="ngo-page">

      <a href="/" className="back-link">
        ← Back to Home
      </a>

      <div className="ngo-heading">
        <h1>NGO Food Rescue Portal</h1>
        <p>
          Browse available food donations and reserve food for
          people who need it.
        </p>
      </div>

      {notice && (
        <div className="success-message" role="status">
          {notice}
        </div>
      )}

      {error && (
        <div className="error-message" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => {
            loadDonations();
            loadMyReservations();
          }}>
            Try Again
          </button>
        </div>
      )}

      <section className="donation-controls">
        <div className="donation-count">
          <h2>Food Donations</h2>
          <p>
            {filteredDonations.length}{' '}
            {filteredDonations.length === 1
              ? 'donation'
              : 'donations'} found
          </p>
        </div>

        <div className="filter-controls">
          <label htmlFor="statusFilter">Filter by status:</label>

          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All</option>
            <option value="Available">Available</option>
            <option value="Reserved">Reserved</option>
            <option value="Collected">Collected</option>
            <option value="Delivered">Delivered</option>
          </select>

          <button
            type="button"
            onClick={() => {
              loadDonations();
              loadMyReservations();
            }}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </section>

      {loading && donations.length === 0 && (
        <p className="loading-message">
          Loading food donations...
        </p>
      )}

      {!loading && !error && filteredDonations.length === 0 && (
        <div className="empty-message">
          <h3>No donations found</h3>
          <p>
            {statusFilter === 'All'
              ? 'There are no food donations available right now.'
              : `There are no donations with status "${statusFilter}".`}
          </p>
        </div>
      )}

      {/* NGO's own reservations */}
      <section className="donation-controls">
        <div className="donation-count">
          <h2>My Reservations</h2>
          <p>
            {myReservations.length} reservations found
          </p>
        </div>
      </section>

      {myReservations.length === 0 ? (
        <div className="empty-message">
          <p>You haven't reserved any donations yet.</p>
        </div>
      ) : (
        <section className="donation-grid">
          {myReservations.map((donation) => (
            <article className="donation-card" key={donation._id}>
              <h3>{donation.foodName}</h3>

              <p>
                <strong>Quantity:</strong> {donation.quantity} kg
              </p>

              <p>
                <strong>Donor:</strong>{' '}
                {donation.restaurantName || 'Not specified'}
              </p>

              <p>
                <strong>Pickup Address:</strong>{' '}
                {donation.pickupAddress || 'Not specified'}
              </p>

              <p>
                <strong>Delivery Address:</strong>{' '}
                {donation.deliveryAddress || 'Not specified'}
              </p>

              <p>
                <strong>Status:</strong> {donation.status}
              </p>

              {donation.ngoConfirmedAt && (
                <p className="success-message">
                  ✓ Receipt confirmed
                </p>
              )}
            </article>
          ))}
        </section>
      )}

      {/* All food donations */}
      <section className="donation-grid">
        {filteredDonations.map((donation) => {
          const isMyReservation =
            String(donation.ngoId) === String(currentUser?.id);

          return (
            <article className="donation-card" key={donation._id}>

              <div className="donation-image">
                {donation.image ? (
                  <img
                    src={donation.image}
                    alt={donation.foodName || 'Food donation'}
                  />
                ) : (
                  <div className="donation-image-placeholder">
                    🍱
                  </div>
                )}
              </div>

              <div className="donation-card-content">

                <div className="donation-card-heading">
                  <h3>{donation.foodName || 'Food Donation'}</h3>

                  <span
                    className={`donation-status status-${(
                      donation.status || 'Available'
                    )
                      .toLowerCase()
                      .replace(/\s+/g, '-')}`}
                  >
                    {donation.status || 'Available'}
                  </span>
                </div>

                <p>
                  <strong>Quantity:</strong>{' '}
                  {donation.quantity || 'Not specified'}
                </p>

                <p>
                  <strong>Donor:</strong>{' '}
                  {donation.restaurantName || 'Not specified'}
                </p>

                <p>
                  <strong>Pickup address:</strong>{' '}
                  {donation.pickupAddress || 'Not specified'}
                </p>

                {donation.description && (
                  <p>
                    <strong>Description:</strong>{' '}
                    {donation.description}
                  </p>
                )}

                {/* Reserve only available donations */}
                {donation.status === 'Available' && (
                  <button
                    type="button"
                    className="reserve-button"
                    onClick={() => handleReserve(donation._id)}
                    disabled={reservingId === donation._id}
                  >
                    {reservingId === donation._id
                      ? 'Reserving...'
                      : 'Reserve Donation'}
                  </button>
                )}

                {donation.status === 'Reserved' && (
                  <p className="reservation-info">
                    This donation has already been reserved.
                  </p>
                )}

                {donation.status === 'Collected' && (
                  <p className="reservation-info">
                    This donation has been collected.
                  </p>
                )}

                {/* Only the NGO that reserved it can confirm receipt */}
                {donation.status === 'Delivered' && isMyReservation && (
                  donation.ngoConfirmedAt ? (
                    <p className="reservation-info">
                      ✓ Receipt confirmed successfully.
                    </p>
                  ) : (
                    <div>
                      <p className="reservation-info">
                        This donation has been delivered.
                        Please confirm receipt.
                      </p>

                      <button
                        type="button"
                        className="reserve-button"
                        onClick={() => handleConfirmReceipt(donation)}
                        disabled={confirmingId === donation._id}
                      >
                        {confirmingId === donation._id
                          ? 'Confirming...'
                          : 'Confirm Receipt'}
                      </button>
                    </div>
                  )
                )}

              </div>
            </article>
          );
        })}
      </section>

    </main>
  );
}

export default NGO;
