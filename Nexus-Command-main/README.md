# Nexus Command

> Your personal career command centre — private, offline, zero recurring costs.

Nexus Command is a desktop application built with Electron + React that centralises every tool a job seeker or professional needs: email, job tracking, interview prep, AI writing assistant, social media, contacts, analytics, and more — all stored locally on your machine with no cloud dependency.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running in Development](#running-in-development)
- [Building for Production](#building-for-production)
- [App Sections](#app-sections)
- [Email Setup (Gmail)](#email-setup-gmail)
- [AI Assistant Setup](#ai-assistant-setup)
- [Security & Privacy](#security--privacy)
- [Project Structure](#project-structure)

---

## Features

| Feature | Description |
|---|---|
| **Master Password** | AES-256 / PBKDF2 encrypted SQLite database — nothing leaves your device |
| **Inbox** | IMAP email sync, compose, reply, forward, search, attachments |
| **Job Tracker** | Kanban board with status columns, deadlines, match scores, notes |
| **Interview Prep** | STAR stories, research notes, question bank, interview log |
| **Cover Letter Builder** | AI-assisted cover letters per job, draft/finalize workflow |
| **Match Scorer** | Score your CV against a job description instantly |
| **Contacts** | Relationship tracking, interaction timeline, network notes |
| **Asset Vault** | Store CVs, certificates, portfolios with tags and search |
| **Templates** | Reusable email and document templates |
| **AI Assistant** | Local LLM via Ollama — chat, cover letter mode, email tone, interview prep |
| **Automation** | IF-THEN rule engine to auto-tag, flag, or move emails |
| **Analytics** | Focus score, productive time, section usage, streak tracker |
| **Social Hub** | Embedded webviews for WhatsApp, Facebook, Instagram, LinkedIn, X, TikTok, Gmail |
| **Settings** | Profile, avatar, background image, email accounts, password change |

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 18 + React Router 6 |
| Styling | Tailwind CSS 3 |
| Charts | Chart.js + react-chartjs-2 |
| Desktop Shell | Electron 29 |
| Database | better-sqlite3 (local, encrypted) |
| Email (receive) | imap + mailparser |
| Email (send) | nodemailer |
| PDF | pdf-lib |
| AI | Ollama (local LLM, no API key needed) |
| Build | Vite 5 + electron-builder |
| Packaging | NSIS installer (Windows), DMG (macOS), AppImage (Linux) |

---

## Prerequisites

- **Node.js** 18 or later — [nodejs.org](https://nodejs.org)
- **npm** 9 or later (comes with Node)
- **Python** + **Visual Studio Build Tools** (for native module compilation on Windows)
  - Install via: `npm install --global windows-build-tools` *(run as Administrator)*
- **Git** (optional, for cloning)

---

## Installation

```bash
# 1. Clone or download the repository
git clone https://github.com/your-username/nexus-command.git
cd nexus-command

# 2. Install dependencies
npm install

# 3. Rebuild native modules for Electron
npx electron-rebuild -f -w better-sqlite3
```

---

## Running in Development

```bash
npm run dev
```

This starts Vite (React dev server on port 5173) and Electron simultaneously. Hot-reload is active for UI changes.

---

## Building for Production

### Step 1 — Rebuild native module (do this once, or after `npm install`)

```bash
npx electron-rebuild -f -w better-sqlite3
```

### Step 2 — Build and package

```bash
npm run dist
```

The installer is output to `dist-electron\`:

| Platform | Output |
|---|---|
| Windows | `dist-electron\Nexus Command Setup 1.0.0.exe` |
| macOS | `dist-electron\Nexus Command-1.0.0.dmg` |
| Linux | `dist-electron\Nexus Command-1.0.0.AppImage` |

Run the installer — it creates a Desktop shortcut and Start Menu entry.

---

## App Sections

### Dashboard
Overview of emails, jobs, analytics, social message counts, and recent activity. Shows your profile picture and background image.

### Inbox
Connects to any IMAP/SMTP email account. Supports Gmail, Outlook, Yahoo, and custom providers. Emails are stored locally in SQLite. Features: search, unread/replied filters, compose, reply, forward, attachments.

### Job Tracker
Kanban-style board with columns: Saved → Applied → Interview Scheduled → Offer → Rejected. Each job card holds notes, deadline, match score, linked contacts, and assets.

### Interview Prep
Per-job interview workspace: company research notes, STAR story builder, question bank, and interview log with outcomes.

### Cover Letter Builder
Generate and edit cover letters per application. Paste a job description and skills — the AI writes a draft. Save as draft or finalized.

### Match Scorer
Paste a job description and your CV/skills list to get an instant compatibility score with gap analysis.

### Contacts
Track your professional network: relationship strength (Warm/Cold/Mentor), interaction history, linked jobs, notes.

### Asset Vault
Store and tag important files: CVs, cover letters, certificates, portfolios. Open files from inside the app.

### Templates
Save reusable email and document templates with subject lines and body text. Apply them in Compose.

### AI Assistant
Chat interface powered by a locally-running Ollama model (no internet, no API key). Modes: free chat, cover letter writer, email tone improver, interview answer coach.

### Automation Rules
Visual IF-THEN rule builder. Example: "If subject contains 'interview' → tag as Priority". Rules run automatically on email sync.

### Analytics
Track where you spend your time in the app, productive vs. unproductive window usage, focus score, daily streak, and section breakdown charts.

### Social Hub
Embedded browser tabs for social platforms. All sessions are persistent (log in once, stay logged in). Platforms: WhatsApp, Facebook, Instagram, LinkedIn, X / Twitter, TikTok, Gmail.

### Settings
- Profile: name, avatar image, dashboard background
- Email accounts: add/edit/remove IMAP accounts
- Security: change master password
- Analytics: toggle tracking, set idle timeout

---

## Email Setup (Gmail)

Gmail blocks regular passwords for IMAP. You must use a **Gmail App Password**:

1. Enable **2-Step Verification** at [myaccount.google.com/security](https://myaccount.google.com/security)
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Create a new App Password — name it **Nexus Command**
4. Copy the 16-character password
5. In Nexus → Inbox → hover your account → click the **pencil icon** → paste the App Password → **Save & Sync**

IMAP settings are pre-configured for Gmail:

| Setting | Value |
|---|---|
| IMAP Host | `imap.gmail.com` |
| IMAP Port | `993` |
| SMTP Host | `smtp.gmail.com` |
| SMTP Port | `587` |

---

## AI Assistant Setup

The AI Assistant uses [Ollama](https://ollama.com) — a free, local LLM runner. No API key or internet connection required.

1. Download and install Ollama from [ollama.com](https://ollama.com)
2. Pull a model (recommended for low-spec machines: `phi` or `mistral`):
   ```bash
   ollama pull mistral
   ```
3. Ollama runs automatically in the background on `localhost:11434`
4. Open Nexus Command → **AI Assistant** — it will detect the running model

---

## Security & Privacy

- All data is stored in a single SQLite file on your machine: `%APPDATA%\nexus-command\nexus.db`
- The database is protected by a master password using **PBKDF2-SHA512** (100,000 iterations)
- Email passwords are stored in the local database (not transmitted anywhere)
- Social Hub sessions are stored in Electron's partition storage on your device
- No telemetry, no analytics sent externally, no accounts required
- The app works fully offline

---

## Project Structure

```
nexus-command/
├── electron/
│   ├── main.js              # Electron main process, IPC handlers
│   ├── preload.js           # Context bridge (exposes APIs to renderer)
│   ├── dbModule.js          # SQLite init, password hashing, schema
│   └── webviewPreload.js    # Injected into social hub webviews
├── src/
│   ├── App.jsx              # Root component, routes, app context
│   ├── database/
│   │   └── db.js            # Frontend DB helpers (dbQuery, dbRun, etc.)
│   ├── utils/
│   │   └── pathUtils.js     # toFileUrl() for Windows file paths
│   └── components/
│       ├── Auth/            # MasterPasswordScreen
│       ├── Layout/          # Sidebar navigation
│       ├── Dashboard/       # Overview with KPIs and social stats
│       ├── Inbox/           # Email client (Inbox, EmailList, EmailCompose)
│       ├── JobTracker/      # Kanban board, job form
│       ├── InterviewPrep/   # Interview workspace
│       ├── CoverLetter/     # Cover letter builder
│       ├── MatchScorer/     # CV vs JD scoring
│       ├── Contacts/        # Network & relationship manager
│       ├── AssetVault/      # File storage
│       ├── Templates/       # Template manager
│       ├── AIAssistant/     # Ollama chat interface
│       ├── Automation/      # Rule engine UI
│       ├── Analytics/       # Productivity analytics
│       ├── SocialHub/       # Embedded social media webviews
│       └── Settings/        # App configuration
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## Scripts Reference

| Command | Description |
|---|---|
| `npm run dev` | Start development mode (Vite + Electron) |
| `npm run build` | Build React app only (outputs to `dist/`) |
| `npm run dist` | Build React + package Electron installer |
| `npm run electron` | Launch Electron without Vite (uses pre-built `dist/`) |
| `npx electron-rebuild -f -w better-sqlite3` | Rebuild native SQLite module for current Electron version |

---

## License

MIT — free to use, modify, and distribute.

---

*Built with Electron + React + SQLite. Runs entirely on your machine.*
