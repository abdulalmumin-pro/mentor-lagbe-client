# MentorLagbe

**A role-based tuition marketplace for Bangladesh** — connecting students with qualified tutors, moderated by admins.

## 📌 Purpose

MentorLagbe (মেন্টর লাগবে) makes finding tuition easy and trustworthy. Students discover and apply to admin-approved tuition posts, tutors advertise their services, and admins keep the platform safe — all in one place with role-based dashboards.

## 🔗 Live URL https://mentor-lagbe-client-gray.vercel.app

```text

```

## 🛡️ Admin Credentials

| Field  | Value |
| ------ | ----- |
| Email  | |
| Password | |

> Tip: an admin account can also be created directly from the **Sign Up** page by choosing the **Admin** role.

## ✨ Key Features

- **Role-based authentication** — sign up as **Student**, **Tutor**, or **Admin** (email/password or Google OAuth) via Better Auth; the chosen role travels through the Google OAuth flow too.
- **Student dashboard**
  - Overview stats (applications, accepted/pending, current plan)
  - My Applications with status badges (Pending / Accepted / Rejected) and cancel-while-pending
  - Saved Tuitions
- **Tutor dashboard**
  - Post a tuition (title, subject, class, mode, location, fee, days/week, description, ImgBB banner) — saved as `pending` admin approval
  - Free plan = up to 2 posts, Pro plan = unlimited
  - Full CRUD on own tuitions + Active/Closed toggle
  - Manage applicants (Accept / Reject)
- **Admin dashboard**
  - Platform stats (users, tutors, pending vs approved tuitions, revenue)
  - User & role management
  - Tuition approval flow (Approve / Reject)
  - Transaction records (Stripe payments)
- **Profile** — update name, phone, bio and avatar (ImgBB upload)
- **Stripe Pro plans** — checkout, success/cancel pages, webhook → saves payment + upgrades `plan` to `pro`
- **UI/UX** — shadcn/ui + Tailwind CSS, dark mode (`d` key), toast notifications, responsive role-based sidebar, animated landing page

## 📦 npm Packages

### Runtime

| Package | Purpose |
| ------- | ------- |
| `next` (16.4.5) | App Router framework, SSR/routing |
| `react` / `react-dom` (19.3.1) | UI library |
| `better-auth` | Authentication (email/password, Google OAuth, sessions, role fields, DB hooks) |
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
npm run dev        # start http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`, `npm run format`, `npm run typecheck`.

### Environment (`.env`)

```bash
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_DB_URI=mongodb://...        # MongoDB connection string
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## 🗂️ Structure

```
app/                 # App Router pages (auth, dashboard, api/auth/[...all])
components/          # UI (auth form, navbar, hero, footer) + shadcn/ui primitives
lib/                 # Better Auth server/client setup, utils
hooks/               # Custom hooks
public/              # Static assets
```
