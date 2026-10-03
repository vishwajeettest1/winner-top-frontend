# StreamEarn Frontend

StreamEarn is a React and Vite frontend prototype for a video-rewards platform. It includes registration, OTP verification, daily video watching, wallet tracking, referrals, withdrawals, Help Center, About Us, and a payment-ready Add Money flow.

## Current Status

The main user journeys and UI are implemented in the frontend. Production payment processing, wallet ledger persistence, referral payouts, video catalog management, and server-side reward validation still require the backend.

See [FRONTEND_REQUIREMENTS.md](FRONTEND_REQUIREMENTS.md) for the product requirements, [FRONTEND_IMPLEMENTATIONS.md](FRONTEND_IMPLEMENTATIONS.md) for the current frontend/backend status, and [BACKEND_REQUIREMENTS.md](BACKEND_REQUIREMENTS.md) for the backend API and production contract.

## Setup

Requirements:

- Node.js 18 or newer
- A running StreamEarn API for authenticated and reward/payment actions

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

The Vite development server normally runs at `http://localhost:3000`.

## Configuration

The API base URL defaults to:

```text
http://localhost:5000/api
```

Set a different API URL with a Vite environment variable:

```text
VITE_API_BASE_URL=https://your-api.example.com/api
```

Do not put payment secrets, gateway keys, bank credentials, UPI PINs, or private tokens in frontend environment variables.

## Main Routes

| Route | Purpose |
|---|---|
| `/login` | Shared sign-in; administrator accounts open the admin workspace |
| `/register` | Account creation with mobile, email, password, and referral code |
| `/verify-otp` | OTP verification after registration |
| `/` | Dashboard and starter-plan entry point |
| `/watch` | Daily videos and full-watch reward flow |
| `/wallet` | Balance, Add Money, starter status, and transactions |
| `/referrals` | Referral link, sharing, stats, and statuses |
| `/withdrawals` | $100 minimum withdrawal request and seven-day tracking |
| `/help` | Support contacts and FAQs |
| `/about` | Mission, vision, story, team, achievements, contacts, and social links |

Admin sign-in uses the same `/login` page and authenticates against the separate administrator endpoint. Admin routes are protected by a distinct admin token:

- `/admin`
- `/admin/users`
- `/admin/withdrawals`
- `/admin/content`

`/admin/login` redirects to the shared sign-in page. Video-file uploads require the backend `POST /api/admin/videos/upload` multipart endpoint and managed media storage described in [BACKEND_REQUIREMENTS.md](BACKEND_REQUIREMENTS.md).

## Important Product Rules

- Starter activation uses a fixed `$25.00` amount.
- A wallet is not credited from local storage or frontend-only activation.
- Withdrawal requests require at least `$100.00`.
- Rewards are requested only after a video reaches full completion.
- The daily watch cap is displayed and tracked in the Watch flow.
- Watched video state is visibly marked for the current local day.
- Add Money supports UPI and bank/net-banking method selection.

## Backend Contracts

The frontend expects these API areas:

- `POST /auth/register`
- `POST /auth/verify-otp`
- `POST /auth/login`
- `GET /user/profile`
- `GET /wallet/balance`
- `GET /wallet/transactions`
- `POST /payments/create-order`
- `GET /videos/daily`
- `POST /videos/complete`
- `GET /referrals/stats`
- `GET /withdrawals/history`
- `POST /withdrawals/request`

For Add Money, the frontend sends:

```json
{
  "amount": 25,
  "method": "upi"
}
```

The payment backend should return a checkout URL, verify the payment gateway signature or webhook, and credit the wallet only after successful server-side confirmation.

## Frontend Safety Notes

- Payment confirmation must happen on the server.
- The frontend must never collect UPI PINs or bank passwords.
- Wallet balances should come from the backend ledger.
- Daily caps, reward idempotency, referral commissions, and withdrawal eligibility must be enforced server-side.
- Temporary About Us data and support/social details should be replaced with verified company information before production launch.

## Validation

Run the production build before delivery:

```bash
npm run build
```

The build currently completes successfully with Vite.
