#!/bin/bash
set -e

echo "=========================================="
echo " 🐱 Installing Ani-Cat CLI..."
echo "=========================================="

if ! command -v unzip &> /dev/null; then
    echo "❌ Error: unzip is required but not installed."
    exit 1
fi

if ! command -v curl &> /dev/null; then
    echo "❌ Error: curl is required but not installed."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is required but not installed. Please install Node.js."
    exit 1
fi

INSTALL_DIR="$HOME/.ani-cat"

ZIP_URL="https://github.com/slice-of-fun/anicat-cli/archive/refs/heads/main.zip"
TMP_DIR="/tmp/ani-cat-install"
ZIP_FILE="/tmp/ani-cat.zip"

echo "📥 Downloading latest release..."
curl -sL "$ZIP_URL" -o "$ZIP_FILE"

if [ -d "$INSTALL_DIR" ]; then
    echo "🔄 Removing old installation..."
    rm -rf "$INSTALL_DIR"
fi

echo "📂 Extracting files..."
rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR"
unzip -q "$ZIP_FILE" -d "$TMP_DIR"

mv "$TMP_DIR"/* "$INSTALL_DIR"

rm -rf "$TMP_DIR" "$ZIP_FILE"

cd "$INSTALL_DIR"

echo "📦 Installing dependencies..."
npm install blessed cheerio axios terminal-image sharp got

echo "🔗 Linking executable..."
npm link

echo ""
echo "✅ anicat-cli installed successfully!"
echo "🎮 Run 'anicat-cli' from your terminal to start streaming!"
