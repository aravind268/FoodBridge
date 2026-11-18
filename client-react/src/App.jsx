
import { useState } from 'react';
import NGO from './pages/NGO';
import Donor from './pages/Donor';
import Volunteer from './pages/Volunteer';
import Admin from './pages/Admin';
import { loginUser, registerUser } from './services/api';
import './App.css';

const portals = [
  {
    title: 'Food Donor',
    description: 'Share surplus food from restaurants, hostels and events.',
    icon: '🍱',
    role: 'donor',
  },
  {
    title: 'NGO Portal',
    description: 'Discover donations and reserve food for people in need.',
    icon: '🤝',
    role: 'ngo',
  },
  {
    title: 'Volunteer Portal',
    description: 'Collect and deliver food to communities.',
    icon: '🚚',
    role: 'volunteer',
  },
  {
    title: 'Admin Portal',
    description: 'Manage users and monitor food rescue activities.',
    icon: '⚙️',
    role: 'admin',
  },
];

const initialForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
};

// Custom FoodBridge logo
function FoodBridgeLogo() {
  return (
    <div className="brand">
      <svg
        className="brand-icon"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="FoodBridge logo"
      >
        <path
          d="M50 7 A43 43 0 0 1 91 37"
          fill="none"
          stroke="#F59E0B"
          strokeWidth="6"
          strokeLinecap="round"
        />

        <path
          d="M16 55 C10 73 29 89 50 91 C72 90 90 72 84 53"
          fill="none"
          stroke="#176B3A"
          strokeWidth="7"
          strokeLinecap="round"
        />

        <path
          d="M19 65 C35 59 41 43 49 27 C58 47 67 57 81 64 C66 84 35 85 19 65Z"
          fill="#278A45"
        />

        <path
          d="M49 28 C44 46 42 61 49 76"
          stroke="#DDF3D7"
          strokeWidth="3"
          fill="none"
        />

        <path
          d="M28 44 L28 65 M35 44 L35 65 M42 44 L42 65 M28 44 V39 M35 44 V39 M42 44 V39"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <path
          d="M66 29 C54 40 55 55 67 60 C78 49 77 37 66 29Z"
          fill="#F59E0B"
        />

        <path
          d="M67 38 L67 57"
          stroke="#FFFFFF"
          strokeWidth="2"
        />
      </svg>

      <span className="brand-name">
        Food<span>Bridge</span>
        <small>Rescue Food. Share Hope.</small>
      </span>
    </div>
  );
}

