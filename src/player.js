import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import axios from 'axios';

export async function playStream(streamUrl, title, resolution = 'Auto', subtitleUrl = null) {
  console.log(`\n▶️ Starting playback for: ${title} [${resolution}]`);
  console.log(`Stream URL: ${streamUrl}`);

  let localSubPath = null;
  if (subtitleUrl && subtitleUrl.startsWith('http')) {
    try {
      console.log(`⬇️ Downloading subtitles...`);
      const { data } = await axios.get(subtitleUrl);
      localSubPath = path.join(os.tmpdir(), 'anicat_sub.vtt');
      fs.writeFileSync(localSubPath, data);
      console.log(`✅ Subtitles loaded!`);
    } catch (e) {
      console.log(`⚠️ Failed to download subtitles: ${e.message}`);
    }
  }

  const mpvArgs = [
    streamUrl,
    `--force-media-title=${title}`,
    '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    '--referrer=https://anineko.to/',
    '--demuxer-max-bytes=1000M',
    '--demuxer-max-back-bytes=500M',
    '--cache=yes',
    '--cache-secs=300',
    '--force-seekable=yes',
    '--hr-seek=yes',
    '--hr-seek-framedrop=yes',
    '--hls-bitrate=max',
    '--stream-lavf-o=reconnect=1,reconnect_streamed=1,reconnect_delay_max=5'
  ];

  if (resolution !== 'Auto') {
    const resValue = resolution.replace('p', '');
    mpvArgs.push(`--ytdl-format=bestvideo[height<=${resValue}]+bestaudio/best`);
    mpvArgs.push(`--hls-bitrate=max`);
  }

  if (localSubPath) {
    mpvArgs.push(`--sub-file=${localSubPath}`);
    mpvArgs.push(`--sub-delay=1.0`);
  }

  return new Promise((resolve) => {
    const player = spawn('mpv', mpvArgs, {
      stdio: 'inherit'
    });

    player.on('error', (err) => {
      if (err.code === 'ENOENT') {
        console.log('⚠️ "mpv" not found. Trying "vlc"...');

        let vlcCommand = 'vlc';
        if (process.platform === 'win32') {
          if (fs.existsSync('C:\\Program Files\\VideoLAN\\VLC\\vlc.exe')) {
            vlcCommand = 'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe';
          } else if (fs.existsSync('C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe')) {
            vlcCommand = 'C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe';
          }
        }

        const vlcArgs = [
          streamUrl,
          '--meta-title', title,
          '--http-referrer=https://anineko.to/',
          '--http-user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          '--network-caching=60000',
          '--live-caching=60000',
          '--file-caching=60000',
          '--tcp-caching=60000',
          '--http-reconnect',
          '--http-continuous',
          '--repeat'
        ];
        if (resolution !== 'Auto') {
          const resValue = resolution.replace('p', '');
          vlcArgs.push(`--preferred-resolution=${resValue}`);
        }

        if (localSubPath) {
          vlcArgs.push(`--sub-file=${localSubPath}`);
          vlcArgs.push(`--sub-delay=10`);
        }

        const vlcPlayer = spawn(vlcCommand, vlcArgs, { stdio: 'inherit' });

        vlcPlayer.on('error', (vlcErr) => {
          if (vlcErr.code === 'ENOENT') {
            console.log('⚠️ "vlc" not found either. Opening in default browser...');
            spawn('cmd', ['/c', 'start', '""', streamUrl], { stdio: 'ignore', detached: true }).unref();
            resolve();
          } else {
            console.log(`❌ VLC Error: ${vlcErr.message}`);
            resolve();
          }
        });

        vlcPlayer.on('close', (code) => {
          if (code !== -4058) console.log(`Playback closed with code ${code}`);
          resolve();
        });
      } else {
        console.log(`❌ Failed to start player: ${err.message}`);
        resolve();
      }
    });

    player.on('close', (code) => {
      if (code !== -4058) {
        console.log(`Playback closed with code ${code}`);
      }
      resolve();
    });
  });
}
