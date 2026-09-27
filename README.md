# TrafficTrack — Team Traffic Tracking & Attribution Platform

A simple, fast, secure, and multi-tenant web application designed to track marketing team members' generated traffic with strict attribution across **Campaigns**, **Facebook Pages**, **Tracking Links**, and **Traffic Events**.

Built with strict data separation between **Raw Hits**, **Valid Visits**, **Unique Visitors**, and **Credited Traffic**.

---

## 1. Quick Start

### Prerequisites
- Node.js v18+ (tested on Node v22)
- npm v9+

### Installation & Setup
```bash
# 1. Install dependencies
npm install

# 2. Synchronize database (SQLite / MySQL)
npx prisma db push

# 3. Seed default accounts and analytics
npm run db:seed

# 4. Start development server
npm run dev
```

Visit: `http://localhost:3000`

---

## 2. Default Login Credentials

| Role | Email | Password | Dashboard Route |
|---|---|---|---|
| **Super Admin** | `admin@traffictrack.com` | `Admin@123456` | `/admin` |
| **Team Member** | `ali@traffictrack.com` | `Employee@123456` | `/dashboard` |
| **Team Member** | `ahmed@traffictrack.com` | `Employee@123456` | `/dashboard` |

---

## 3. Core Architecture & Principles

### Four-Tier Traffic Separation
$$\text{Raw Hits} \neq \text{Valid Traffic} \neq \text{Estimated Unique Visitors} \neq \text{Credited Traffic}$$

1. **Raw Hits**: All incoming HTTP GET requests received at `/:shortCode`.
2. **Valid Visits**: Traffic filtered against known crawlers/bots and deduplicated within the window (e.g. 30 minutes).
3. **Unique Visitors**: Distinct visitors determined by SHA-256 hash of IP + User-Agent.
4. **Credited Clicks**: Computed display metrics shown to employees:
   $$\text{Credited Clicks} = \lfloor \text{Valid Traffic} \times \frac{\text{Effective Credit Rate}}{100} \rfloor + \text{Manual Adjustments}$$
   - **Effective Rate**: Uses the Employee's custom override (if configured) or the Global Credit Rate.
   - Raw records in `traffic_events` are **immutable** and never altered or deleted.

---

## 4. Key Modules & Features

### Authentication
- **Two-Step Login (`/`)**:
  - Step 1: User enters email address. System checks if account exists and status is `ACTIVE`.
  - Step 2: User enters password. Automatic role-based redirect to `/admin` or `/dashboard`.
  - Passwords hashed using bcrypt. HTTP-only secure JWT cookies.

### Employee Features
- **Dashboard (`/dashboard`)**:
  - Prominent Credited Clicks KPI cards (Total, Today, Yesterday, This Month, Total Links).
  - Monthly Goal Progress Bar (e.g. `7,250 / 10,000`).
  - Real-time Live Traffic counter (Last 5m & 30m visits).
  - Credited trend chart (Last 7 days).
  - Recent links table with one-click copy and QR code download.
- **Link Generator (`/links/create`)**:
  - Destination URL input with company domain allowlist validation.
  - Optional custom alias (e.g. `software-jobs`).
  - Assigned Campaign and Facebook Page selector.
  - Collapsible Social Preview editor with **Live Open Graph Preview Card**.
  - Success banner with instant `[Copy Link]` toast and `[QR Code]` viewer.
- **My Links (`/links`)**: Searchable list with tag filter, pin/favorite toggle, and pause/resume.
- **Dedicated Link Analytics (`/links/[id]/analytics`)**: 5-tab performance breakdown.
- **Personal Analytics (`/analytics`)**: Personal multi-dimensional reporting across all links.

### Admin Features
- **Overview (`/admin`)**:
  - Executive KPIs: Total Raw Hits, Valid Traffic, Credited Traffic, Active Employees, Active Links.
  - Employee Performance Table: Links, Target Progress, Valid Traffic, Credited Traffic, Effective Rate.
- **Employee Management (`/admin/employees` & `[id]`)**:
  - Add new employees, suspend/activate accounts.
  - Configure custom credit percentage overrides.
  - **Manual Traffic Adjustments**: Credit/deduct visits with mandatory audit reasoning.
  - Admin password reset tool.
- **Global Links Directory (`/admin/links`)**:
  - View all links across all team members, filter by employee, reassign link ownership with audit trail.
- **Facebook Pages (`/admin/pages`) & Campaigns (`/admin/campaigns`)**:
  - Create and assign Facebook Pages and marketing campaigns to employees.
- **Platform Analytics (`/admin/analytics`)**:
  - Full 5-tab multi-dimensional analysis with employee and link scoping.
- **Traffic Explorer (`/admin/traffic`)**:
  - Real-time live incoming event stream with **Pause/Resume** toggle.
  - Forensic Event Inspector modal with full IP, User Agent, Referrer, and Geo breakdown.
- **System Settings (`/admin/settings`)**:
  - Global credit %, duplicate window (mins), bot filtering toggle, internal test IP exclusion, allowed destination domains allowlist.
  - Live formula helper preview.
- **Audit Logs (`/admin/audit`)**:
  - Immutable audit trail of administrative modifications.

---

## 5. Technology Stack

- **Framework**: Next.js 14 (App Router) + React 18 + TypeScript
- **Styling**: Tailwind CSS with enterprise SaaS color palette (`#2563EB`, `#F8FAFC`, `#0F172A`, `#64748B`, `#E2E8F0`, `#16A34A`, `#DC2626`)
- **Database**: Prisma ORM with SQLite (`dev.db`, 100% MySQL compatible)
- **GeoIP**: `geoip-lite` (instant local offline resolution for Country, Region, City, Timezone)
- **Device & Crawler Detection**: `ua-parser-js` with dedicated parsing for Facebook In-App Browser (`FBAV`/`FBAN`) and Open Graph social crawler interception
- **QR Codes**: `qrcode`
- **Charts**: `recharts`
- **Icons**: `lucide-react`
