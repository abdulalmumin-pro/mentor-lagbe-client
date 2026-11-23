# MentorLagbe

**A role-based tuition marketplace for Bangladesh** — connecting students with qualified tutors, moderated by admins.

## 📌 Purpose

MentorLagbe (মেন্টর লাগবে) makes finding tuition easy and trustworthy. Students discover and apply to admin-approved tuition posts, tutors advertise their services, and admins keep the platform safe — all in one place with role-based dashboards.

## 🔗 Live URLs

| Service | URL |
| ------- | --- |
| Web app (Next.js) | https://mentor-lagbe-client-gray.vercel.app |
| API (Express + Stripe) | https://mentor-lagbe-server-pied.vercel.app |

## 🛡️ Admin Credentials

| Field | Value |
| ----- | ----- |
| Email | `admin@mentorlagbe.com` |
| Password | `Admin@12345` |

> Created by `npm run seed`. The seed script also adds a demo tutor
> (`tutor@mentorlagbe.com` / `Tutor@12345`), a demo student
> (`student@mentorlagbe.com` / `Student@12345`), three approved tuitions, and one
> payment record. Change these passwords before deploying publicly.

## ✨ Key Features

- **Role-based authentication** — sign up as **Student** or **Tutor** (email/password or Google OAuth) via Better Auth. Admins are created by the seed script / directly in MongoDB; self sign-up can never grant the admin role.
- **Student experience**
  - Public browse page with **server-side search** (title / subject / location / tutor) plus **class-level and mode filters** and **pagination**.
  - Tuition details page with a student-only apply dialog (preferred schedule + note).
  - My Applications with status badges (Pending / Accepted / Rejected) and **cancel while pending**.
  - **Saved Tuitions** — bookmark up to 5 tuitions on the free plan (unlimited on Pro).
- **Tutor experience**
  - Post a tuition (title, subject, class, mode, location, fee, days/week, description, ImgBB banner). New posts start as `pending` and wait for admin approval.
  - Free plan = up to **2 posts**, Pro plan = unlimited.
  - Full CRUD on own tuitions + **Active / Closed** toggle.
  - Applicants page — accept or reject applications.
  - Browse the public marketplace of approved tuitions.
- **Admin experience**
  - Platform stats (users, tutors, students, pending/approved tuitions, revenue).
  - User & role management.
  - Tuition approval flow (Approve / Reject).
  - Transaction records read from the `payments` collection.
- **Profile** — update name, phone, bio, and avatar (ImgBB upload or URL).
- **Stripe Pro plans** — checkout, success/cancel pages, webhook → saves a payment row and upgrades the user's `plan` to `pro`.
- **UI/UX** — shadcn/ui + Tailwind CSS, light/dark theme toggle, toast notifications, responsive role-based sidebar, animated landing page, custom 404 and error boundary.

## 🧭 Routes

| Route | Access | Description |
| ----- | ------ | ----------- |
| `/` | Public | Landing page with live stats and featured approved tuitions |
| `/tuitions` | Public | Browse, search, filter, paginate approved tuitions |
| `/tuitions/[id]` | Public | Tuition details; students can apply and bookmark |
| `/pricing` | Public | Free vs Pro plans |
| `/sign-in`, `/sign-up` | Public | Auth pages (redirect to the role dashboard after success) |
| `/payment/success`, `/payment/cancel` | Public | Stripe checkout results |
| `/dashboard/student` | Student | Overview, applications, saved tuitions |
| `/dashboard/tutor` | Tutor | Overview, post tuition, my tuitions, applicants |
| `/dashboard/admin` | Admin | Overview, users, tuitions, transactions |
| `/dashboard/profile` | Any signed-in user | Profile editor |

`/browse-tuitions` is kept as a permanent redirect to `/tuitions` for old links.

## 🗄️ Database Collections

The app stores its data in the `mentor-lagbe-db` MongoDB database:

