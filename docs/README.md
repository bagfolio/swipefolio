# Swipefolio

## Project Structure

```
swipefolio/
├── client/                  # Frontend React application
├── server/                 # Backend Express application
├── shared/                # Shared types and utilities
├── config/               # Configuration files
├── scripts/              # Build and utility scripts
├── storage/             # Data storage
└── assets/             # Project assets
```

## Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

## Building for Production

```bash
npm run build
```

## Configuration

Configuration files are located in the `config/` directory:

- `vite.config.ts` - Vite configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `drizzle.config.ts` - Database configuration 