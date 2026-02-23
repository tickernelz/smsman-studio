# SMSman Studio

Desktop client for SMS-man API. Manage multiple accounts, request phone numbers, and receive SMS codes.

## Features

- Multi-account management
- Real-time balance & status monitoring
- Phone number requests with country/service filters
- Auto-polling for SMS codes
- Request history with CSV export
- Dark/light mode

## Tech Stack

- Tauri 2 + React 19 + TypeScript
- Mantine UI + TanStack Query
- Zustand state management

## Development

```bash
npm install
npm run dev          # Start dev server
npm run build        # Production build
npm test             # Run tests
```

## Build

```bash
npm run tauri build  # Build desktop app
```

## Security

- Strict CSP headers
- API token validation
- Error boundary protection

## License

MIT