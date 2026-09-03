FROM node:20-slim

# Install VLC and MPV so the application can attempt to launch streams.
# Note: To see the VLC GUI from a Docker container, you must configure X11 display forwarding.
RUN apt-get update && apt-get install -y \
    vlc \
    mpv \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install blessed cheerio axios terminal-image sharp got

# Bundle app source
COPY . .

# Start the CLI app
CMD ["npm", "start"]
