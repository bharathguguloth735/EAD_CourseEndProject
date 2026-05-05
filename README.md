# Lab Equipment Booking System

A full-stack web application for students and staff to book lab equipment efficiently.

## Technologies Used
- **Frontend**: React (Vite), React Router, Axios, pure CSS (Custom Dark Theme).
- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT, bcryptjs, json2csv.

## Features
- **Authentication**: JWT-based role authentication (Admin/User).
- **Equipment Management**: Admins can add, update, and delete lab equipment.
- **Booking System**: Users can book equipment slots. Conflict detection ensures no double-booking!
- **Dashboard**: Track total users, active bookings, and equipment stats (Admin).
- **Records & Reports**: Admins can easily export booking records in CSV or JSON format.

## Setup Instructions

1. **Start the Backend**
   Open a terminal, navigate to the `backend` folder, and run:
   ```bash
   cd backend
   npm install
   node index.js
   ```
   The backend will run on `http://localhost:5000`.

2. **Start the Frontend**
   Open a separate terminal, navigate to the `frontend` folder, and run:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The frontend will run on the local port provided by Vite (usually `http://localhost:5173`).

## Sample Data (Testing Credentials)
The database has already been seeded with test data! You can log in using the following accounts:

**Admin Account**
- **Email:** `admin@lab.com`
- **Password:** `admin123`

**Staff Account**
- **Email:** `staff@lab.com`
- **Password:** `admin123`

**Student Account**
- **Email:** `student@lab.com`
- **Password:** `admin123`