| Collection | Purpose |
| ---------- | ------- |
| `user` | Better Auth accounts (name, email, role, plan, phone, bio, avatar, `bookmarks`) |
| `tuitions` | Tuition posts (approval status, active/closed, details, banner) |
| `applications` | Student applications to tuitions |
| `payments` | Stripe subscription payment records |

Bookmarks are stored as a `bookmarks: string[]` field on the user document, so no fifth app collection is needed. Better Auth additionally manages its own `session`, `account`, `verification`, and `jwks` collections.

The APIs normalise both field spellings used over time: `status` / `isActive`, `note` / `studentNote`, `createdAt` / `appliedAt`, `paymentDate` / `paidAt`, and `status` / `paymentStatus`.

## 📦 npm Packages

### Runtime

| Package | Purpose |
| ------- | ------- |
| `next` (16.4.5) | App Router framework, SSR/routing |
| `react` / `react-dom` (19.3.1) | UI library |
| `better-auth` | Authentication (email/password, Google OAuth, sessions, role fields, JWT plugin, DB hooks) |
| `@better-auth/mongo-adapter` | Better Auth MongoDB adapter |
| `mongodb` | MongoDB driver (`mentor-lagbe-db`) |
| `next-themes` | Dark/light theme switching |
| `shadcn` | shadcn/ui component CLI & components (built on `@base-ui/react`) |
| `@base-ui/react` | Unstyled primitive components used by shadcn/ui |
| `class-variance-authority` | Variant-based component class styling |
| `cn` | Class name merge helper |
| `sonner` | Toast notifications |
| `framer-motion` | Landing page animations |
| `lucide-react` | Icons |
| `tw-animate-css` | Tailwind animation utilities |

### Development

| Package | Purpose |
| ------- | ------- |
| `typescript` | Type safety |
| `tailwindcss` (4) + `@tailwindcss/postcss` | Utility-first CSS |
| `eslint` + `eslint-config-next` | Linting |
| `prettier` + `prettier-plugin-tailwindcss` | Formatting with class sorting |
| `@types/react`, `@types/react-dom`, `@types/node` | Type definitions |

## 🚀 Local Development

```bash
npm install
cp .env.example .env      # then fill in the values
npm run seed              # optional: demo admin/tutor/student + tuitions
npm run dev               # start http://localhost:3000
```

Scripts: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`, `npm run format`, `npm run typecheck`, `npm run seed`.

### Environment variables

Create `.env` (or `.env.local`) from `.env.example`:

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `BETTER_AUTH_SECRET` | Yes | Random secret used to sign sessions/tokens |
| `BETTER_AUTH_URL` | Yes | Base URL of this app (`http://localhost:3000` in dev) |
| `BETTER_AUTH_DB_URI` | Yes | MongoDB connection string |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | No | Google OAuth credentials |
| `IMGBB_API_KEY` | No | Enables avatar/banner uploads |
| `NEXT_PUBLIC_API_URL` | No | Express backend base URL (default `http://localhost:5000`) |

Secrets belong in `.env` / `.env.local` (both git-ignored). Only `.env.example` is committed.

### Express backend

Stripe checkout/verification and a few tuition/application endpoints live in a
separate Express server. The Next.js app calls it through
`NEXT_PUBLIC_API_URL` and attaches a Better Auth JWT (`/api/auth/token`).
When the Express route is missing or unreachable, the details/apply flow falls
back to the Next.js route handlers, so the site keeps working.

The updated Express server (JWT middleware, `tuitions` CRUD/search/pagination,
applications, and Stripe checkout/verify/webhook) is in [`server/`](./server).

## 🗂️ Structure

```
app/                 # App Router pages (public, auth, dashboards, api/*)
components/          # Shared UI (navbar, hero, tuition browser, shadcn/ui)
lib/                 # Better Auth setup, Mongo helpers, API/JWT helpers
scripts/seed.mjs     # Demo data + admin/tutor/student accounts
server/              # Standalone Express API (Stripe + tuition/applications)
public/              # Static assets
```
