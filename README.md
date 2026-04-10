# 🏋️ FitHub CRM – Complete Prototype

**Full-stack Fitness Center Management System**
Built with: HTML/CSS/JS Frontend · Node.js + Express Backend · Supabase (PostgreSQL) Database

---

## 📁 Folder Structure

```
fithub-complete/
├── frontend/
│   └── index.html              ← Open this in browser (after backend is running)
│
└── backend/
    ├── server.js               ← Express entry point  →  node server.js
    ├── package.json
    ├── .env.example            ← Copy to .env and fill credentials
    │
    ├── config/
    │   └── supabase.js         ← Supabase client setup
    │
    ├── middleware/
    │   └── errorHandler.js     ← Central error handling
    │
    ├── routes/
    │   ├── members.js          ← GET/POST/PUT/DELETE /api/members
    │   ├── trainers.js         ← GET/POST/PUT/DELETE /api/trainers
    │   ├── classes.js          ← GET/POST/PUT/DELETE /api/classes
    │   ├── bookings.js         ← GET/POST/DELETE     /api/bookings
    │   └── reports.js          ← GET                 /api/reports/summary
    │
    ├── controllers/
    │   ├── membersController.js
    │   ├── trainersController.js
    │   ├── classesController.js
    │   ├── bookingsController.js   ← Core business logic
    │   └── reportsController.js
    │
    └── sql/
        └── schema.sql          ← Run this in Supabase SQL Editor FIRST
```

---

## 🚀 Setup Guide (Step by Step)

### STEP 1 — Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up / log in
2. Click **"New Project"** → give it a name like `fithub-crm`
3. Choose a region and set a database password
4. Wait ~2 minutes for provisioning

### STEP 2 — Run the Database Schema

1. In your Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open `backend/sql/schema.sql` from this project
4. Paste the entire contents into the SQL Editor
5. Click **"Run"** (green button)
6. You should see: *"Success. No rows returned"*

This creates:
- `members`, `trainers`, `classes`, `bookings` tables
- Auto-assign trainer trigger (fires on booking insert)
- Auto-calculate amount trigger (fires on booking insert)
- Revenue, membership, class popularity views
- Row Level Security policies

### STEP 3 — Get Your Supabase API Keys

1. In Supabase dashboard → **Settings** → **API**
2. Copy **Project URL** (looks like `https://abcdef.supabase.co`)
3. Copy **anon public** key (long JWT string)

### STEP 4 — Configure the Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` and fill in:
```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
PORT=3000
FRONTEND_URL=http://localhost:5500
```

### STEP 5 — Install & Run the Backend

```bash
cd backend
npm install
npm start
```

You should see:
```
🏋️  FitHub CRM Backend running on http://localhost:3000
📡  Supabase: ✅ Connected
```

Test it: open [http://localhost:3000/api/health](http://localhost:3000/api/health)
You should get: `{"success":true,"message":"🏋️ FitHub CRM API is running"}`

### STEP 6 — Open the Frontend

Open `frontend/index.html` in your browser.

**Recommended:** Use a local server for best results:
```bash
# Option A: VS Code Live Server extension (right-click index.html → Open with Live Server)

# Option B: Python
cd frontend && python3 -m http.server 5500

# Option C: npx
npx serve frontend -p 5500
```

Then visit: [http://localhost:5500](http://localhost:5500)

The topbar will show **🟢 API Online** when connected.

---

## ⚡ How the Auto-Assignment Works

When you create a **Booking**:

1. You select: Member + Class + Payment Status
2. On save, the backend sends `POST /api/bookings` to Express
3. Express inserts into Supabase `bookings` table
4. **DB Trigger 1** (`trg_auto_assign_trainer`) fires → finds first available trainer → sets `trainer_id`
5. **DB Trigger 2** (`trg_auto_calculate_amount`) fires → checks member type → sets `amount` (Premium=₹500, Basic=₹300)
6. The response returns with trainer name and amount already filled

---

## 🔌 API Endpoints

| Method | Endpoint                 | Description                      |
|--------|--------------------------|----------------------------------|
| GET    | /api/health              | Health check                     |
| GET    | /api/members             | List all members                 |
| POST   | /api/members             | Create member                    |
| PUT    | /api/members/:id         | Update member                    |
| DELETE | /api/members/:id         | Delete member                    |
| GET    | /api/trainers            | List all trainers                |
| POST   | /api/trainers            | Create trainer                   |
| PUT    | /api/trainers/:id        | Update trainer                   |
| DELETE | /api/trainers/:id        | Delete trainer                   |
| GET    | /api/classes             | List all classes + booking count |
| POST   | /api/classes             | Create class                     |
| DELETE | /api/classes/:id         | Delete class                     |
| GET    | /api/bookings            | List all bookings (with joins)   |
| POST   | /api/bookings            | Create booking (triggers fire)   |
| DELETE | /api/bookings/:id        | Delete booking                   |
| GET    | /api/reports/summary     | Full analytics report            |

---

## 🗃️ Database Schema Overview

```
members        trainers       classes        bookings
──────────     ──────────     ──────────     ──────────────────────
id (UUID)      id (UUID)      id (UUID)      id (UUID)
name           name           name           booking_number (auto)
email          specialization capacity       member_id → members
phone          phone          schedule       class_id  → classes
membership_    is_available   created_at     trainer_id → trainers ← AUTO
  type                                       payment_status
expiry_date                                  amount ← AUTO CALCULATED
status (gen)                                 booked_at
created_at
```

---

## 🛠 Development

```bash
# Run with hot reload
cd backend && npm run dev

# Check Supabase logs
# Supabase Dashboard → Logs → API/Database
```

---

## 📌 Tech Stack

| Layer     | Technology              |
|-----------|-------------------------|
| Frontend  | HTML5, CSS3, Vanilla JS |
| Backend   | Node.js, Express 4      |
| Database  | Supabase (PostgreSQL)   |
| ORM       | @supabase/supabase-js   |
| Auth      | Supabase RLS (anon key) |

---

*Naan Mudhalvan Program*
