# 📁 DriveUnify — Unified Multi-Account Google Drive Dashboard

> Manage, search, preview, and organize **all your Google Drive accounts** from a single, unified, privacy-first dashboard.

![DriveUnify Banner](https://img.shields.io/badge/DriveUnify-v2.0-6366f1?style=for-the-badge&logo=googledrive&logoColor=white)
![React 19](https://img.shields.io/badge/React-19.0.0-61dafb?style=for-the-badge&logo=react)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4.0.0-06b6d4?style=for-the-badge&logo=tailwindcss)
![Firebase](https://img.shields.io/badge/Firebase-Admin%20%2B%20Auth-ffca28?style=for-the-badge&logo=firebase)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## 📌 Short Description

**DriveUnify** is a modern, high-performance web dashboard that merges multiple Google Drive accounts into one seamless interface. It eliminates account-switching friction by featuring serverless secure OAuth token exchange, real-time cross-account file exploration, virtualized high-volume file lists, resumable chunked uploads, and in-app file previews.

---

## 🏷️ Topics / GitHub Tags

`google-drive` • `multi-account` • `react19` • `nextjs` • `tailwindcss` • `redux-toolkit` • `firebase-auth` • `firestore` • `oauth2` • `google-drive-api` • `dashboard` • `file-manager` • `resumable-uploads` • `dark-mode`

---

## ✨ Key Features

### 🔐 Multi-Account OAuth Security
- **Unlimited Drive Connections**: Connect and switch between multiple personal and workspace Google Drive accounts seamlessly.
- **Server Token Lifecycle**: OAuth authorization code exchange, token refresh, and revocation run in the Next.js route `POST /api/oauth`. The Google client secret stays on the server.
- **Isolated Token Storage**: Google refresh tokens are stored strictly in server-only Firestore documents (`drive_tokens/{uid}`), inaccessible to the client browser.

### 🗂️ Unified File Explorer & Virtualization
- **Combined & Per-Account Views**: Browse files across all connected accounts in a single grid/list view or isolate individual accounts.
- **File lists**: Grid and list views for files across connected accounts.
- **Breadcrumb Navigation**: Deep-folder navigation with breadcrumb trails and instant subfolder opening.

### 📤 Resumable & Chunked Upload Engine
- **Drag-and-Drop Uploads**: Drag files directly into the browser workspace or select files via system picker.
- **Chunked Resumable Uploads**: Large files (>5MB) use Google Drive resumable upload session URIs to survive network drops.
- **Upload Queue Control**: Real-time progress indicators with pause, resume, and cancel capabilities powered by Redux Toolkit.

### 👁️ Rich In-App Previews & Actions
- **Modal File Viewer**: Native in-app rendering for images, videos, audio files, PDFs, and embedded Google Workspace docs (Docs, Sheets, Slides).
- **Comprehensive File Management**: Rename, delete, star/unstar, view storage metrics, copy shareable links, and direct open in native Google Drive.

### 📊 Storage Analytics & Network Resilience
- **Storage Metrics**: Visual per-account breakdown and total combined storage utilization gauges.
- **Offline & Reconnection Guard**: Live network monitoring that notifies users when offline and automatically syncs upon reconnection.

---

## 🏗️ Architecture Overview

DriveUnify operates on a decoupled client-serverless architecture designed for extreme security and performance.

```
                               ┌───────────────────────────┐
                               │   Next.js app (one site)  │
                               │  Marketing + dashboard   │
                               └─────────────┬─────────────┘
                                             │
                      ┌──────────────────────┼──────────────────────┐
                      │                      │                      │
       1. OAuth popup │                      │ 2. Direct API calls  │ 3. Metadata sync
          & Code      │                      │    (with access_tok) │    & Auth state
                      ▼                      ▼                      ▼
           ┌────────────────────┐  ┌──────────────────┐  ┌──────────────────┐
           │ POST /api/oauth    │  │ Google Drive REST│  │ Firebase Auth &  │
           │ (Firebase Admin)   │  │ API v3           │  │ Firestore DB     │
           └──────────┬─────────┘  └──────────────────┘  └──────────────────┘
                      │
        4. Save token │ (Server-Only Path)
                      ▼
           ┌────────────────────┐
           │ Firestore          │
           │ `drive_tokens/`    │
           └────────────────────┘
```

---

## 📂 Project Structure

```
DriveUnify/
├── landing/                                 # Next.js app (marketing + dashboard)
│   ├── src/app/                            # Marketing pages, /dashboard, /api/oauth
│   ├── src/drive/                          # Dashboard UI, Redux, Drive clients
│   ├── src/lib/server/oauth.js             # Token exchange, refresh, revoke
│   └── package.json
├── firestore.rules                         # Client rules; token docs are server-only
├── package.json                            # npm run dev / build
├── vercel.json
└── firebase.json
```

---

## 🔒 Security Model & Firestore Rules

DriveUnify strictly segregates sensitive OAuth credentials from public user data:

1. **Server-Only Path (`drive_tokens/{uid}/accounts/{emailId}`)**:
   - Contains raw Google OAuth `refresh_token`.
   - **Firestore Security Rules block all client reads and writes**. Only the Next.js server, using Firebase Admin, has access.
2. **Client-Readable Path (`users/{uid}/connected_accounts/{emailId}`)**:
   - Contains safe account metadata (`name`, `email`, `picture`, `connectedAt`).
   - Accessible only by the authenticated owner (`auth.uid == uid`).

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/connected_accounts/{accountId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /drive_tokens/{userId}/{document=**} {
      allow read, write: if false; // Completely forbidden to client SDKs
    }
  }
}
```

---

## 🛠️ Tech Stack & Technologies

| Domain | Technology | Purpose |
| :--- | :--- | :--- |
| **App** | Next.js 16 + React 19 | Marketing pages and the dashboard in one app |
| **State Management** | Redux Toolkit | Auth, drive accounts, file cache, and uploads |
| **Styling** | Tailwind CSS v4 + MUI | Marketing pages and dashboard UI |
| **Routing** | Next.js App Router | `/`, `/dashboard`, `/login`, `/api/oauth` |
| **Authentication** | Firebase Auth | Google sign-in |
| **Database** | Firebase Firestore | Account metadata. Refresh tokens are server-only |
| **Token API** | `POST /api/oauth` | Exchange, refresh, and revoke via Firebase Admin |
| **Drive API** | Google Drive REST API v3 | File listing, search, download, and upload |
| **Notifications** | `react-hot-toast` | Toast feedback |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v22` or newer
- **npm**: `v9.x` or higher
- **Firebase CLI**: `npm install -g firebase-tools`
- **Google Cloud Console Account**: With OAuth 2.0 Client ID enabled

---

### Step 1: Clone Repository

```bash
git clone git@github-kaveem:Kaveem-Offical/DriveUnify.git
cd DriveUnify
```

---

### Step 2: Configure the Next.js app

```bash
cd landing
npm install
```

Create `landing/.env.local` (see `landing/.env.example`):

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Add `http://localhost:3000/oauth/callback` as an authorized redirect URI on the Google OAuth client.

---

### Step 3: Run locally

```bash
npm run dev
```

Open `http://localhost:3000`. The dashboard is at `/dashboard`, sign-in at `/login`.

---

## 📜 NPM Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Next.js dev server on port 3000 |
| `npm run build` | Production build |
| `npm test` | Transfer service tests |
| `npm run lint` | ESLint |

---

## 🚢 Deployment

Firestore rules:

```bash
firebase login
firebase use --add
firebase deploy --only firestore:rules
```

Vercel: one Next.js project.

- **Root Directory**: `landing` (or the repo root; root `vercel.json` builds `landing`)
- **Framework**: Next.js
- **Domain**: `driveunify.com`
- Set the same env vars as `landing/.env.example`, including the Firebase Admin key and `GOOGLE_CLIENT_SECRET`. Do not prefix secrets with `NEXT_PUBLIC_`.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.
