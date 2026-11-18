
import { useEffect, useState } from 'react';
import {
  getDonations,
  collectDonation,
  deliverDonation,
} from '../services/api';

function Volunteer() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadDonations() {
    try {
      setLoading(true);
      setError('');

      const data = await getDonations();
      setDonations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDonations();
  }, []);


async function handleCollect(donation) {
  try {
    setMessage('');
    setError('');

    await collectDonation(donation._id);

    setMessage('Food collected successfully!');
    await loadDonations();
  } catch (err) {
    setError(err.message);
  }
}


  
async function handleDeliver(donation) {
  try {
    setMessage('');
    setError('');

    await deliverDonation(donation._id);

    setMessage('Food marked as delivered successfully!');
    await loadDonations();
  } catch (err) {
    setError(err.message);
  }
}


  const assignedDonations = donations.filter(
    donation =>
      donation.status === 'Reserved' ||
      donation.status === 'Collected'
  );

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Volunteer Food Delivery Portal</h1>
          <p>Manage food collection and delivery activities.</p>
        </div>

        <button onClick={loadDonations}>Refresh</button>
      </header>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      <section className="donations-section">
        <h2>Assigned Donations</h2>

        {loading ? (
          <p>Loading donations...</p>
        ) : assignedDonations.length === 0 ? (
          <p>No donations are currently available for volunteer action.</p>
        ) : (
          <div className="donation-grid">
            {assignedDonations.map(donation => (
              <article className="donation-card" key={donation._id}>
                <h3>{donation.foodName}</h3>

                <p><strong>Status:</strong> {donation.status}</p>
                <p><strong>Quantity:</strong> {donation.quantity}</p>
                <p><strong>Donor:</strong> {donation.restaurantName || 'Not provided'}</p>
                <p><strong>Pickup address:</strong> {donation.pickupAddress}</p>
                <p><strong>NGO:</strong> {donation.reservedBy}</p>
                <p><strong>Delivery address:</strong> {donation.deliveryAddress}</p>

                {donation.status === 'Reserved' && (
                  <button onClick={() => handleCollect(donation)}>
                    Collect Food
                  </button>
                )}

                {donation.status === 'Collected' && (
                  <button onClick={() => handleDeliver(donation)}>
                    Mark as Delivered
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Volunteer;
