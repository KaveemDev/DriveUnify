# 📁 DriveUnify — Unified Multi-Account Google Drive Dashboard

> Manage, search, preview, and organize **all your Google Drive accounts** from a single, unified, privacy-first dashboard.

![DriveUnify Banner](https://img.shields.io/badge/DriveUnify-v2.0-6366f1?style=for-the-badge&logo=googledrive&logoColor=white)
![React 19](https://img.shields.io/badge/React-19.0.0-61dafb?style=for-the-badge&logo=react)
![Vite 8](https://img.shields.io/badge/Vite-8.0.0-646cff?style=for-the-badge&logo=vite)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4.0.0-06b6d4?style=for-the-badge&logo=tailwindcss)
![Firebase Cloud Functions](https://img.shields.io/badge/Firebase-v12.0.0-ffca28?style=for-the-badge&logo=firebase)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## 📌 Short Description

**DriveUnify** is a modern, high-performance web dashboard that merges multiple Google Drive accounts into one seamless interface. It eliminates account-switching friction by featuring serverless secure OAuth token exchange, real-time cross-account file exploration, virtualized high-volume file lists, resumable chunked uploads, and in-app file previews.

---

## 🏷️ Topics / GitHub Tags

`google-drive` • `multi-account` • `react19` • `vite` • `tailwindcss` • `redux-toolkit` • `firebase-auth` • `cloud-functions` • `firestore` • `oauth2` • `google-drive-api` • `dashboard` • `file-manager` • `resumable-uploads` • `dark-mode`

---

## ✨ Key Features

### 🔐 Multi-Account OAuth Security
- **Unlimited Drive Connections**: Connect and switch between multiple personal and workspace Google Drive accounts seamlessly.
- **Serverless Token Lifecycle**: OAuth authorization code exchange (`exchangeGoogleCode`), token refreshing (`refreshGoogleToken`), and token revocation (`revokeGoogleToken`) are executed securely in Firebase Cloud Functions.
- **Isolated Token Storage**: Google refresh tokens are stored strictly in server-only Firestore documents (`drive_tokens/{uid}`), inaccessible to the client browser.

### 🗂️ Unified File Explorer & Virtualization
- **Combined & Per-Account Views**: Browse files across all connected accounts in a single grid/list view or isolate individual accounts.
- **Virtualized List Rendering**: Powered by `react-window` to effortlessly handle tens of thousands of files without UI lag or memory bloat.
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
                               │     Client App (Vite)     │
                               │  React 19 + Redux Toolkit │
                               └─────────────┬─────────────┘
                                             │
                      ┌──────────────────────┼──────────────────────┐
                      │                      │                      │
       1. OAuth popup │                      │ 2. Direct API calls  │ 3. Metadata sync
          & Code      │                      │    (with access_tok) │    & Auth state
                      ▼                      ▼                      ▼
           ┌────────────────────┐  ┌──────────────────┐  ┌──────────────────┐
           │ Firebase Cloud     │  │ Google Drive REST│  │ Firebase Auth &  │
           │ Functions (v2)     │  │ API v3           │  │ Firestore DB     │
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
├── landing/                                 # Marketing Site & SEO (Next.js)
│   ├── src/app/                            # App Router pages (/, /features, /docs, etc.)
│   ├── src/components/                     # Marketing layout, Navbar, and UI
│   ├── src/lib/                            # Auth session sync & Firebase client
│   ├── package.json                        # Landing dependencies
│   └── vercel.json                         # Vercel Next.js configuration
├── dashboard/                               # Web App Dashboard (React + Vite)
│   ├── src/
│   │   ├── api/                            # Google Drive REST API v3 wrappers
│   │   ├── components/                     # Explorer, sidebar, modals, upload
│   │   ├── config/                         # Firebase & App constants
│   │   ├── hooks/                          # Custom React hooks (useAuth, useDrive, etc.)
│   │   ├── pages/                          # Login, Dashboard, Settings, Support
│   │   ├── routes/                         # App routes & ProtectedRoute wrapper
│   │   ├── services/                       # Firebase & Google Drive services
│   │   └── store/                          # Redux Toolkit store (auth, drive, upload, ui)
│   ├── firestore.rules                     # Client-side Firestore security rules
│   ├── package.json                        # Dashboard dependencies
│   ├── vite.config.js                      # Vite build configuration
│   └── vercel.json                         # Vercel SPA rewrite & Vite config
├── functions/                              # Firebase Cloud Functions (v2 Node.js)
│   ├── index.js                            # Serverless functions (exchange, refresh, revoke)
│   ├── package.json                        # Backend dependencies (googleapis, firebase-admin)
│   └── .env                                # Backend OAuth secrets
├── package.json                            # Monorepo build script orchestration
├── vercel.json                             # Root Vercel build configuration
├── firebase.json                           # Firebase multi-target project config
└── README.md                               # Project documentation
```

---

## 🔒 Security Model & Firestore Rules

DriveUnify strictly segregates sensitive OAuth credentials from public user data:

1. **Server-Only Path (`drive_tokens/{uid}/accounts/{emailId}`)**:
   - Contains raw Google OAuth `refresh_token`.
   - **Firestore Security Rules block all client reads and writes**. Only Firebase Admin SDK (Cloud Functions) has access.
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
| **Frontend Framework** | React 19 + Vite 8 | UI compilation and hot module reloading |
| **State Management** | Redux Toolkit | Centralized state for auth, drive accounts, file cache, and uploads |
| **Styling** | Tailwind CSS v4 + Radix UI | Modern responsive glassmorphism UI & accessible primitives |
| **Routing** | React Router v7 | Declarative route management and code-splitting |
| **Authentication** | Firebase Auth v12 | Google identity sign-in for application access |
| **Database** | Firebase Firestore | User metadata and account connection tracking |
| **Serverless Backend** | Firebase Cloud Functions v2 | Secure OAuth token exchange, refreshing, and revocation |
| **Drive API** | Google Drive REST API v3 | Multi-account file listing, searching, downloading, and uploading |
| **Virtualization** | `react-window` v2 | High-performance rendering for 10,000+ files |
| **Notifications** | `react-hot-toast` | Real-time toast feedback for system events |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v18.x` or `v20.x`
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

### Step 2: Configure Firebase Cloud Functions

1. Navigate to `functions/`:
   ```bash
   cd functions
   npm install
   ```
2. Create `functions/.env` file with your Google OAuth Credentials:
   ```env
   GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:5173
   ```

---

### Step 3: Configure Frontend Client

1. Navigate to `client/`:
   ```bash
   cd ../client
   npm install
   ```
2. Create `client/.env` based on `.env.example`:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   ```

---

### Step 4: Run Locally

1. **Start Cloud Functions (Optional / Emulator Mode)**:
   ```bash
   cd functions
   npm run serve
   ```
2. **Start Client Dev Server**:
   ```bash
   cd client
   npm run dev
   ```
3. Open your browser and navigate to `http://localhost:5173`.

---

## 📜 NPM Commands Reference

### Client (`client/`)

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server on port 5173 |
| `npm run build` | Compiles production bundle into `dist/` |
| `npm run preview` | Previews production build locally |
| `npm run lint` | Runs ESLint syntax and code quality checks |

### Cloud Functions (`functions/`)

| Command | Action |
| :--- | :--- |
| `npm run serve` | Runs local Firebase emulator suite for functions |
| `npm run deploy` | Deploys functions directly to Firebase Cloud |

---

## 🚢 Deployment

### 1. Deploy Firebase Cloud Functions & Firestore Rules

```bash
firebase login
firebase use --add # select your Firebase project
firebase deploy --only functions,firestore:rules
```

### 2. Deploy to Vercel (Two-Project Architecture)

DriveUnify is split into two independent applications in a monorepo structure. In Vercel, deploy each app as its own Project linked to the same Git repository:

#### A. Marketing & Landing Site (`landing/`)
- **Project Settings → General → Root Directory**: `landing`
- **Framework Preset**: `Next.js`
- **Build Command**: `next build` (or `npm run build`)
- **Output Directory**: `.next`
- **Domain**: `driveunify.com` (or your primary domain)
- **Environment Variables**: Add all `NEXT_PUBLIC_FIREBASE_*` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` variables (see `landing/.env.example`).

#### B. Dashboard Web Application (`dashboard/`)
- **Project Settings → General → Root Directory**: `dashboard`
- **Framework Preset**: `Vite`
- **Build Command**: `vite build` (or `npm run build`)
- **Output Directory**: `dist`
- **Domain**: `dashboard.driveunify.com`
- **Environment Variables**: Add all `VITE_FIREBASE_*` and `VITE_GOOGLE_CLIENT_ID` variables (see `dashboard/.env.example`).

> **Note on Root Deployment**: The repository also contains a root `package.json` and `vercel.json` configured with npm scripts (`npm run build:landing`, `npm run build:dashboard`, `npm run build:all`) so any root-level CI or deployments build without missing directory errors.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.
