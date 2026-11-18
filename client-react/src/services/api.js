
const API_BASE_URL = 'http://localhost:5000/api';

// Get all food donations
export async function getDonations() {
  const response = await fetch(`${API_BASE_URL}/donations`);

  if (!response.ok) {
    throw new Error(`Failed to fetch donations (${response.status})`);
  }

  const data = await response.json();

  if (data.success === false) {
    throw new Error('The server could not retrieve donations.');
  }

  return data.donations;
}

// Reserve a food donation

export async function reserveDonation(id, ngoDetails) {
  const token = localStorage.getItem('foodbridgeToken');

  const response = await fetch(
    `${API_BASE_URL}/donations/${id}/reserve`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(ngoDetails),
    }
  );

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Failed to reserve donation.');
  }

  return data;
}


// Register a new user
export async function registerUser(userDetails) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userDetails),
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Registration failed.');
  }

  return data;
}

// Login an existing user
export async function loginUser(credentials) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Login failed.');
  }

  return data;
}

// Get donations posted by the logged-in donor
export async function getMyDonations() {
  const token = localStorage.getItem('foodbridgeToken');

  if (!token) {
    throw new Error('Please log in to continue.');
  }

  const response = await fetch(`${API_BASE_URL}/donations/my`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Failed to fetch your donations.');
  }

  return data.donations;
}

 // Get reservations made by the logged-in NGO
export async function getMyReservations() {
  const token = localStorage.getItem('foodbridgeToken');

  if (!token) {
    throw new Error('Please log in to continue.');
  }

  const response = await fetch(
    `${API_BASE_URL}/donations/my-reservations`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Failed to fetch your reservations.');
  }

  return data.donations;
}


// Create a new food donation
export async function createDonation(donationDetails) {
  const token = localStorage.getItem('foodbridgeToken');

  if (!token) {
    throw new Error('Please log in to continue.');
  }

  const response = await fetch(`${API_BASE_URL}/donations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(donationDetails),
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Failed to create donation.');
  }

  return data;
}


// Collect a reserved food donation (Volunteer only)
export async function collectDonation(id, volunteerDetails) {
  const token = localStorage.getItem('foodbridgeToken');

  const response = await fetch(
    `${API_BASE_URL}/donations/${id}/collect`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(volunteerDetails),
    }
  );

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Failed to collect donation.');
  }

  return data;
}

// Mark a collected food donation as delivered (Volunteer only)
export async function deliverDonation(id, volunteerName) {
  const token = localStorage.getItem('foodbridgeToken');

  const response = await fetch(
    `${API_BASE_URL}/donations/${id}/deliver`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ volunteerName }),
    }
  );

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Failed to deliver donation.');
  }

  return data;
}


// Confirm food receipt (NGO only)
export async function confirmReceipt(id) {
  const token = localStorage.getItem('foodbridgeToken');

  const response = await fetch(
    `${API_BASE_URL}/donations/${id}/confirm-receipt`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Failed to confirm receipt.');
  }

  return data;
}


