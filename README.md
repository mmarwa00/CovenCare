# CovenCare 🦇

Menstrual cycle tracking and support app for circles of friends.

## Tech Stack
- **Frontend:** React Native + Expo
- **Backend:** Firebase (Auth + Firestore)
- **UI Library:** React Native Paper

## Setup

### Prerequisites
- Node.js (v20+)
- Expo Go app on your phone

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR-USERNAME/CovenCare.git
cd CovenCare
```

2. Install dependencies:
```bash
npm install
```

3. Get Firebase config from team and create:
```
src/config/firebaseConfig.js
```

4. Start the app:
```bash
npx expo start
```

5. Scan QR code with Expo Go app

## Project Structure
```
src/
├── components/     # Reusable UI components
├── screens/        # App screens
├── services/       # Firebase backend functions
├── config/         # Configuration (Firebase)
├── navigation/     # Navigation setup
└── context/        # Global state management
```

## Team
- **Marwa:** Backend/Firebase
- **Anastasiia:** Frontend/Coordinator
- **Silvia:** Design

## Features (Week by Week)
- Week 1-2: Authentication
- Week 3-4: Circle management & Period tracking
- Week 5-6: Emergency alerts & Vouchers
- Week 7-8: Additional features
- Week 9-10: Polish & testing