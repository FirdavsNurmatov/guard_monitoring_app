# Guard Monitoring App

React Native based Guard Monitoring application migrated from Cordova. This app allows security guards to check in at checkpoints using NFC tags and GPS tracking.

## Features

- **Organization-based Authentication**: Login with organization ID
- **Guard Selection**: Select from list of available guards
- **PIN Authentication**: Secure 6-digit PIN-based login
- **NFC Check-in**: Scan NFC tags at checkpoints with automatic retry logic
- **GPS Tracking**: Real-time location tracking with background support
- **Multi-language Support**: Uzbek (Latin), Uzbek (Cyrillic), Russian
- **Offline Support**: Store check-ins when offline (max 100 records), sync when online
- **Auto-retry**: Automatic retry for failed API calls (3 attempts with 1s delay)
- **Auto-logout**: Automatic logout on 401 Unauthorized responses
- **Check-in History**: View past check-in logs (max 100 records)
- **Back Handler**: Confirmation dialog before exiting the app

## Tech Stack

- **Framework**: React Native 0.81.5 with Expo 54.0.0
- **Navigation**: Expo Router 6.0.23 (file-based routing)
- **State Management**: React Hooks
- **Storage**: AsyncStorage 2.2.0
- **Location**: expo-location 19.0.8
- **NFC**: react-native-nfc-manager 3.17.2
- **Network**: @react-native-community/netinfo 11.4.1
- **i18n**: i18next 24.2.0 + react-i18next 15.1.3
- **TypeScript**: 5.9.2 with strict mode
- **Gesture Handling**: react-native-gesture-handler 2.28.0
- **Animations**: react-native-reanimated 4.1.1

## Project Structure

```
src/
├── app/              # Expo Router screens
│   ├── _layout.tsx  # Root layout with i18n & theme providers
│   ├── index.tsx    # Home screen (language selection, auth check)
│   ├── login.tsx    # Organization ID login
│   ├── pin.tsx      # PIN authentication (6-digit)
│   ├── list.tsx     # Guard list selection from API
│   ├── checkin.tsx  # NFC check-in screen with GPS
│   └── history.tsx  # Check-in history viewer
├── components/      # Reusable UI components
│   ├── button.tsx   # Custom button component
│   ├── card.tsx     # Card container component
│   └── error-message.tsx  # Error display component
├── services/        # API & storage services
│   ├── api.ts       # API service with retry logic
│   └── storage.ts   # AsyncStorage wrapper
├── i18n/            # Internationalization
│   ├── index.ts     # i18n configuration
│   └── translations.ts  # Translation strings (3 languages)
├── constants/       # Configuration
│   ├── colors.ts    # Color palette
│   ├── config.ts    # App configuration
│   └── index.ts     # Constants export
├── types/           # TypeScript type definitions
│   └── index.ts     # Shared types
└── global.css       # Global styles
```

## Getting Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the development server

   ```bash
   npx expo start
   ```

3. Run on Android

   ```bash
   npx expo start --android
   ```

4. Run on iOS

   ```bash
   npx expo start --ios
   ```

## API Configuration

The app connects to the Guard Monitoring API at `https://guard.bgs.uz/api`.

### Endpoints

- `GET /api/v1/admin/guardlist` - Get list of guards for an organization
- `POST /api/v1/auth/guard` - Authenticate guard with login and password
- `POST /api/v1/admin/checkin` - Submit check-in with NFC tag and GPS coordinates
- `POST /api/v1/admin/gps` - Update guard location

### API Features

- **Automatic Retry**: Failed requests are retried up to 3 times with 1s delay
- **Timeout**: 10-second timeout for all requests
- **Auto-authentication**: Bearer token automatically added to requests
- **Auto-organization_id**: Organization ID automatically added to GET requests
- **Auto-logout**: 401 Unauthorized responses trigger automatic logout
- **Error Handling**: Comprehensive error logging and user feedback

## Storage Service

