# MentorLagbe Express API

Standalone Express server used by the Next.js client for tuition/application
endpoints and Stripe subscriptions. It shares the same MongoDB database
(`mentor-lagbe-db`) as the client.

## Setup

```bash
cd server
npm install
cp .env.example .env   # fill in the values
npm run dev            # http://localhost:5000
```

Point the client at it with `NEXT_PUBLIC_API_URL` (e.g.
`http://localhost:5000`).

## Auth

The client fetches a short-lived Better Auth JWT from `/api/auth/token` and
sends it as `Authorization: Bearer <token>`. This server verifies the token
against Better Auth's JWKS endpoint (`BETTER_AUTH_URL/api/auth/jwks`) and then
loads the user document to read `role` and `plan`.

## Endpoints

| Method | Path | Access | Description |
| ------ | ---- | ------ | ----------- |
| `GET` | `/tuitions` | Public | Approved marketplace; supports `q`, `classLevel`, `mode`, `page`, `limit`, and `?mine=1` |
| `GET` | `/tuitions/:id` | Public | Tuition details |
| `POST` | `/tuitions` | Tutor | Create a post (starts `pending`, free plan max 2) |
| `PATCH` | `/tuitions/:id` | Owner/Admin | Toggle `active`/`closed` or edit (resets to `pending`) |
| `DELETE` | `/tuitions/:id` | Owner/Admin | Delete the post and its applications |
| `GET` | `/applications` | Signed in | Role-aware application list |
| `GET` | `/applications/check` | Signed in | `{ applied }` for a tuition |
| `POST` | `/applications` | Student | Apply to an approved, open tuition |
| `PATCH` | `/applications/:id` | Tutor | Accept / reject |
| `DELETE` | `/applications/:id` | Student | Cancel while pending |
| `POST` | `/stripe/checkout` | Signed in | Create a subscription Checkout session → `{ url }` |
| `GET` | `/stripe/verify` | Signed in | Verify a session, record payment, upgrade plan |
| `POST` | `/stripe/webhook` | Stripe | Signature-verified webhook |

## Stripe webhook

```bash
stripe listen --forward-to localhost:5000/stripe/webhook
```

Copy the printed `whsec_…` into `STRIPE_WEBHOOK_SECRET`.
