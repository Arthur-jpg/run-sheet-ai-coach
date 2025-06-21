# README - RunSheet AI Coach: Premium Version Implementation

## Stripe Integration and Premium Features

This project implements a premium version of the RunSheet AI Coach application with Stripe integration for payments and subscription management. The premium version includes features for coaches to manage clients and generate personalized training spreadsheets.

### Setup Instructions

1. **Install required packages:**
   ```
   npm install @stripe/stripe-js stripe dotenv
   ```

2. **Configure environment variables:**
   Copy `.env.example` to `.env` and fill in your Stripe API keys:
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
   VITE_STRIPE_SECRET_KEY=sk_test_your_secret_key
   VITE_STRIPE_PRICE_ID=price_your_price_id
   VITE_API_URL=http://localhost:3001
   ```

3. **Run the backend server:**
   ```
   node server.js
   ```

4. **Start the development server:**
   ```
   npm run dev
   ```

### Premium Features

- **Subscription Management:** Users can subscribe to the premium plan using Stripe.
- **Client Management:** Coaches can add, edit, and delete clients.
- **Personalized Running Sheets:** Generate running plans for specific clients.
- **Dashboard:** Overview of all clients and generated plans.

### Backend API

The backend provides several endpoints for managing subscriptions, clients, and running plans:

- **Stripe endpoints:**
  - POST `/create-checkout-session`: Create a Stripe checkout session
  - GET `/subscription-status/:userId`: Check subscription status
  - POST `/cancel-subscription/:subscriptionId`: Cancel subscription

- **Client endpoints:**
  - POST `/clients`: Create a new client
  - GET `/clients`: List all clients
  - PATCH `/clients/:clientId`: Update client
  - DELETE `/clients/:clientId`: Delete client

- **Running plan endpoints:**
  - POST `/plans`: Create a new running plan
  - GET `/plans`: List plans (filtered by client or coach)
  - DELETE `/plans/:planId`: Delete plan

### Folder Structure

- `src/lib/api.ts`: API service for Stripe, clients, and running plans
- `src/lib/stripe.ts`: Stripe configuration
- `src/pages/Dashboard.tsx`: Dashboard for premium features
- `src/pages/ClientManager.tsx`: Client details and plan management
- `src/pages/NewChat.tsx`: Generate plans for clients
- `src/pages/PaymentSuccess.tsx`: Handle successful payments
- `src/pages/PaymentCanceled.tsx`: Handle canceled payments

### Webhook Integration

The application uses webhooks to communicate with Stripe for subscription events. The webhook endpoints are configured in the backend server.
