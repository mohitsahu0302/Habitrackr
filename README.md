# HabiTrackr

Social habit tracker with accountability partners, streaks, points, and a leaderboard. MERN stack (MongoDB, Express, React, Node) with email notifications via EmailJS.

## Features

- **Auth**: JWT-based signup/login (passwords hashed with bcrypt)
- **Habits**: create/check-in/archive habits, each with a daily streak counter
- **Streak logic**: check in once per day; consecutive days increase the streak, a missed day resets it to zero (see `server/utils/streakLogic.js`)
- **Points & milestones**: +10 points per check-in, +20 bonus per streak milestone (3/7/14/30/60/100/365 days)
- **Accountability partners**: search users, send/accept/reject partner requests, view partners' live streaks
- **Leaderboard**: global (top 20 by points) and friends-only (you + your partners)
- **Email notifications** (EmailJS REST API, server-side): welcome email, partner request received, streak milestone alerts sent to partners, and a daily 8 PM cron reminder for anyone who hasn't checked in

## Project structure

```
HabiTrackr/
  server/   Express + MongoDB API
  client/   React frontend (Create React App)
```

## 1. Backend setup

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env`:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/habitrackr   # or a MongoDB Atlas URI
JWT_SECRET=some_long_random_string
CLIENT_URL=http://localhost:3000

EMAILJS_SERVICE_ID=service_xxxxxxx
EMAILJS_TEMPLATE_ID=template_xxxxxxx
EMAILJS_PUBLIC_KEY=your_public_key
EMAILJS_PRIVATE_KEY=your_private_key
```

### Setting up EmailJS (free tier)

1. Create a free account at https://www.emailjs.com
2. Add an email service (Gmail, Outlook, etc.) — note the **Service ID**
3. Create an email template with these variables used in the subject/body: `{{to_email}}`, `{{to_name}}`, `{{subject}}`, `{{message}}` — note the **Template ID**
4. Go to **Account > General** for your **Public Key**
5. Go to **Account > Security** and enable the **Private Key** (this lets the server send emails without a browser — required since our reminders/notifications fire from Node, not from a logged-in browser tab)
6. Put all four values in `server/.env`

If these env vars are left blank, the app still works — email sends are skipped with a console warning instead of crashing.

Run the server:

```bash
npm run dev     # with nodemon, or:
npm start
```

The API runs at `http://localhost:5000/api` (health check: `GET /api/health`).

## 2. Frontend setup

```bash
cd client
npm install
cp .env.example .env
npm start
```

The app runs at `http://localhost:3000` and talks to the API via `REACT_APP_API_URL` (defaults to `http://localhost:5000/api`).

## API overview

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Current user (auth required) |
| GET | `/api/habits` | List my habits |
| POST | `/api/habits` | Create a habit |
| DELETE | `/api/habits/:id` | Archive a habit |
| POST | `/api/habits/:id/checkin` | Check in today, update streak/points |
| GET | `/api/partners/search?q=` | Search users to add |
| POST | `/api/partners/request` | Send a partner request |
| GET | `/api/partners/requests/incoming` | Pending incoming requests |
| POST | `/api/partners/requests/:id/respond` | Accept/reject a request |
| GET | `/api/partners` | List my partners + their habits |
| DELETE | `/api/partners/:partnerId` | Remove a partner |
| GET | `/api/leaderboard/global` | Top 20 by points |
| GET | `/api/leaderboard/friends` | You + your partners, by points |

All routes except `/api/auth/register`, `/api/auth/login`, and `/api/health` require an `Authorization: Bearer <token>` header.

## Notes on the streak logic

Dates are compared as UTC `YYYY-MM-DD` strings to avoid timezone drift:
- First check-in → streak = 1
- Check-in exactly 1 day after the last one → streak + 1
- Check-in more than 1 day after the last one → streak resets to 1
- A second check-in on the same day is rejected (400 response) rather than double-counted
- `reconcileStreak` lazily zeroes out a streak when a habit is *read* (or via the daily cron) if more than a day has passed without a check-in, so the UI never shows a stale non-zero streak after a missed day

This was unit-tested directly (see the streak logic module) for: same-day duplicate check-ins, consecutive-day increments, missed-day resets, and lazy reconciliation.
