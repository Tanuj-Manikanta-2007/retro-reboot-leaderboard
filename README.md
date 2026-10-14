# Retro Reboot 2.0 by COGAAN — Tournament Scoring & Leaderboard Web App
[![Architecture diagram](https://gitdiagram.com/diagram-badge.svg)](https://gitdiagram.com/tanuj-manikanta-2007/retro-reboot-leaderboard?utm_source=readme&utm_medium=badge)

Official tournament scoring, live leaderboards, volunteer mobile scoring station, and administrative audit system for **Retro Reboot 2.0**, organized by **COGAAN** (*Coding • Gaming • Animation*).

- **Event Date**: 12th Oct
- **Room**: Manjeera
- **Time**: 9am - 4pm

---

## 🌟 Key Features

### 1. Dual Volunteer Scoring Options (Mobile-First 320px–430px)
- **Option 1: Enter Points Directly (Manual Mode)**:
  - Input awarded points directly between `1` and `100`.
  - Raw score is optional.
  - Recorded as `scoring_method = 'manual'`.
  - Always available, even if rules are configured for that game.
- **Option 2: Enter Raw Score (Automatic Mode)**:
  - Input raw score; evaluated against active server ranges.
  - Live server preview of points.
  - If no rules are configured: prompts *"No score-to-points logic configured for this game. Please use Enter Points Directly."* with 1-click switch preserving selected player and game.
  - Recorded as `scoring_method = 'automatic'`.
- **Double-Tap & Retry Safeguards**:
  - Immediate submit button lock.
  - Client-generated UUIDv4 idempotency key.

### 2. Admin Support & Score Correction Workflow
- Every accepted score displays an **"Admin Support / Correct Score"** button.
- Opens prefilled popup with original player, game, score, points, and method.
- Volunteer can change player, game, score, points, and method with a mandatory reason.
- Submits request as `pending` without overwriting the original entry.
- Admin reviews at `/admin/correction-requests` with side-by-side comparison.
- Atomic approval updates score, logs to immutable `score_correction_history`, recalculates leaderboard, and creates audit trail.

### 3. Consolidated Admin Volunteer Activity Center (`/admin/volunteer-activity`)
- Prominent button on main Admin Dashboard.
- 11-column consolidated table:
  1. Volunteer ID / Name
  2. Player university roll number
  3. Player name
  4. Game
  5. Action performed
  6. Raw score or old score → new score
  7. Points or old points → new points
  8. Exact timestamp
  9. Status
  10. Correction-request details
  11. View Details action (opens audit drawer)

### 4. Excel Exports (5 Sanitized Reports)
- **Player-Wise Game Points Matrix Report** (`Retro_Reboot_Player_Points_YYYY-MM-DD.xlsx`):
  - Every registered player in rows.
  - Dynamic columns for every admin-created game with official best points.
  - `Total Points` column summing best points across all games.
  - Roll numbers and phone numbers explicitly styled as text to preserve leading zeros.
  - Frozen header row and auto-filter enabled.
  - Sanitized against formula injection (`=`, `+`, `-`, `@`).
- **Official Leaderboard Standings**
- **Registered Players Roster**
- **Complete Score History Audit**
- **Volunteer Activity & Correction Audit**

### 5. Access Control & Event PIN Gate
- **6-digit Admin PIN**, configured through `EVENT_ADMIN_PIN_HASH`
- **4-digit Volunteer PIN**, configured through `EVENT_VOLUNTEER_PIN_HASH`
- PIN verification validates against SHA-256 hashes and pairs with individual volunteer identity attribution (`VOL-01`, `Volunteer Alex`).

---

## 🛠️ Tech Stack
- **Frontend & Backend**: Next.js 14 App Router, TypeScript, React 18
- **Styling**: Tailwind CSS with Retro Arcade palette (`#0B0D14` canvas, `#F5B800` COGAAN Gold, CRT scanlines)
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS)
- **Spreadsheets**: ExcelJS (server-side generation with formula injection protection)
- **Validation**: Zod (client & server)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ or 20+ LTS

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Automated Tests
```bash
npm run test
```
Runs 22 unit and business logic tests verifying roll-number normalization, formula sanitization, range collision detection, dual scoring modes, best-score hierarchy, and replay summation protection.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application:
- `/` — Tournament Landing Page
- `/leaderboard` — Public Standings
- `/volunteer` — Volunteer Scoring Station
- `/admin` — Admin Control Dashboard
- `/admin/volunteer-activity` — Consolidated Volunteer Audit Center
- `/admin/correction-requests` — Score Correction Queue
- `/admin/players` — Player Registrations
- `/admin/games` — Games & Scoring Rules
- `/admin/exports` — Excel Export Center

### 5. Production Build
```bash
npm run build
npm run start
```

---

## 🗄️ Supabase Production Database Setup

1. Create a new Supabase project at [https://supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Run the schema migration from:
   `supabase/migrations/20261010000000_init_retro_reboot.sql`
4. (Optional) Run seed data from:
   `supabase/seed.sql`
5. Copy your project credentials into `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  EVENT_ADMIN_PIN_HASH=your-admin-pin-sha256-hash
  EVENT_VOLUNTEER_PIN_HASH=your-volunteer-pin-sha256-hash
   ```

---



