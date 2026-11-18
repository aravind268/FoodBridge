
import { useEffect, useState } from 'react';
import {
  getMyDonations,
  createDonation,
} from '../services/api';

const initialForm = {
  foodName: '',
  quantity: '',
  description: '',
  foodImage: '',
  preparedAt: '',
  pickupDeadline: '',
  storage: '',
  restaurantName: '',
  pickupAddress: '',
  contactPhone: '',
  mapsLink: '',
  latitude: '',
  longitude: '',
};

function Donor() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadDonations() {
    try {
      setLoading(true);
      setError('');

      const data = await getMyDonations();
      setDonations(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load donations.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDonations();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const result = await createDonation({
        ...form,
        quantity: Number(form.quantity),
        latitude: form.latitude || null,
        longitude: form.longitude || null,
      });

      setSuccess(result.message || 'Donation posted successfully!');
      setForm(initialForm);
      setShowForm(false);

      await loadDonations();
    } catch (err) {
      setError(err.message || 'Failed to post donation.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="ngo-page donor-dashboard">
      <section className="ngo-heading">
        <span className="eyebrow">FOODBRIDGE</span>
        <h1>Food Donor Dashboard</h1>
        <p>Manage and track your surplus food donations.</p>
      </section>

      <section className="donor-section">
        <h2>Post Surplus Food</h2>

        <p>
          Share your surplus food with verified NGOs
          and help reduce food waste.
        </p>

        <button
          className="primary-button"
          onClick={() => {
            setShowForm(!showForm);
            setError('');
            setSuccess('');
          }}
        >
          {showForm ? 'Close Form' : '+ Post Food Donation'}
        </button>

        {success && (
          <p className="success-message" role="status">
            {success}
          </p>
        )}

        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="donation-form">

            <h2>Food Donation Details</h2>

            <label>Food Name *</label>
            <input
              name="foodName"
              value={form.foodName}
              onChange={handleChange}
              placeholder="Example: Vegetable Rice"
              required
            />

            <label>Quantity (kg) *</label>
            <input
              name="quantity"
              type="number"
              min="0.1"
              max="500"
              step="0.1"
              value={form.quantity}
              onChange={handleChange}
              placeholder="Example: 10"
              required
            />

            <label>Description *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the food (10–200 characters)"
              minLength={10}
              maxLength={200}
              required
            />

            <label>Food Image URL</label>
            <input
              name="foodImage"
              type="url"
              value={form.foodImage}
              onChange={handleChange}
              placeholder="https://example.com/food.jpg"
            />

            <label>Preparation Date and Time *</label>
            <input
              name="preparedAt"
              type="datetime-local"
              value={form.preparedAt}
              onChange={handleChange}
              required
            />

            <label>Pickup Deadline *</label>
            <input
              name="pickupDeadline"
              type="datetime-local"
              value={form.pickupDeadline}
              onChange={handleChange}
              required
            />

            <label>Storage Condition *</label>
            <select
              name="storage"
              value={form.storage}
              onChange={handleChange}
              required
            >
              <option value="">Select storage condition</option>
              <option value="hot">Hot</option>
              <option value="refrigerated">Refrigerated</option>
              <option value="room-temperature">Room Temperature</option>
            </select>

            <h3>Pickup Information</h3>

            <label>Restaurant / Donor Name</label>
            <input
              name="restaurantName"
              value={form.restaurantName}
              onChange={handleChange}
              placeholder="Restaurant or organization name"
            />

            <label>Pickup Address</label>
            <textarea
              name="pickupAddress"
              value={form.pickupAddress}
              onChange={handleChange}
              placeholder="Enter complete pickup address"
            />

            <label>Contact Phone</label>
            <input
              name="contactPhone"
              type="tel"
              value={form.contactPhone}
              onChange={handleChange}
              placeholder="Enter contact number"
            />

            <label>Google Maps Link</label>
            <input
              name="mapsLink"
              type="url"
              value={form.mapsLink}
              onChange={handleChange}
              placeholder="Paste Google Maps link"
            />

            <label>Latitude (optional)</label>
            <input
              name="latitude"
              type="number"
              step="any"
              value={form.latitude}
              onChange={handleChange}
              placeholder="Example: 17.385"
            />

            <label>Longitude (optional)</label>
            <input
              name="longitude"
              type="number"
              step="any"
              value={form.longitude}
              onChange={handleChange}
              placeholder="Example: 78.4867"
            />

            <button
              type="submit"
              className="primary-button"
              disabled={submitting}
            >
              {submitting ? 'Saving Donation...' : 'Submit Donation'}
            </button>
          </form>
        )}
      </section>

      <section className="donor-section donor-donation-list">
        <h2>My Donations</h2>

        <button
          className="primary-button"
          onClick={loadDonations}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh Donations'}
        </button>

        {loading && <p>Loading your donations...</p>}

        {!loading && !error && donations.length === 0 && (
          <p>You haven't posted any food donations yet.</p>
        )}

        {!loading && donations.length > 0 && (
          <div className="donation-grid">
            {donations.map((donation) => (
              <article className="donor-donation-card" key={donation._id}>
                {donation.foodImage && (
                  <img
                    src={donation.foodImage}
                    alt={donation.foodName}
                    style={{
                      width: '100%',
                      maxHeight: '200px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                    }}
                  />
                )}

                <h3>{donation.foodName}</h3>
                <p><strong>Quantity:</strong> {donation.quantity} kg</p>
                <p><strong>Description:</strong> {donation.description}</p>
                <p><strong>Storage:</strong> {donation.storage}</p>
                <p><strong>Pickup Address:</strong> {donation.pickupAddress || 'Not provided'}</p>

                <p>
                  <strong>Pickup Deadline:</strong>{' '}
                  {donation.pickupDeadline
                    ? new Date(donation.pickupDeadline).toLocaleString()
                    : 'Not specified'}
                </p>

                <p>
                  <strong>Status:</strong> {donation.status}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Donor;
