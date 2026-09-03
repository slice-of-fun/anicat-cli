#!/bin/bash

# Define colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${YELLOW}   /\\___/\\            ${CYAN}  ▶  ANI-CAT CLI${NC}"
echo -e "${YELLOW}  ( o^..^o )          ${CYAN}  ══════════════════════════════${NC}"
echo -e "${YELLOW}  (  (__)   )         ${NC}  Stream anime from your terminal!"
echo -e "${YELLOW}  ) ~~~~~~ (          ${NC}"
echo -e "${YELLOW}  '--------'${NC}"
echo ""

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Error: npm is required but not installed. Please install Node.js.${NC}"
    exit 1
fi

INSTALL_DIR="$HOME/.ani-cat"
ZIP_URL="https://github.com/slice-of-fun/anicat-cli/archive/refs/heads/main.zip"
TMP_DIR="/tmp/ani-cat-install"
ZIP_FILE="/tmp/ani-cat.zip"

echo -e "⏳ [1/4] ${YELLOW}Downloading source code...${NC}"
curl -sL "$ZIP_URL" -o "$ZIP_FILE"

echo -e "⏳ [2/4] ${YELLOW}Extracting files...${NC}"
rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR"
unzip -q "$ZIP_FILE" -d "$TMP_DIR"

if [ -d "$INSTALL_DIR" ]; then
    rm -rf "$INSTALL_DIR"
fi

mv "$TMP_DIR"/* "$INSTALL_DIR"

echo -e "⏳ [3/4] ${YELLOW}Installing dependencies (No Warnings)...${NC}"
cd "$INSTALL_DIR"
npm install --silent --no-fund > /dev/null 2>&1

echo -e "⏳ [4/4] ${YELLOW}Linking global command...${NC}"
npm link --silent > /dev/null 2>&1

# Cleanup
rm -f "$ZIP_FILE"
rm -rf "$TMP_DIR"

echo ""
echo -e "${GREEN}✅ anicat-cli installed successfully!${NC}"
echo -e "${GREEN}🎮 Run 'anicat-cli' from your terminal to start streaming!${NC}"
echo ""
