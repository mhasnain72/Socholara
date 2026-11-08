# SCHOLARA — Scholarships & Internships Portal

A full-stack, responsive academic and career portal built in **React.js**, **Node.js / Express**, and **MongoDB** (with Mongoose ODM).

---

## 🎨 Aesthetic & Design System

The application strictly adheres to the requested theme:
- **Primary Navy Blue**: `#0F2744` / `#16365D` (dignified Oxford collegiate tone)
- **Soft Warm Cream**: `#FAF7F2` / `#F4EFE6` (classic parchment surface for high readability)
- **Matching Accent (Sandalwood / Amber Gold)**: `#C26D38` / `#D97706` (matches prestigious seals, ribbons, and honors)
- **Strictly No Glowing Text**: No neon effects, no text shadows, no cyberpunk glow. Clean, modern typography using Google Fonts *Plus Jakarta Sans* and *Inter*.

---

## 🚀 Key Features

### 1. User Side
- **Hero & Discovery Section**: Instant search, popular tags, and live opportunity counters.
- **Card-Based Opportunity Feed**:
  - High-resolution cover photos with category and type badges (`Scholarship` in Navy Blue, `Internship` in Sandalwood Amber).
  - Award Amount / Monthly Stipend highlights (e.g. *Fully Funded* or *$9,200 / Month*).
  - Provider organization with building icons and location/work mode (Remote, Hybrid, On-site).
  - Dynamic deadline countdown badge (*"12 days left"* or *"Active"*).
  - Quick Bookmark / Save toggle button.
  - "View Details" button.
- **Complete Opportunity Details (Modal / Drawer)**:
  - Hero image banner with organization details.
  - Quick highlights: Award, Deadline date, Location & Work mode, Degree level.
  - Comprehensive tabs:
    1. *Overview & Full Description*
    2. *Eligibility Criteria* (checklist with verified checkmarks)
    3. *Financial Coverage & Perks* (tuition waivers, living stipends, travel, healthcare)
    4. *Required Documents Checklist* (transcripts, CV, SOP, letters of recommendation)
  - Action buttons: Direct **"Apply on Portal"**, **"Visit Official Website"**, **"Bookmark"**, and **"Share"** (copies clean link/summary).
- **Direct Application Submission Form**:
  - Modal form for students: Full Name, Email, Phone, Current University, Major, Degree Level, GPA, Portfolio/Resume link, and Statement of Purpose.
  - Submits directly to MongoDB (`POST /api/applications`).
  - Displays instant application confirmation and tracking ID.
- **Interactive Multi-Filter Bar**:
  - Filter by Type (All / Scholarships / Internships).
  - Filter by Category (Tech, Engineering, Business, Medicine, Law, Sciences, etc.).
  - Filter by Work Mode (Remote, Hybrid, On-site).
  - Filter by Degree Level (Undergraduate, Master, PhD).
  - Sort by: Newest Added, Approaching Deadline, Most Viewed, Alphabetical.
- **"Saved Opportunities" Page**: Dedicated page to manage bookmarked scholarships and internships.
- **"My Applications" Page**: Dedicated tracker for all user-submitted applications and their real-time review status.

---

### 2. Admin Side
- **Admin Access**:
  - Open the isolated `/admin` page directly; no admin controls are shown on the public website.
  - Sign in with the configured admin email and password, then enter the one-time email verification code.
- **KPI Metrics Dashboard**:
  - Total Opportunities, Total Scholarships, Total Internships, and Student Applications received.
  - Active Database status indicator.
- **"Manage Listings" Tab**:
  - Searchable data table of all opportunities.
  - Photo thumbnail, Title, Provider, Type, Category, Deadline, and Applicants counter.
  - Quick actions: **Edit**, **Delete** (with confirmation), and **Preview**.
