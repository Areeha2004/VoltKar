# Volt - Smart Energy Intelligence

## Overview
Volt is a Next.js application for electricity management with AI-powered insights, predictive analytics, and intelligent optimization designed for Pakistani households and businesses.

## Tech Stack
- **Framework**: Next.js 15.4.5 with React 19
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: TailwindCSS
- **Authentication**: NextAuth.js
- **Charts**: Recharts

## Project Structure
```
src/
├── app/           # Next.js App Router pages and API routes
├── components/    # React components
├── contexts/      # React context providers
├── hooks/         # Custom React hooks
├── lib/           # Utility libraries and services
├── generated/     # Prisma generated client
prisma/
├── schema.prisma  # Database schema
├── migrations/    # Database migrations
```

## Development
- **Dev Server**: `npm run dev -- -p 5000 -H 0.0.0.0`
- **Build**: `npm run build`
- **Start**: `npm run start`
- **Tests**: `npm run test`

## Database
The application uses PostgreSQL with Prisma. Database schema includes:
- Users and authentication (NextAuth integration)
- Meters and meter readings
- Appliances and energy tracking
- Tariffs for Pakistani electricity providers
- Forecasts and anomaly detection
- Gamification features (challenges, leaderboards)

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (auto-configured)
- `NEXTAUTH_SECRET`: Secret for NextAuth (needs to be set for production)
- `NEXTAUTH_URL`: Application URL for NextAuth

## Key Features
- Meter reading tracking with weekly/monthly data
- Electricity cost calculations based on Pakistani tariff slabs
- Appliance energy consumption estimation
- Usage forecasting
- Anomaly detection
- Energy-saving challenges and gamification