function App() {
  const [selectedPortal, setSelectedPortal] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('foodbridgeUser')) || null;
    } catch {
      return null;
    }
  });

  const selectedPortalDetails = portals.find(
    (portal) => portal.role === selectedPortal
  );

  function openPortal(role) {
    setSelectedPortal(role);
    setAuthMode('login');
    setForm(initialForm);
    setError('');
    setNotice('');
  }

  function handleInputChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setNotice('');
    setLoading(true);

    try {
      let data;

      if (authMode === 'register') {
        if (selectedPortal === 'admin') {
          throw new Error('Admin registration is not available.');
        }

        data = await registerUser({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone,
          role: selectedPortal,
        });
      } else {
        data = await loginUser({
          email: form.email,
          password: form.password,
        });

        if (data.user.role !== selectedPortal) {
          throw new Error(
            `This account belongs to the ${data.user.role.toUpperCase()} portal. Please select the correct portal.`
          );
        }
      }

      localStorage.setItem('foodbridgeToken', data.token);
      localStorage.setItem('foodbridgeUser', JSON.stringify(data.user));

      setCurrentUser(data.user);
      setForm(initialForm);
      setSelectedPortal('');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('foodbridgeToken');
    localStorage.removeItem('foodbridgeUser');

    setCurrentUser(null);
    setSelectedPortal('');
    setForm(initialForm);
    setError('');
    setNotice('');
  }

  function showHome() {
    setSelectedPortal('');
    setAuthMode('login');
    setForm(initialForm);
    setError('');
    setNotice('');
  }

  // Authenticated user dashboards
  if (currentUser) {
    const dashboardComponents = {
      ngo: <NGO />,
      donor: <Donor />,
      volunteer: <Volunteer />,
      admin: <Admin />,
    };

    return (
      <div className="authenticated-app">
        <div className="dashboard-topbar">
          <FoodBridgeLogo />

          <div className="dashboard-user">
            <span>Welcome, {currentUser.name}</span>

            <button className="primary-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {dashboardComponents[currentUser.role] || (
          <main className="ngo-page">
            <h2>Welcome to FoodBridge</h2>
            <p>Your account is authenticated successfully.</p>
          </main>
        )}
      </div>
    );
  }

  // Login and registration screen
  if (selectedPortal) {
    const isRegister = authMode === 'register';

    return (
      <main className="auth-page">
        <button className="back-link" onClick={showHome}>
          ← Back to Home
        </button>

        <section className="modal auth-card">
          <FoodBridgeLogo />

          <span className="eyebrow">FOODBRIDGE ACCOUNT</span>

          <h2>{isRegister ? 'Join Our Community' : 'Welcome Back!'}</h2>

          <p className="auth-description">
            {selectedPortalDetails?.title} · Rescue Food. Share Hope.
          </p>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          {notice && (
            <div className="success-message" role="status">
              {notice}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <label htmlFor="name">Full Name</label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  minLength={2}
                  maxLength={100}
                  required
                />

                <label htmlFor="phone">Phone Number</label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  pattern="[6-9][0-9]{9}"
                  maxLength={10}
                  required={selectedPortal === 'volunteer'}
                />
              </>
            )}

            <label htmlFor="email">Email Address</label>

            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              required
            />

            <label htmlFor="password">Password</label>

            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleInputChange}
              placeholder="Minimum 8 characters"
              minLength={8}
              required
            />

            <button
              type="submit"
              className="primary-button auth-submit"
              disabled={loading}
            >
              {loading
                ? 'Please wait...'
                : isRegister
                  ? 'Create Account'
                  : 'Login'}
            </button>
          </form>

          {selectedPortal !== 'admin' && (
            <p className="auth-switch">
              {isRegister
                ? 'Already have an account? '
                : "Don't have an account? "}

              <button
                type="button"
                className="portal-link"
                onClick={() => {
                  setAuthMode(isRegister ? 'login' : 'register');
                  setError('');
                  setNotice('');
                  setForm(initialForm);
                }}
              >
                {isRegister ? 'Login' : 'Register'}
              </button>
            </p>
          )}
        </section>
      </main>
    );
  }

  // FoodBridge homepage
  return (
    <div className="app">
      <header className="navbar">
        <a className="brand-link" href="#home" aria-label="FoodBridge Home">
          <FoodBridgeLogo />
        </a>

        <nav className="main-navigation">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#features">Features</a>
          <a href="#contact">Contact</a>
        </nav>

        <button
          className="primary-button nav-login"
          onClick={() => openPortal('donor')}
        >
          Login
        </button>
      </header>

      <main>
        {/* Realistic full-background food photograph hero */}
        <section
          className="hero-section hero-photo-background"
          id="home"
        >
          <div className="hero-content">
            <span className="eyebrow">
              TOGETHER, LET'S MAKE EVERY MEAL COUNT
            </span>

            <h1>
              Bridging the Gap Between
              <span className="highlight-green"> Surplus</span> and
              <span className="highlight-orange"> Hunger.</span>
            </h1>

            <blockquote className="hero-quote">
              "Good food should never go to waste, while someone goes hungry."
            </blockquote>

            <p>
              FoodBridge connects food donors with NGOs and volunteers,
              turning surplus food into hope and meaningful meals for
              communities in need.
            </p>

            <div className="hero-actions">
              <button
                className="primary-button"
                onClick={() => openPortal('donor')}
              >
                Donate Food →
              </button>

              <button
                className="secondary-button"
                onClick={() => openPortal('ngo')}
              >
                Find Donations →
              </button>
            </div>

            <div className="hero-highlight">
              <span>✓</span>
              Every meal shared is a step towards a hunger-free community.
            </div>
          </div>
        </section>

        {/* FoodBridge benefits */}
        <section className="values-section" id="features">
          <article className="value-card">
            <span>🍽️</span>
            <div>
              <h3>Reduce Food Waste</h3>
              <p>Give surplus food a second life.</p>
            </div>
          </article>

          <article className="value-card">
            <span>🤝</span>
            <div>
              <h3>Support Communities</h3>
              <p>Help provide meals to those in need.</p>
            </div>
          </article>

          <article className="value-card">
            <span>🛡️</span>
            <div>
              <h3>Prioritize Food Safety</h3>
              <p>Make responsible food rescue a priority.</p>
            </div>
          </article>

          <article className="value-card">
            <span>💚</span>
            <div>
              <h3>Share Hope</h3>
              <p>Build a more caring society together.</p>
            </div>
          </article>
        </section>

        {/* Portal selection */}
        <section className="portals-section" id="portals">
          <div className="section-heading">
            <span className="eyebrow">ONE PLATFORM, MANY HANDS</span>

            <h2>Be Part of the Food Rescue Journey</h2>

            <p>
              Choose your role and help connect surplus food with people
              who need it.
            </p>
          </div>

          <div className="portal-grid">
            {portals.map((portal) => (
              <article className="portal-card" key={portal.role}>
                <div className="portal-icon">{portal.icon}</div>

                <h3>{portal.title}</h3>

                <p>{portal.description}</p>

                <button
                  className="portal-link"
                  onClick={() => openPortal(portal.role)}
                >
                  Explore Portal →
                </button>
              </article>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="how-section" id="how-it-works">
          <div className="section-heading">
            <span className="eyebrow">
              SIMPLE STEPS. MEANINGFUL IMPACT.
            </span>

            <h2>How FoodBridge Works</h2>
          </div>

          <div className="steps-grid">
            <article className="step-card">
              <span>01</span>
              <div>🍲</div>
              <h3>Donate Surplus Food</h3>
              <p>
                Food donors share details of safe surplus food available.
              </p>
            </article>

            <article className="step-card">
              <span>02</span>
              <div>🏠</div>
              <h3>NGOs Reserve Food</h3>
              <p>
                Community organizations discover and reserve donations.
              </p>
            </article>

            <article className="step-card">
              <span>03</span>
              <div>🚚</div>
              <h3>Volunteers Deliver</h3>
              <p>
                Volunteers help collect and deliver food to its destination.
              </p>
            </article>

            <article className="step-card">
              <span>04</span>
              <div>❤️</div>
              <h3>Meals Reach People</h3>
              <p>
                Food reaches communities and helps reduce unnecessary waste.
              </p>
            </article>
          </div>
        </section>

        {/* About FoodBridge */}
        <section className="about-section" id="about">
          <div>
            <span className="eyebrow">OUR MISSION</span>
            <h2>Less Food Waste. More Shared Meals.</h2>
          </div>

          <p>
            FoodBridge is an AI-assisted food rescue platform designed to
            connect surplus food donors, NGOs and volunteers. Our mission
            is to make food redistribution easier, more organized and
            more accessible to communities in need.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer" id="contact">
        <FoodBridgeLogo />

        <p>Rescue Food. Share Hope.</p>

        <span>Building connections through food sharing.</span>

        <small>
          © {new Date().getFullYear()} FoodBridge. All rights reserved.
        </small>
      </footer>
    </div>
  );
}

export default App;