The app uses AsyncStorage for local data persistence with the following keys:

### Authentication Data

- `organization_id` - Organization identifier (persisted across sessions)
- `access_token` - JWT bearer token for API authentication
- `id` - User ID
- `login` - User login
- `username` - User display name

### Session Data

- `selectedLogin` - Selected guard login for PIN entry
- `selectedUsername` - Selected guard username for PIN entry
- `lastLog` - Last check-in log message

### Offline Data

- `offline_checkin_data` - Array of offline check-ins (max 100 records)
- `checkin_logs` - Array of check-in history logs (max 100 records)

### Storage Methods

- `setOrganizationId()` / `getOrganizationId()` / `removeOrganizationId()`
- `setAccessToken()` / `getAccessToken()` / `removeAccessToken()`
- `setUser()` / `getUser()` / `removeUser()`
- `setSelectedUser()` / `getSelectedUser()` / `removeSelectedUser()`
- `setLastLog()` / `getLastLog()` / `removeLastLog()`
- `storeOfflineCheckin()` / `getOfflineCheckins()` / `clearOfflineCheckins()`
- `addCheckinLog()` / `getCheckinLogs()` / `clearCheckinLogs()`
- `clearAuthData()` - Clear only authentication data
- `clearAll()` - Clear all data except organization_id

## Configuration

Key configuration values in `src/constants/config.ts`:

```typescript
API_BASE_URL: "https://guard.bgs.uz/api";
TIMEOUT_MS: 10000; // 10 seconds

RETRY: MAX_ATTEMPTS: 3;
DELAY_MS: 1000; // 1 second

NFC: SCAN_COOLDOWN: 2000; // 2 seconds between scans
RETRY_INTERVAL: 3000; // 3 seconds
MAX_RETRY_ATTEMPTS: 10;

GPS: RETRY_INTERVAL: 3000; // 3 seconds
MAX_RETRY_ATTEMPTS: 10;

OFFLINE: MAX_RECORDS: 100;

CHECKIN: MAX_RETRIES: 5;
RETRY_DELAY: 3000;
SUCCESS_MESSAGE_DURATION: 7000; // 7 seconds
```

## Permissions

The app requires the following permissions on Android:

- `ACCESS_FINE_LOCATION` - For precise GPS tracking
- `ACCESS_COARSE_LOCATION` - For approximate GPS tracking
- `ACCESS_BACKGROUND_LOCATION` - For background GPS tracking
- `NFC` - For NFC tag scanning

## Key Components

### HomeScreen (`src/app/index.tsx`)

- Language selection (3 languages)
- Authentication status check
- GPS and NFC permission requests
- Back handler with exit confirmation
- Navigation to appropriate screen based on auth state

### RootLayout (`src/app/_layout.tsx`)

- i18n provider initialization
- Theme provider (dark/light mode)
- Safe area configuration
- Stack navigation setup

### ApiService (`src/services/api.ts`)

- `fetchWithRetry()` - Automatic retry logic with timeout
- `get()` / `post()` - HTTP request methods with auto-auth
- `getGuardList()` - Fetch guards for organization
- `authGuard()` - Authenticate with credentials
- `checkin()` - Submit check-in with NFC and GPS
- `updateLocation()` - Update guard GPS location

### StorageService (`src/services/storage.ts`)

- Wrapper around AsyncStorage
- Type-safe methods for all data operations
- Automatic data limits (max 100 records)
- Batch operations for auth data clearing

## Migration from Cordova

This project was migrated from a Cordova-based application. Key changes:

- Replaced Cordova plugins with Expo/React Native equivalents
- Migrated from HTML/CSS/JS to React Native with TypeScript
- Replaced localStorage with AsyncStorage
- Improved type safety with TypeScript
- Modern React patterns with hooks

## Development

- **Linting**: `npx expo lint`
- **Type Checking**: TypeScript is enabled with strict mode

## License

Apache-2.0
