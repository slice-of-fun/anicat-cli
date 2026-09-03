<div align="center">
  
# 🐱 Ani-Cat CLI

**A blazing fast, terminal-based anime browser and streamer built in Node.js.**

[![Node.js](https://img.shields.io/badge/Node.js-Ready-success.svg?logo=node.js)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

**Ani-Cat** brings the entire anime streaming experience directly to your terminal. Easily search for your favorite anime, view high-quality cover art rendered right in the command line, browse episodes, and instantly launch them in your desktop media player (VLC or MPV) with full resolution support!

## ✨ Features

- **📺 Terminal UI**: A beautiful, interactive command-line interface powered by `blessed`.
- **🖼️ High-Res Cover Art**: Fetches official cover art from the AniList API and natively renders it inside your terminal.
- **⚡ Instant Streaming**: Parses master `m3u8` playlists to stream your preferred resolution (1080p, 720p, etc.) instantly, entirely bypassing adaptive bitrate delays.
- **🗣️ Sub & Dub Support**: Easily choose between subtitled or dubbed episodes on the fly.
- **🕵️ Dynamic Scraper**: Robust scraping engine that cleanly bypasses link obfuscation.
- **🖥️ Desktop Integration**: Automatically forwards video streams to your local VLC or MPV media player.

---

## 📋 Prerequisites

Before installing, you must have the following installed on your system:
1. **[Node.js](https://nodejs.org/)** (v16 or higher)
2. **[VLC Media Player](https://www.videolan.org/vlc/)** OR **[mpv](https://mpv.io/)**

---

## 🚀 Installation

### Option 1: Install via NPM (Easiest)
If you have Node.js installed, you can instantly install the CLI globally directly from the NPM registry:

```bash
npm install -g anicat-cli
```

### Option 2: One-Line Install from GitHub
You can also install `anicat-cli` globally on your system directly from GitHub. This will automatically download the latest release, extract it, install all dependencies, and link the commands globally without needing `git`!

**On Windows (PowerShell):**
```powershell
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/slice-of-fun/anicat-cli/main/install.ps1" -UseBasicParsing | Invoke-Expression
```

**On Mac / Linux:**
```bash
curl -sL https://raw.githubusercontent.com/slice-of-fun/anicat-cli/main/install.sh | bash
```

Once installed, simply type `anicat-cli` from any folder in your terminal to launch the app!

### Option 3: Manual Local Setup (For Development)
If you prefer to run it locally or want to contribute:
1. Download or clone this repository.
2. Install dependencies: Run `npm install blessed cheerio axios terminal-image sharp got`
3. Launch the app using `npm start`.

---

## 🎮 Usage & Controls

Launch the app from anywhere by typing:
```bash
anicat-cli
```

- `Tab`: Switch focus between the Search Bar, Anime List, and Episode List.
- `Enter`: Select an item or execute a search.
- `Up/Down Arrows`: Navigate through lists.
- `C-c` / `q` / `Esc`: Quit the application safely.

---

## 🐳 Docker Support

If you prefer containerized environments, a `Dockerfile` is included. It comes pre-packaged with Node.js, `vlc`, and `mpv`.

```bash
docker build -t ani-cat .
docker run -it ani-cat
```
> **⚠️ Important Note:** Since `anicat-cli` launches a GUI desktop media player (VLC/MPV) to play video streams, running it inside a Docker container requires you to configure **X11 display forwarding** (or a similar protocol) to push the GUI out of the headless Linux container to your host OS. Because of this, installing directly via Option 1 is highly recommended.

---

## 🛠️ Built With

This project relies on the following incredible open-source libraries:
- [blessed](https://www.npmjs.com/package/blessed) - Advanced terminal interface API.
- [cheerio](https://www.npmjs.com/package/cheerio) & [axios](https://www.npmjs.com/package/axios) - Fast, flexible, and elegant core scraping.
- [terminal-image](https://www.npmjs.com/package/terminal-image) & [sharp](https://www.npmjs.com/package/sharp) - High-performance image rendering in the CLI.
- [got](https://www.npmjs.com/package/got) - Robust HTTP request library for asset fetching.