- **"Post New Opportunity" Tab**:
  - Publish verified scholarships and internships.
  - Photo selector: 8 curated academic/tech Unsplash presets, custom image URL, or direct file upload.
  - Dynamic list builders: Add and remove Eligibility requirements, Benefits, and Required documents.
  - Sets deadline date, stipend, degree level, application URL, tags, and featured status.
  - Saves directly to MongoDB.
- **"Edit Opportunity" Tab**:
  - Pre-populates all form fields with existing MongoDB data for instant live updates.
- **"Review Applications" Tab**:
  - View applications submitted by students.
  - Inspect student university, GPA, resume/portfolio URL, and Statement of Purpose.
  - Update review status (*Pending Review*, *Under Review*, *Shortlisted*, *Accepted*, *Rejected*) which persists to database.

---

## 🗄️ Database & Resilient Engine

- **MongoDB / Mongoose ODM**:
  - Configured in `server/config/db.js` using `process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/scholarship_portal"`.
  - Rich schemas for `Opportunity` and `Application`.
- **Automatic Fallback Store**:
  - If a local MongoDB daemon is not running on the machine, the system automatically engages the built-in local JSON data engine (`server/data/opportunities.json` & `server/data/applications.json`).
  - **Result**: The website is **100% functional immediately** with zero crashes, full CRUD, application submissions, and filtering, regardless of whether MongoDB service is installed or active.
  - Connecting to MongoDB Atlas or local MongoDB requires only setting `MONGODB_URI` in `$HOME/.scholara/server.env`.

---

## 💻 How to Run

### Requirements
- Node.js (v18+)
- npm (v9+)

### 1. Start Backend Server
```bash
cd server
npm install
node server.js
```
The server runs on **`http://localhost:5000`**.

### 2. Start Frontend Client (Vite Dev Server)
```bash
cd client
npm install
npm run dev
```
The client runs on **`http://localhost:3000`** and proxies API calls to port 5000.

### 3. Or Serve Single Unified Port
```bash
npm start
```
Because `client/dist` is pre-built, accessing **`http://localhost:5000`** directly serves both the frontend React app and backend API!

### Admin Portal

The public website has no admin controls or admin login UI. Open the isolated admin page directly at:

```text
http://localhost:5000/admin
```

Admin login requires the configured email and password, followed by a one-time verification code sent by SMTP email. Keep these values only in `$HOME/.scholara/server.env`:

```env
ADMIN_EMAIL=your-admin-email@example.com
ADMIN_PASSWORD=your-private-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-admin-email@example.com
SMTP_PASSWORD=your-gmail-app-password
SMTP_FROM=your-admin-email@example.com
```

For Gmail, use a Google App Password for `SMTP_PASSWORD`; a normal Gmail account password is not accepted by Gmail SMTP. Admin sessions are HttpOnly, SameSite cookies and all admin writes/uploads/banner changes require the server-side session.

---

### Google Verification for the Eligibility Matcher

Google sign-in verifies the entered email before showing matcher results. Create a Google OAuth 2.0 Web client and add the Vite origin (for example, `http://localhost:3000`) under **Authorized JavaScript origins**. Set the same client ID in both `client/.env` and `server/.env`:

```env
# client/.env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# $HOME/.scholara/server.env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Copy from the respective `.env.example` files, then restart both servers. Keep server secrets outside the project in `$HOME/.scholara/server.env`; only the public client ID belongs in `client/.env`. The server verifies Google ID tokens but does not receive or store the matcher profile. Profile details, match results, and verified identity remain in browser memory until the page is refreshed or closed. The CV is generated locally in the browser. The legacy `server/data/matcherProfiles.json` file, if present, is not read or modified by the matcher.

## 🔑 Admin Security
- Admin credentials and SMTP settings are loaded only from `$HOME/.scholara/server.env`.
- Never commit the external secrets file or use a normal Gmail password as the SMTP password.
- Successful verification creates an eight-hour HttpOnly session. The matcher-contact list and all admin mutations require this server session.
