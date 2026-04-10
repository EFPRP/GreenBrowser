<p align="center">
</p>

<h1 align="center">🌿 GreenBrowser</h1>

<p align="center">
  <strong>The web, powered by Earth.</strong><br/>
  A privacy-first, zero-telemetry web browsing interface built for the modern age.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-20E377?style=for-the-badge&labelColor=0a0e0c" alt="Version" />
  <img src="https://img.shields.io/badge/electron-28.2.1-47848f?style=for-the-badge&logo=electron&logoColor=white&labelColor=0a0e0c" alt="Electron" />
  <img src="https://img.shields.io/badge/vite-8.0.4-646cff?style=for-the-badge&logo=vite&logoColor=white&labelColor=0a0e0c" alt="Vite" />
  <img src="https://img.shields.io/badge/platform-windows-0078D4?style=for-the-badge&logo=windows&logoColor=white&labelColor=0a0e0c" alt="Platform" />
  <img src="https://img.shields.io/badge/license-GNU_Affero-444?style=for-the-badge&labelColor=0a0e0c" alt="License" />
</p>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Usage Guide](#-usage-guide)
- [Internal Pages](#-internal-pages)
- [GreenAI Commands](#-greenai-commands)
- [Theming](#-theming)
- [Project Structure](#-project-structure)
- [Building for Production](#-building-for-production)
- [Roadmap](#-roadmap)
- [Credits](#-credits)

---

## 🌍 Overview

**GreenBrowser** is an advanced, privacy-first web browsing interface prototype explicitly designed to simulate zero-telemetry navigation environments. It is developed under the direct authorization of the **European Fire Prevention & Rural Preservation Organization (EFPPR)** as a digital manifesto demonstrating low-carbon code footprints and clean technological innovation.

> *"Build the new way • Protect the old way"*

The browser runs entirely on local JavaScript within your isolated desktop environment — no remote indexing, no metadata logging, no upstream tracking. When you close the window, GreenBrowser forgets you.

---

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 🔍 Multi-Engine Search
Three integrated search engines accessible via toolbar toggles:
- **Google** — Full web search via `google.com/search`
- **Wikipedia** — Direct encyclopedia lookups
- **GreenSearch** — Internal routing to built-in documentation pages

Toggle between **Search Mode** and **URL Mode** using the magnifying glass / link icon to reveal or mask the raw URL.

</td>
<td width="50%">

### 📑 Tabbed Browsing
Full tab management with a modern Chrome-inspired interface:
- Drag-and-drop tab reordering
- Dynamic tab creation and closure
- Per-tab state tracking (URL, query, title)
- macOS-style window control dots (close, minimize, maximize)

</td>
</tr>
<tr>
<td>

### 🔖 Bookmark Manager
A powerful sidebar-based bookmark system:
- **Create folders** with custom names and colors
- **One-click bookmarking** of the active tab
- **Quick-add** to any folder via dropdown selector
- **Star button** for instant Default folder saves
- **Rename & Delete** folders via inline action buttons
- Fully rendered via native DOM (no innerHTML injection)

</td>
<td>

### 🤖 GreenAI Assistant
An offline-first AI assistant powered by a local RAG engine:
- Natural language queries against a local knowledge base (`ai-context.txt`)
- **Live Weather** — `ai:weather London` fetches real-time data from OpenMeteo
- **Currency Conversion** — `ai:conv USD/EUR` fetches live exchange rates
- **Local Time** — `ai:time now here` returns system clock
- Draggable floating widget with chat-style UI

</td>
</tr>
<tr>
<td>

### 🎵 Media Dock
A dockable media sidebar for embedded playback:
- **Drag any tab** onto the dock to embed it as a mini-player
- Dedicated playback controls (play/pause, skip)
- Eject & close controls for dock management
- Drag-over visual feedback with green accent highlighting

</td>
<td>

### 📝 Floating Notes
A draggable, glassmorphic sticky notes widget:
- Free-form text area with auto-save to `localStorage`
- One-click clear with trash button
- Persistent across sessions until manually cleared
- Smooth drag positioning anywhere on screen

</td>
</tr>
</table>

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Shell (Win32)                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  Chromium / V8 Runtime                 │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │              GreenBrowser Frontend               │  │  │
│  │  │                                                  │  │  │
│  │  │  ┌──────────┐ ┌────────────┐ ┌───────────────┐  │  │  │
│  │  │  │  Tab Mgr  │ │  Omnibox   │ │  Extensions   │  │  │  │
│  │  │  └──────────┘ └────────────┘ └───────────────┘  │  │  │
│  │  │                                                  │  │  │
│  │  │  ┌──────────┐ ┌────────────┐ ┌───────────────┐  │  │  │
│  │  │  │ Bookmarks│ │ Media Dock │ │   GreenAI     │  │  │  │
│  │  │  │ Sidebar  │ │  Sidebar   │ │  RAG Engine   │  │  │  │
│  │  │  └──────────┘ └────────────┘ └───────────────┘  │  │  │
│  │  │                                                  │  │  │
│  │  │  ┌──────────────────────────────────────────────┐│  │  │
│  │  │  │          iframe Viewport Container           ││  │  │
│  │  │  │   (sandboxed: scripts, forms, popups)        ││  │  │
│  │  │  └──────────────────────────────────────────────┘│  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  electron-main.cjs                                           │
│  ├── BrowserWindow with webSecurity: false                   │
│  ├── X-Frame-Options header stripping                        │
│  └── CSP override for cross-origin iframe embedding          │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Input → Omnibox → Engine Router ─┬── Google Search (iframe)
                                       ├── Wikipedia Search (iframe)
                                       ├── GreenSearch (internal pages)
                                       └── Direct URL (iframe)

GreenAI Input → Query Parser ─┬── ai:weather → OpenMeteo Geocoding + Forecast API
                               ├── ai:conv   → Open Exchange Rate API
                               ├── ai:time   → Local Date/Time
                               └── Natural   → RAG against ai-context.txt
```

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Electron 28 | Desktop application shell, Chromium renderer |
| **Build** | Vite 8 | Lightning-fast HMR dev server & production bundling |
| **Frontend** | Vanilla JS + HTML5 | Zero-dependency UI logic, native DOM manipulation |
| **Styling** | Vanilla CSS | Custom design system with CSS custom properties |
| **Typography** | Inter, Google Sans Flex | Premium web fonts via Google Fonts |
| **Icons** | Material Symbols Outlined | Google's variable icon font |
| **Weather API** | Open-Meteo | Free geocoding + weather forecast data |
| **Exchange API** | ExchangeRate-API | Live currency conversion rates |
| **Packaging** | electron-builder | NSIS installer generation for Windows |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- Windows 10/11 (for Electron builds)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/greenbrowser.git
cd greenbrowser

# Install dependencies
npm install
```

### Development

```bash
# Start the Vite dev server (web mode)
npm run dev

# Start with Electron wrapper (desktop mode)
npm run dev:electron
```

The dev server launches at `http://localhost:5173`. In Electron mode, the app window opens automatically once the Vite server is ready.

---

## 📘 Usage Guide

### 🔎 Search & Navigation

| Action | How |
|--------|-----|
| **Search the web** | Type a query in the omnibox and press `Enter` |
| **Navigate to URL** | Click the 🔍 icon to switch to **URL Mode** (🔗), then type a direct address |
| **Switch engines** | Click the engine toggles on the right side of the omnibox: 🌐 Google · 🌍 Wikipedia · 🌿 GreenSearch |
| **View raw URL** | Click the magnifying glass icon — it transforms to a link icon and reveals the full URL |

### 📑 Tab Management

| Action | How |
|--------|-----|
| **New tab** | Click the `+` button in the tab bar |
| **Close tab** | Click the `×` on any tab |
| **Switch tabs** | Click on the desired tab |
| **Dock a tab** | Drag any tab and drop it onto the Media Dock sidebar |

### 🔖 Bookmarks

1. Click the **☰ Side Navigation** button (top-left) to open the sidebar
2. Type a folder name, pick a color, and click the folder icon to create a group
3. Select a folder from the dropdown and click **Bookmark Add** to save the current tab
4. Use the ⭐ star button in the omnibox for quick saves to the Default folder
5. Click the 🗑 trash icon to instantly delete any folder

### 🎵 Media Dock

1. Open **Extensions** → **Music Dock** to reveal the sidebar
2. Drag any active tab over to the dock area
3. The tab's iframe embeds directly into the mini-player
4. Use ⏮ ▶ ⏭ controls for playback
5. Click **Eject** to clear, or **Close** to hide the dock

### 📝 Notes

1. Open **Extensions** → **Notes App**
2. A floating, draggable widget appears
3. Type freely — all content saves to `localStorage` automatically
4. Click the 🗑 icon to clear the note

---

## 🏠 Internal Pages

GreenBrowser includes a set of built-in pages accessible via the `greenbrowser:` protocol:

| URL | Page | Description |
|-----|------|-------------|
| `greenbrowser:welcome` | Welcome | First-run onboarding with feature overview and navigation links |
| `greenbrowser:help` | Help Center | Guidance on using GreenAI and browser features |
| `greenbrowser:privacy` | Privacy Policy | Full data handling and zero-telemetry privacy policy |
| `greenbrowser:tos` | Terms of Service | EFPPR service terms and warranties |
| `greenbrowser:roadmap` | Strategic Roadmap | Planned Phase 1 & Phase 2 development milestones |
| `greenbrowser:changelog` | Release Notes | Patch notes for current version (v9.0.5) |
| `greenbrowser:credits` | Credits | Full-screen hero credits page with EFPPR branding |
| `greenbrowser:source` | Source Architecture | Technical stack description |
| `greenbrowser:hello` | Hello World | System status check page |

> **Tip:** Type `greensearch` in the engine toggle and search for any page name (e.g., `help`) to route there automatically.

---

## 🤖 GreenAI Commands

GreenAI operates as a local knowledge base assistant with live API extensions:

### Live Data Commands

```
ai:weather [city]        → Fetches real-time temperature and wind from OpenMeteo
ai:conv [BASE]/[TARGET]  → Fetches live exchange rate (e.g., ai:conv USD/EUR)
ai:time now here         → Returns local system date and time
```

### Natural Language Queries

Ask any question about GreenBrowser features and GreenAI will perform a keyword-match retrieval against the local `ai-context.txt` knowledge base:

```
"How do I manage bookmarks?"
"What is GreenSearch?"
"Tell me about EFPPR"
"How to use the music dock?"
```

### RAG Engine Details

The retrieval engine works by:
1. Loading `ai-context.txt` at query time
2. Splitting into paragraph blocks via `[SECTION]` markers
3. Tokenizing the user query (stop-word filtered)
4. Scoring each block by keyword intersection hits
5. Returning the highest-scoring block as the response

---

## 🎨 Theming

GreenBrowser ships with two built-in themes, togglable via the ☀️/🌙 button in the toolbar:

### 🌑 Dark Theme (Default — Antigravity)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-dark` | `#0a0e0c` | Page background |
| `--bg-frame` | `#111815` | Browser frame, sidebar |
| `--bg-tab` | `#1b2621` | Inactive tab fill |
| `--bg-omnibox` | `#24352f` | Search bar background |
| `--accent-green` | `#20E377` | Primary accent color |
| `--text-main` | `#e8f0ec` | Primary text |
| `--text-muted` | `#8aa89b` | Secondary text, icons |// — |

### ☀️ Light Theme

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-dark` | `#f0f4f2` | Page background |
| `--bg-frame` | `#ffffff` | Browser frame, sidebar |
| `--bg-tab` | `#e8ecea` | Inactive tab fill |
| `--bg-omnibox` | `#f2f7f4` | Search bar background |
| `--accent-green` | `#11a251` | Primary accent (adjusted) |
| `--text-main` | `#111815` | Primary text |
| `--text-muted` | `#5e7368` | Secondary text, icons |

---

## 📂 Project Structure

```
GreenBrowser/
├── index.html              # Main application entry (HTML structure)
├── main.js                 # Core application logic (tabs, nav, AI, bookmarks)
├── style.css               # Complete design system & component styles
├── electron-main.cjs       # Electron main process (window, CSP, headers)
├── vite.config.js          # Vite build configuration (relative base paths)
├── package.json            # Dependencies, scripts, electron-builder config
├── logo-efprp.png          # EFPPR organization logo
├── makeIcon.cjs            # PNG-to-ICO converter script for app icon
├── makeIcon.js             # ESM variant of icon converter
├── public/
│   ├── ai-context.txt      # GreenAI local knowledge base (RAG source)
│   ├── icon.png            # Application icon (used by NSIS installer)
│   ├── favicon.svg         # Browser favicon
│   └── icons.svg           # Additional icon assets
├── src/                    # Vite scaffold source (unused in production)
├── dist/                   # Vite production build output
└── dist-electron/          # Electron-builder packaged output (NSIS installer)
```

---

## 📦 Building for Production

### Web Build

```bash
# Generate optimized static files in /dist
npm run build
```

### Windows Desktop Installer

```bash
# Build Vite + Package with electron-builder (NSIS)
npm run build:electron
```

This produces a Windows NSIS installer in `dist-electron/` with:
- Custom desktop shortcut creation
- User-configurable install directory
- App ID: `com.efppr.greenbrowser`

### Electron-Builder Configuration

| Option | Value |
|--------|-------|
| Target | NSIS (Windows) |
| App ID | `com.efppr.greenbrowser` |
| Product Name | GreenBrowser |
| Icon | `public/icon.png` |
| One-Click Install | `false` |
| Custom Install Dir | `true` |
| Desktop Shortcut | `true` |

---

## 🗺 Roadmap

### Phase 1 — In Progress
- [x] Electron application wrapper for Win32 compilation
- [x] Live API integrations (weather, currency)
- [x] Local AI knowledge base (RAG engine)
- [x] Bookmark system with folders and colors
- [ ] System-level socket interceptors (ad-block over raw UDP)

### Phase 2 — Planned
- [ ] WebRTC media stream integrations inside native app bounds
- [ ] Native operating system hooks for Media Dock rendering
- [ ] Tracker Firewall module for domain-level blocking
- [ ] Extended GreenAI with deeper NLP capabilities

---

## 🔒 Privacy Philosophy

GreenBrowser is built on a foundational privacy-first architecture:

- **🚫 Zero Remote Indexing** — No home network pings, no metadata logging
- **🔐 Total Local Execution** — All logic runs via the local V8 engine
- **💾 LocalStorage Only** — Preferences and data stored in browser `localStorage` / WebStorage API
- **🛡 CORS Sandboxing** — Iframe navigation is sandboxed with strict `allow-same-origin allow-scripts allow-forms allow-popups`
- **🧹 No Persistence** — When you close the window, GreenBrowser forgets you

> *"In plain English: When you search, GreenBrowser routes you. When you close the window, we forget you. Fast."*

---

## 👤 Credits

<table>
<tr>
<td align="center" width="200">
<strong>Author</strong><br/>
Alexios ELIZALDE XIROKOSTA
</td>
<td align="center" width="400">
<strong>Organization</strong><br/>
European Fire Prevention & Rural Preservation Organization (EFPPR)
</td>
<td align="center" width="200">
<strong>Version</strong><br/>
<code>6.0.0</code> (Antigravity Theme)
</td>
</tr>
</table>

---

<p align="center">
  <img src="https://img.shields.io/badge/🌿_GreenBrowser-Build_the_new_way_•_Protect_the_old_way-20E377?style=for-the-badge&labelColor=0a0e0c" alt="GreenBrowser Tagline" />
</p>
