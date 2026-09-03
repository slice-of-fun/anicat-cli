<div align="center">
  
# 🐱 Ani-Cat CLI

**A blazing fast, terminal-based anime browser and streamer built in Node.js.**

[![Node.js](https://img.shields.io/badge/Node.js-Ready-success.svg?logo=node.js)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

**Ani-Cat** brings the entire anime streaming experience directly to your terminal. Easily search for your favorite anime, view high-quality cover art rendered right in the command line, browse episodes, and instantly launch them in your desktop media player (VLC or MPV) with full resolution support!

## ✨ Features

- **📺 Terminal UI**: A beautiful, interactive command-line interface powered by `blessed` with a dynamic layout that smoothly transitions between search results and episode lists.
- **🖼️ High-Res Cover Art**: Fetches official cover art from the AniList API and natively renders it inside your terminal — auto-loading the first result the moment your search completes.
- **⚡ Instant Streaming**: Parses master `m3u8` playlists to stream your preferred resolution (1080p, 720p, etc.) instantly, entirely bypassing adaptive bitrate delays.
- **🗣️ Sub & Dub Support**: Easily choose between subtitled or dubbed episodes on the fly.
- **🔤 Smart Subtitles**: Automatically uses **Hard Sub** (burned-in, perfect sync) when available. Falls back to **Soft Sub** with a perfectly matched subtitle track loaded directly in the player — just like a web player.
- **🕵️ Dynamic Scraper**: Robust scraping engine that cleanly bypasses link obfuscation across all anime servers.
- **🖥️ Desktop Integration**: Automatically forwards video streams to your local VLC or MPV media player with large pre-buffering to eliminate stuttering on fast connections.

---

## 📋 Prerequisites

Before installing, you must have the following installed on your system:
1. **[Node.js](https://nodejs.org/)** (v16 or higher)
2. **[VLC Media Player](https://www.videolan.org/vlc/)** OR **[mpv](https://mpv.io/)**

---

## 🚀 Installation

### One-Line Install
Install `anicat-cli` globally on your system directly from GitHub. This will automatically download the latest release, extract it, install all dependencies, and link the command globally — no `git` required!

**On Windows (PowerShell):**
```powershell
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/slice-of-fun/anicat-cli/main/install.ps1" -UseBasicParsing | Invoke-Expression
```

**On Mac / Linux:**
```bash
curl -sL https://raw.githubusercontent.com/slice-of-fun/anicat-cli/main/install.sh | bash
```

Once installed, simply type `anicat-cli` from any folder in your terminal to launch the app!

### Manual Local Setup (For Development)
If you prefer to run it locally or want to contribute:
1. Download or clone this repository.
2. Install dependencies: Run `npm install`
3. Launch the app using `npm start`.

---

## 🎮 Usage & Controls

Launch the app from anywhere by typing:
```bash
anicat-cli
```

| Key | Action |
|---|---|
| `s` | Jump to the Search Bar |
| `Enter` | Select item / execute search |
| `↑ / ↓` | Navigate through lists |
| `Tab` | Cycle focus between panels |
| `🔙 Go Back to Search` | Return to your search results from the episode list |
| `q` / `Esc` / `Ctrl+C` | Quit the application |

---

## 🐳 Docker Support

If you prefer containerized environments, a `Dockerfile` is included. It comes pre-packaged with Node.js, `vlc`, and `mpv`.

```bash
docker build -t ani-cat .
docker run -it ani-cat
```
> **⚠️ Important Note:** Since `anicat-cli` launches a GUI desktop media player (VLC/MPV) to play video streams, running it inside a Docker container requires you to configure **X11 display forwarding** (or a similar protocol) to push the GUI out of the headless Linux container to your host OS.

---

## 🛠️ Built With

This project relies on the following incredible open-source libraries:
- [blessed](https://www.npmjs.com/package/blessed) - Advanced terminal interface API.
- [cheerio](https://www.npmjs.com/package/cheerio) & [axios](https://www.npmjs.com/package/axios) - Fast, flexible, and elegant core scraping.
- [terminal-image](https://www.npmjs.com/package/terminal-image) & [sharp](https://www.npmjs.com/package/sharp) - High-performance image rendering in the CLI.
- [got](https://www.npmjs.com/package/got) - Robust HTTP request library for asset fetching.
