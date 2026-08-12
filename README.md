# Dash1 Hotel Management Dashboard

This repository contains the frontend application for a hotel management dashboard built with React and TypeScript. The application supports room management, reservations, guest services, housekeeping, restaurant and cafe operations, special offers, and analytics.

## Features

- Room management with status tracking, occupancy monitoring, and maintenance workflows
- Room category management with pricing and specifications
- Reservation management including booking, check-in, and check-out workflows
- Landing page reservation handling with approval and rejection flows
- Guest service request handling for room service, restaurant, and cafe orders
- Menu and special offer management with image support
- Housekeeping coordination with room cleaning status and staff assignments
- Financial analytics and reporting for revenue, expenses, and performance metrics
- Real-time updates via Server-Sent Events (SSE)
- Automatic image compression for optimized uploads
- Full Arabic interface support with right-to-left layout
- Responsive design for desktop, tablet, and mobile screens

## Technology stack

- Frontend: React 19 with TypeScript
- Styling: Tailwind CSS v4
- Build tool: Vite 6
- Animations: Framer Motion
- Icons: Lucide React
- API integration: REST API
- Real-time updates: Server-Sent Events (SSE)
- Image processing: browser-image-compression

## Prerequisites

- Node.js v18 or higher
- npm or yarn
- Google Gemini API key (if using AI integration)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sabry660/dash1.git
   cd dash1
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env.local` file in the project root and add the required values.
   ```bash
   echo "GEMINI_API_KEY=your_api_key_here" > .env.local
   ```

## Development

Start the application in development mode:

```bash
npm run dev
```

Open the application in a browser at `http://localhost:3000`.

## Production build

Build the application for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Project structure

```text
src/
├── components/          # Reusable UI components
├── contexts/            # React context providers
├── hooks/               # Custom hooks
├── services/            # API service layer
├── utils/               # Utility functions
├── App.tsx              # Main application component
├── main.tsx             # Application entry point
└── index.css            # Global styles
public/                   # Static assets
package.json              # Project dependencies and scripts
tsconfig.json             # TypeScript configuration
vite.config.ts            # Vite configuration
README.md                 # Project documentation
```

## Available scripts

- `npm run dev` — start the development server
- `npm run build` — build the application for production
- `npm run preview` — preview the production build
- `npm run lint` — run TypeScript checks and linting
- `npm run clean` — remove build artifacts

## Browser support

The application is tested in modern browsers including Chrome, Firefox, Safari, and Edge.

## License

This repository is proprietary.

## Support

For questions or support, contact the project maintainer.
