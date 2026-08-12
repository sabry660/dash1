# LYTC Hotel Management Dashboard

A comprehensive luxury hotel management dashboard built by LYTC, featuring an integrated system for room management, reservations, guest requests, housekeeping, financial services, and analytics. The application is designed entirely in Arabic to serve the Middle Eastern hospitality market.

## Features

- **Room Management**: Complete oversight of room status, occupancy, and maintenance with real-time updates
- **Room Categories**: Manage room categories with specifications, pricing, and daily rates
- **Reservation System**: Streamlined booking management with calendar view, guest check-in/check-out processes
- **Landing Page Integration**: Handle reservation requests from the landing page with approval/rejection workflow
- **Guest Services**: Efficient handling of guest requests and service orders (room service, restaurant, cafe)
- **Menu Management**: Create and manage menu items with image uploads for all service categories
- **Special Offers**: Promotional offers management with image support
- **Housekeeping Coordination**: Real-time room cleaning status and staff assignment
- **Financial Analytics**: Comprehensive reporting on revenue, expenses, and performance metrics
- **Real-time Updates**: SSE (Server-Sent Events) integration for live data synchronization
- **Image Compression**: Automatic WebP compression for images under 1MB
- **Arabic Interface**: Full Arabic language support with RTL (right-to-left) layout
- **Modern UI**: Built with React 19, Tailwind CSS, and Motion for smooth animations
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

## Technology Stack

- **Frontend Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS v4
- **Build Tool**: Vite 6
- **Animations**: Motion (Framer Motion)
- **Icons**: Lucide React
- **API Integration**: REST API with Swagger documentation compliance
- **Real-time Updates**: Server-Sent Events (SSE)
- **Image Processing**: browser-image-compression for WebP conversion
- **Backend API**: https://lytc-hotel-backend.onrender.com

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn package manager
- Google Gemini API Key

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   Create a `.env.local` file in the root directory and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

## Running the Application

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Building for Production

Create an optimized production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
Dashboard/
├── public/              # Static assets (logo, images)
├── src/
│   ├── components/      # Reusable React components
│   │   ├── RoomsSection.tsx
│   │   ├── RoomCategoriesSection.tsx
│   │   ├── ReservationsSection.tsx
│   │   ├── OrdersSection.tsx
│   │   ├── SpecialOffersSection.tsx
│   │   ├── MenuItemsSection.tsx
│   │   └── ...
│   ├── services/        # API service layer
│   │   └── api.ts       # REST API integration with Swagger types
│   ├── hooks/           # Custom React hooks
│   │   └── useSSE.ts    # Server-Sent Events hook
│   ├── utils/           # Utility functions
│   │   └── imageCompression.ts  # WebP image compression
│   ├── types.ts         # TypeScript type definitions
│   ├── App.tsx         # Main application component
│   ├── main.tsx        # Application entry point
│   └── index.css       # Global styles
├── index.html          # HTML template with SEO meta tags
├── package.json        # Project dependencies and scripts
├── tsconfig.json       # TypeScript configuration
└── vite.config.ts      # Vite build configuration
```

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run TypeScript type checking
- `npm run clean` - Clean build artifacts

## Browser Support

The application supports all modern browsers including Chrome, Firefox, Safari, and Edge.

## License

Proprietary - Copyright LYTC

## Support

For technical support or inquiries, please contact the LYTC development team.
# dash1
