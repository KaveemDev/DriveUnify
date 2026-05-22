# DriveUnify — Unified Google Drive Dashboard

> Manage **all your Google Drive accounts** from a single, beautiful dashboard.

![DriveUnify](https://img.shields.io/badge/DriveUnify-v2.0-blue?style=flat-square)
![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-8-purple?style=flat-square)
![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-teal?style=flat-square)
![Firebase](https://img.shields.io/badge/Firebase-12-orange?style=flat-square)

---

## 🏗️ Architecture

```
client/
├── src/
│   ├── api/                 # Google Drive REST API v3 wrapper
│   ├── components/
│   │   ├── common/          # Button, Input, Modal, Spinner, EmptyState, etc.
│   │   ├── explorer/        # FileGrid, FileList, FileCard, FileRow, FileIcon, etc.
│   │   ├── sidebar/         # Sidebar, AccountItem, StorageBar
│   │   ├── modals/          # ConnectDriveModal, FilePreviewModal, RenameModal, ShareModal
│   │   └── upload/          # UploadZone, UploadQueue, UploadProgressItem
│   ├── config/              # Firebase init, app constants
│   ├── hooks/               # useAuth, useDrive, useUpload, useSearch, useOnlineStatus
│   ├── layouts/             # DashboardLayout (sidebar + header)
│   ├── pages/               # Login, Dashboard, Settings
│   ├── routes/              # AppRoutes with lazy loading + ProtectedRoute
│   ├── services/
│   │   ├── firebase/        # auth.js, firestore.js
│   │   └── google-drive/    # auth.js, files.js, upload.js, folders.js
│   ├── store/               # Redux store + 4 slices (auth, drive, upload, ui)
│   └── utils/               # formatters.js, helpers.js, analytics.js
└── firestore.rules           # Firestore security rules
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 Firebase Auth | Google sign-in via Firebase Authentication |
| 🔗 Multi-account | Connect unlimited Google Drive accounts |
| 🗂️ Unified Explorer | All files in one grid/list view |
| ⚡ Fast Virtualization | react-window handles 10,000+ files smoothly |
| 📤 Upload | Drag-and-drop + file picker, resumable uploads (chunked for >5MB) |
| 🔍 Search & Sort | Real-time client-side search + sort by name/date/size/type |
| 👁️ Preview | Images, videos, PDFs, Google Docs preview in modal |
| 📁 Folder navigation | Navigate into folders with breadcrumb trail |
| ✏️ File actions | Rename, delete, star, copy link, open in Drive |
| 📊 Storage insight | Per-account + total storage visualization |
| 🌐 Offline detection | Banner when offline, auto-sync when reconnected |
| 🔒 Security | Firestore rules: users only see their own data |
| 📦 Code splitting | Lazy-loaded pages + manual chunk splitting |

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
cd client
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

| Variable | Where to get it |
|----------|----------------|
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project Settings → Your Apps |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Console → Project Settings |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Console → Project Settings |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Console → Project Settings |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console → Project Settings |
| `VITE_FIREBASE_APP_ID` | Firebase Console → Project Settings |
| `VITE_GOOGLE_CLIENT_ID` | Google Cloud Console → APIs & Services → OAuth 2.0 |

### 3. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select your project
3. Enable **Google Drive API**
4. Go to **APIs & Services → Credentials → Create OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add authorized JavaScript origins:
   - `http://localhost:5173` (development)
   - `https://your-domain.com` (production)

### 4. Firebase Setup

1. Enable **Authentication** → Sign-in methods → **Google**
2. Create **Firestore Database** (start in test mode, then deploy rules)
3. Add your domain to authorized domains in Authentication settings

### 5. Start development server

```bash
npm run dev
```

Visit `http://localhost:5173`

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## 🔒 Deploy Firestore Rules

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # select your project
firebase deploy --only firestore:rules
```

---

## 🚢 Deploy to Vercel

```bash
npm install -g vercel
vercel
# Set environment variables in Vercel dashboard
```

## 🚢 Deploy to Firebase Hosting

```bash
firebase init hosting
# Set public directory to: dist
# Configure as SPA: yes
npm run build
firebase deploy
```

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 |
| State | Redux Toolkit |
| Routing | React Router v7 |
| Auth | Firebase Auth v12 |
| Database | Firestore |
| Drive API | Google Drive REST API v3 |
| OAuth | Google Identity Services (GIS) |
| Virtualization | react-window v2 |
| Upload | Custom multipart + resumable |
| UI primitives | Radix UI |
| Toasts | react-hot-toast |
| Icons | lucide-react |
| Date formatting | date-fns |

---

## 📄 License

MIT
