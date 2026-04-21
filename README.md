# PokerDag

Planning poker for your team — no login required, no persistence.

**Live:** https://drovik.github.io/PokerDag/

---

## Features

- Create a room and share the link with your team
- Vote with Fibonacci cards: 1, 2, 3, 5, 8, 13, 21, ?, ☕
- Votes are hidden until someone clicks **Reveal**
- Anyone can reveal or start a new round
- Works on desktop and mobile
- Installable as a PWA
- Rooms disappear when everyone leaves

---

## Setup

### 1. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project (Spark/free plan is fine)
3. Add a **Web app** and copy the config
4. Enable **Firestore Database** in the Firebase console
5. In Firestore → Rules, paste the contents of `firestore.rules` and publish

### 2. Local development

Create `client/.env.local` with your Firebase config:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Then:

```bash
cd client
npm install
npm run dev
```

### 3. Deploy to GitHub Pages

1. In your GitHub repo → **Settings → Secrets and variables → Actions**, add each `VITE_FIREBASE_*` value as a repository secret.
2. Enable GitHub Pages: **Settings → Pages → Source → GitHub Actions**
3. Push to `main` — the workflow deploys automatically.

> The base path `/PokerDag/` in the workflow matches this repo name. If you rename the repo, update `VITE_BASE_PATH` in `.github/workflows/deploy.yml`.

---

## Tech stack

- React + TypeScript + Vite
- Tailwind CSS
- Firebase Firestore (real-time sync, no backend server)
- vite-plugin-pwa (service worker + installable)
- GitHub Actions → GitHub Pages
