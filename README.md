# Guard Monitoring App

React Native based Guard Monitoring application migrated from Cordova. This app allows security guards to check in at checkpoints using NFC tags and GPS tracking.

## Features

- **Organization-based Authentication**: Login with organization ID
- **Guard Selection**: Select from list of available guards
- **PIN Authentication**: Secure PIN-based login
- **NFC Check-in**: Scan NFC tags at checkpoints
- **GPS Tracking**: Real-time location tracking
- **Multi-language Support**: Uzbek (Latin), Uzbek (Cyrillic), Russian
- **Offline Support**: Store check-ins when offline, sync when online
- **Auto-retry**: Automatic retry for failed API calls

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Hooks
- **Storage**: AsyncStorage
- **Location**: expo-location
- **NFC**: react-native-nfc-manager
- **Network**: @react-native-community/netinfo
- **i18n**: i18next + react-i18next
- **TypeScript**: Full TypeScript support

## Project Structure

```
src/
├── app/              # Expo Router screens
│   ├── _layout.tsx  # Root layout with i18n provider
│   ├── index.tsx    # Home screen
│   ├── login.tsx    # Organization ID login
│   ├── pin.tsx      # PIN authentication
│   ├── list.tsx     # Guard list selection
│   └── checkin.tsx  # NFC check-in screen
├── screens/         # Additional screens
├── services/        # API, storage services
├── utils/           # Logger, validator helpers
├── i18n/            # Translations
├── constants/       # Config
└── types/           # TypeScript types
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

Endpoints:

- `GET /api/v1/admin/guardlist` - Get list of guards
- `POST /api/v1/auth/guard` - Authenticate guard
- `POST /api/v1/admin/checkin` - Submit check-in

## Permissions

The app requires the following permissions on Android:

- `ACCESS_FINE_LOCATION` - For GPS tracking
- `ACCESS_COARSE_LOCATION` - For GPS tracking
- `ACCESS_BACKGROUND_LOCATION` - For background GPS
- `NFC` - For NFC tag scanning

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
