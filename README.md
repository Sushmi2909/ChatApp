# ChatApp 💬

A full-featured real-time chat application built with React Native, Firebase, and Cloudinary. Supports one-on-one and group messaging with rich media sharing, push notifications, and a smooth modern UI.

---

## Features

- 🔴 **Real-time messaging** — instant message delivery using Firestore listeners
- ✅ **Read receipts** — sent, delivered, and read status for every message
- ⌨️ **Typing indicators** — live typing status visible to other users
- 😄 **Emoji reactions** — react to any message with emojis
- ↩️ **Swipe to reply** — swipe a message to quote and reply inline
- 👥 **Group chats** — create and manage group conversations
- 🖼️ **Image sharing** — send images stored and served via Cloudinary
- 🎙️ **Voice messages** — record and send audio messages via Cloudinary
- 🔔 **Push notifications** — background and foreground notifications using FCM V1
- 📦 **APK build** — production build via Expo EAS Build

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React Native, Expo |
| Backend / Database | Firebase Firestore |
| Authentication | Firebase Auth |
| Media Storage | Cloudinary |
| Push Notifications | Firebase Cloud Messaging (FCM V1) |
| Build System | Expo EAS Build |

---

## Architecture

```
ChatApp
├── Firebase Firestore    → real-time messages, user data, group info
├── Firebase Auth         → user authentication
├── Cloudinary            → image and voice message storage
└── FCM V1                → push notifications (background + foreground)
```

**Real-time flow:**
```
User sends message
→ Firestore document created
→ Firestore listener on receiver triggers instantly
→ UI updates in real time
→ FCM notification sent if receiver is in background
```

**Read receipt flow:**
```
Message sent → status: "sent"
Delivered to receiver device → status: "delivered"
Receiver opens chat → status: "read"
```

---

## Project Structure

```
ChatApp/
├── App.js
├── app.json
├── src/
│   ├── screens/          # Chat, Home, Group screens
│   ├── components/       # Message bubble, typing indicator, reaction picker
│   ├── firebase/         # Firestore config and helpers
│   ├── cloudinary/       # Media upload helpers
│   └── notifications/    # FCM setup and handlers
├── assets/
└── package.json
```

---

## Getting Started

### Prerequisites
- Node.js
- Expo CLI
- Firebase project
- Cloudinary account

### Installation

```bash
# Clone the repo
git clone https://github.com/Sushmi2909/ChatApp.git
cd ChatApp

# Install dependencies
npm install

# Start the app
npx expo start
```

### Environment Setup

Create a `.env` file in the root directory:

```
FIREBASE_API_KEY=your_key
FIREBASE_AUTH_DOMAIN=your_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_bucket
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_UPLOAD_PRESET=your_preset
```

---

## Key Implementation Details

**Typing Indicators**
Updated a Firestore field `isTyping: true/false` on every keystroke with a debounce — listener on receiver side reflects it instantly.

**Push Notifications (FCM V1)**
Integrated FCM V1 API (replacing legacy HTTP API) for reliable background notification delivery. Foreground notifications handled via Expo Notifications listener.

**Voice Messages**
Recorded using Expo AV, uploaded directly to Cloudinary, and stored as a URL in Firestore. Playback handled inline in the chat bubble.

**Emoji Reactions**
Long press on a message opens a reaction picker. Reactions stored as a map `{ emoji: [userIds] }` in the Firestore message document.

---

## Built With

- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [Firebase](https://firebase.google.com/)
- [Cloudinary](https://cloudinary.com/)
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)

---

## Author

**Sushmi** — [GitHub](https://github.com/Sushmi2909)
