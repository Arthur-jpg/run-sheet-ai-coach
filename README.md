# RunSheet AI Coach

A powerful AI-powered application that enables running coaches to generate personalized training plans for their athletes.

![RunSheet AI Coach](https://via.placeholder.com/800x400?text=RunSheet+AI+Coach)

## Overview

RunSheet AI Coach revolutionizes how running coaches create and manage training plans. By leveraging AI, coaches can create highly customized training programs based on athlete data, goals, and abilities.

### Key Features

- **AI-Powered Plan Generation**: Create personalized training plans in seconds
- **Client Management**: Track and organize all your athletes in one place
- **Progress Monitoring**: Follow athlete development with comprehensive analytics
- **Plan Customization**: Adjust AI-generated plans to fit specific needs
- **Export Functionality**: Share plans in various formats (PDF, CSV, etc.)
- **Premium Features**: Access advanced tools with subscription-based premium tier

## Table of Contents

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
- [Usage](#usage)
  - [Running the Application](#running-the-application)
  - [Backend Server](#backend-server)
  - [Testing Stripe Integration](#testing-stripe-integration)
- [Architecture](#architecture)
  - [Technology Stack](#technology-stack)
  - [Project Structure](#project-structure)
- [Premium Features](#premium-features)
  - [Subscription Management](#subscription-management)
  - [Payment Processing](#payment-processing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [npm](https://www.npmjs.com/) or [Bun](https://bun.sh/) package manager
- [Stripe](https://stripe.com/) account for payment processing

### Installation

1. Clone the repository:
```sh
git clone https://github.com/your-username/run-sheet-ai-coach.git
cd run-sheet-ai-coach
```

2. Install dependencies:
```sh
# Using npm
npm install

# Using Bun
bun install
```

### Environment Setup

1. Create `.env` file for frontend:
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
VITE_API_URL=http://localhost:3000
VITE_PRICE_ID=price_your_stripe_price_id
```

2. Create `.env.server` file for backend:
```
STRIPE_SECRET_KEY=sk_test_your_secret_key
FRONTEND_URL=http://localhost:5173
PRICE_ID=price_your_stripe_price_id
```

## Usage

### Running the Application

1. Start the development server:
```sh
# Using npm
npm run dev

# Using Bun
bun run dev
```

2. Access the application at `http://localhost:5173`

### Backend Server

1. Start the backend server:
```sh
# Using node
node server.js

# Using nodemon (for development with auto-reload)
npx nodemon server.js
```

2. The server will start on `http://localhost:3000`

### Testing Stripe Integration

1. Use Stripe test mode with test API keys
2. Navigate to the Dashboard and click on "Upgrade to Premium"
3. Use Stripe test card number `4242 4242 4242 4242` with any future expiry date and any CVC
4. After successful payment, you'll be redirected to the success page

## Architecture

### Technology Stack

- **Frontend**:
  - [Vite](https://vitejs.dev/) - Build tool
  - [React](https://reactjs.org/) - UI framework
  - [TypeScript](https://www.typescriptlang.org/) - Type safety
  - [Tailwind CSS](https://tailwindcss.com/) - Styling
  - [shadcn/ui](https://ui.shadcn.com/) - UI components

- **Backend**:
  - [Node.js](https://nodejs.org/) - Server runtime
  - [Express](https://expressjs.com/) - Web framework
  - [Stripe API](https://stripe.com/docs/api) - Payment processing

### Project Structure

The application follows a modular architecture:

```
/
├── src/                  # Frontend source code
│   ├── components/       # React components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and API functions
│   ├── pages/            # Page components
│   └── ...
├── server.js             # Backend server for Stripe integration
├── .env                  # Frontend environment variables
└── .env.server           # Backend environment variables
```

## Premium Features

### Subscription Management

The premium tier offers:
- Unlimited client management
- Advanced AI training plan customizations
- Export options in multiple formats
- Priority support

### Payment Processing

Secure payment processing is handled through Stripe, supporting:
- Credit card payments
- Subscription management
- Automatic recurring billing
- Payment webhooks (for production)

## Deployment

### Production Setup

1. Configure environment variables for production:
   - Update `.env` with production Stripe publishable key
   - Update `.env.server` with production Stripe secret key and webhook secret

2. Build the frontend:
```sh
npm run build
```

3. Deploy the backend and frontend to your hosting provider of choice (Vercel, Netlify, AWS, etc.)

4. Set up Stripe webhooks for handling subscription events

### Security Considerations

- Always use HTTPS in production
- Keep Stripe secret keys secure
- Implement proper authentication for premium routes
- Validate all webhook events from Stripe

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or inquiries, please contact us at support@runsheetaicoach.com

---

RunSheet AI Coach © 2025 - All Rights Reserved
