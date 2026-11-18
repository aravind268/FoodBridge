\# FoodBridge – Food Rescue and Donation Management Platform



FoodBridge is a full-stack web application designed to reduce food waste by connecting food donors with NGOs and volunteers. It provides a centralized platform to manage surplus food donations, reservations, collection, and delivery.



\## Key Features



\- \*\*Role-Based Authentication:\*\* Separate access for Donors, NGOs, Volunteers, and Administrators.

\- \*\*Food Donation Management:\*\* Donors can post surplus food details, including quantity, preparation time, storage conditions, and pickup deadlines.

\- \*\*NGO Dashboard:\*\* NGOs can browse, filter, and reserve available food donations.

\- \*\*Volunteer Management:\*\* Volunteers can manage food collection and delivery workflows.

\- \*\*Admin Dashboard:\*\* Administrators can monitor donations, view platform statistics, and manage user accounts.

\- \*\*Donation Tracking:\*\* Track donation progress from availability and reservation through collection, delivery, and receipt confirmation.

\- \*\*Food Safety Checks:\*\* Includes food-related validation and storage information to support safer food redistribution.



\## Technology Stack



| Layer | Technologies |

|---|---|

| Frontend | React.js, JavaScript, HTML, CSS |

| Backend | Node.js, Express.js |

| Database | MongoDB Atlas |

| Authentication | JWT, bcrypt |

| Development Tools | Git, GitHub, Vite, VS Code |



\## Project Structure



```text

FoodBridge/

├── client/                 # Original frontend

├── client-react/           # React frontend

│   ├── src/

│   │   ├── pages/          # Role-based dashboards

│   │   ├── services/       # API integration

│   │   ├── App.jsx

│   │   └── App.css

│   └── package.json

├── server/                 # Node.js and Express backend

│   ├── middleware/

│   ├── models/

│   ├── routes/

│   ├── server.js

│   └── package.json

├── .gitignore

└── README.md

```



\## Getting Started



\### Prerequisites



\- Node.js and npm

\- MongoDB Atlas account or a MongoDB database

\- Git



\### 1. Clone the Repository



```bash

git clone https://github.com/aravind268/FoodBridge.git

cd FoodBridge

```



\### 2. Set Up the Backend



```bash

cd server

npm install

```



Create a `.env` file inside the `server` folder and configure:



```env

PORT=5000

MONGODB\_URI=your\_mongodb\_connection\_string

JWT\_SECRET=your\_secure\_jwt\_secret

```



Start the backend:



```bash

npm start

```



The backend runs at:



`http://localhost:5000`



\### 3. Set Up the Frontend



Open another terminal:



```bash

cd FoodBridge/client-react

npm install

npm run dev

```



Open the local URL displayed by Vite in your browser.



\## Main API Endpoints



| Method | Endpoint | Description |

|---|---|---|

| POST | `/api/auth/register` | Register a user |

| POST | `/api/auth/login` | Authenticate a user |

| GET | `/api/donations` | Retrieve donations |

| POST | `/api/donations` | Create a donation |

| PATCH | `/api/donations/:id/reserve` | Reserve a donation |

| PATCH | `/api/donations/:id/collect` | Update collection |

| PATCH | `/api/donations/:id/deliver` | Update delivery |

| PATCH | `/api/donations/:id/confirm-receipt` | Confirm receipt |

| GET | `/api/admin/stats` | Retrieve admin statistics |

| GET | `/api/admin/users` | View registered users |

| GET | `/api/admin/donations` | Monitor donations |



\## Security



\- Passwords are hashed using bcrypt.

\- JWT-based authentication is implemented.

\- Role-based access control protects application functionality.

\- Environment variables are used for sensitive configuration.

\- `.env` files and dependencies are excluded through `.gitignore`.



\## Project Objective



FoodBridge aims to make surplus food redistribution more organized and accessible by connecting food donors, NGOs, and volunteers through a single digital platform.



\## Author



\*\*Aravind\*\*



GitHub: \[aravind268](https://github.com/aravind268)



\## Repository



\[FoodBridge – GitHub](https://github.com/aravind268/FoodBridge)



\## 📸 Project Screenshots



\### 1. Homepage

!\[FoodBridge Homepage](screenshots/homepage.jpeg)



\### 2. Donor Dashboard

!\[Donor Dashboard](screenshots/donor-dashboard.jpeg)



\### 3. NGO Dashboard

!\[NGO Dashboard](screenshots/ngo-dashboard.jpeg)



\### 4. Volunteer Dashboard

!\[Volunteer Dashboard](screenshots/volunteer-dashboard.jpeg)



\### 5. Admin Dashboard

!\[Admin Dashboard](screenshots/admin-dashboard.jpeg)

