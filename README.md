# CareSphere - Backend API Server

> **Live API URL:** [https://care-sphere-api.onrender.com](https://care-sphere-api.onrender.com)  
> **Client Website:** [https://care-sphere-platform.vercel.app](https://care-sphere-platform.vercel.app)  
> **Client Repository:** [https://github.com/abu-tahir-sk/care-sphere-client](https://github.com/abu-tahir-sk/care-sphere-client)

**CareSphere API** is the dedicated RESTful backend service powering the CareSphere social development and community event platform. Built with **Node.js**, **Express**, **TypeScript**, and **MongoDB Atlas**, it handles secure user authentication, event scheduling, volunteer participation, and data validation.

---

## Key Backend Features

* **JWT-Based Authentication & Authorization:** Implements JSON Web Token (JWT) verification middleware to protect sensitive mutation routes, profile updates, and dashboard queries.
* **Strict Future-Date Validation:** Enforces business logic ensuring all created or updated events have future dates (`eventDate > now`). Past events are blocked from creation and omitted from public upcoming listings.
* **Optimized MongoDB Queries:** Utilizes MongoDB's `.limit()` operator to fetch the 6 most recent upcoming events for the homepage hero carousel, as well as indexed queries for fast searching and category filtering.
* **Ownership Enforcement:** Guarantees that only the original creator of an event can update or delete it, validated against the organizer's authenticated email.
* **Volunteer Event Registration:** Manages event joining with duplicate prevention (`EventJoin` compound index `{ eventId: 1, userEmail: 1 }`), real-time participant counting, and chronological sorting.
* **Database Seeding Utility:** Includes an automated seed script (`npm run seed`) that populates the database with realistic grassroots drives in Dhaka (Mirpur 10, Mohammadpur, Dhanmondi Lake, Uttara, etc.).

---

## Tech Stack

* **Runtime:** Node.js (v18+)
* **Framework:** Express.js 4.x
* **Language:** TypeScript 5.x
* **Database:** MongoDB Atlas (Mongoose 8.x ODM)
* **Security & Auth:** `jsonwebtoken`, `bcryptjs`, `cors`, `dotenv`
* **Dev Tools:** `ts-node-dev`, `ts-node`

---

## Environment Variables

Create a `.env` file in the `server` directory with the following variables:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:3000
```

---

## API Endpoints Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user with password validation |
| `POST` | `/api/auth/login` | Public | Login with email and password |
| `POST` | `/api/auth/social` | Public | Google / GitHub social sign-in |
| `GET` | `/api/auth/me` | Protected | Fetch current user session from JWT |
| `PUT` | `/api/auth/profile` | Protected | Update profile name, photoURL, and bio |

### Events (`/api/events`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/events/upcoming` | Public | Get upcoming events (supports `?limit=6`, `?search=`, `?eventType=`) |
| `GET` | `/api/events/:id` | Public | Get single event details and join status |
| `POST` | `/api/events` | Protected | Create new event (future date strictly enforced) |
| `PUT` | `/api/events/:id` | Protected | Update event (only allowed by event creator) |
| `DELETE` | `/api/events/:id` | Protected | Delete event and clean up join records (creator only) |
| `POST` | `/api/events/:id/join` | Protected | Join an event as a volunteer |
| `DELETE` | `/api/events/:id/join` | Protected | Cancel event registration (leave event) |
| `GET` | `/api/events/user/created`| Protected | Get events created by logged-in user |
| `GET` | `/api/events/user/joined` | Protected | Get events joined by logged-in user (sorted by date) |
| `GET` | `/api/events/:id/check-joined` | Protected | Check if current user has joined this event |

---

## Local Development & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Sample Community Events
```bash
npm run seed
```

### 3. Start Development Server
```bash
npm run dev
```
The server will start on [http://localhost:5000](http://localhost:5000).

### 4. Build for Production
```bash
npm run build
npm start
```

---

## License
MIT License. Developed for CareSphere Community Social Welfare Platform.

