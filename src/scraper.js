import * as cheerio from 'cheerio';
import axios from 'axios';

const BASE_URL = 'https://anineko.to';

const client = axios.create({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5'
  }
});

export async function getAvailableResolutions(streamUrl) {
  const defaultRes = ['Auto'];
  try {
    if (!streamUrl.includes('.m3u8')) return defaultRes;

    const { data } = await client.get(streamUrl);
    const resolutions = ['Auto'];
    const lines = data.split('\n');

    lines.forEach(line => {
      const match = line.match(/RESOLUTION=\d+x(\d+)/);
      if (match) {
        const res = `${match[1]}p`;
        if (!resolutions.includes(res)) resolutions.push(res);
      }
    });

    return resolutions.length > 1 ? resolutions : defaultRes;
  } catch (err) {
    return defaultRes;
  }
}

export async function getExactResolutionUrl(streamUrl, resolution) {
  if (resolution === 'Auto' || !streamUrl.includes('.m3u8')) return streamUrl;

  try {
    const { data } = await client.get(streamUrl);
    const lines = data.split('\n');
    let targetIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/RESOLUTION=\d+x(\d+)/);
      if (match && `${match[1]}p` === resolution) {
        targetIndex = i + 1;
        break;
      }
    }

    if (targetIndex !== -1 && lines[targetIndex]) {
      const chunkUrl = lines[targetIndex].trim();
      if (chunkUrl.startsWith('http')) return chunkUrl;
      const baseUrl = streamUrl.substring(0, streamUrl.lastIndexOf('/') + 1);
      return baseUrl + chunkUrl;
    }
  } catch (err) {
    console.error('Error fetching specific resolution url:', err.message);
  }

  return streamUrl;
}

export async function searchAnime(query) {
  try {
    const url = `${BASE_URL}/browser?keyword=${encodeURIComponent(query)}`;
    const { data } = await client.get(url);
    const $ = cheerio.load(data);
    const results = [];

    $('.nv-anime-card').each((_, el) => {
      const title = $(el).find('.nv-anime-title a').text().trim();
      const href = $(el).find('.nv-anime-title a').attr('href');
      const poster = $(el).find('.nv-anime-thumb img').attr('src');
      const sub = $(el).find('.nv-stat-cc').text().trim().replace('CC ', '') || '0';
      const dub = $(el).find('.nv-stat-dub').text().trim() || '0';

      if (title && href) {
        results.push({
          title,
          url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
          poster: poster || '',
          sub,
          dub
        });
      }
    });

    return results;
  } catch (err) {
    console.error('Error searching anime:', err.message);
    return [];
  }
}

export async function getEpisodes(animeUrl) {
  try {
    const { data } = await client.get(animeUrl);
    const $ = cheerio.load(data);
    const episodes = [];

    $('a[href*="/episode/"], a[href*="/ep-"], .ep-list a, .episode-item a, .nv-info-episode-main').each((_, el) => {
      const name = $(el).text().trim() || `Episode ${episodes.length + 1}`;
      const href = $(el).attr('href');

      if (href) {
        episodes.push({
          name,
          url: href.startsWith('http') ? href : `${BASE_URL}${href}`
        });
      }
    });

    if (episodes.length === 0) {
      episodes.push({ name: 'Watch', url: animeUrl });
    }

    return episodes;
  } catch (err) {
    console.error('Error fetching episodes:', err.message);
    return [];
  }
}

export async function getStreamUrl(episodeUrl, streamType = 'sub') {
  try {
    const { data } = await client.get(episodeUrl);
    const $ = cheerio.load(data);

    let serverBtn;
    let subtitleUrl = null;

    if (streamType === 'sub') {
      const hsubBtn = $('.nv-server-grid[data-id="hsub"] .nv-server-btn.server-video').first();

      if (hsubBtn.length > 0) {
        serverBtn = hsubBtn;
      } else {
        const subBtn = $('.nv-server-grid[data-id="sub"] .nv-server-btn.server-video').first();
        const subDataVideo = subBtn.attr('data-video') || '';

        try {
          const subParam = new URL(subDataVideo.startsWith('http') ? subDataVideo : 'https:' + subDataVideo).searchParams.get('sub');
          if (subParam) {
            subtitleUrl = subParam;
          }
        } catch (_) {}

        serverBtn = subBtn;
      }
    } else {
      serverBtn = $(`.nv-server-grid[data-id="${streamType}"] .nv-server-btn.server-video`).first();
    }

    let iframeSrc = serverBtn.attr('data-video');

    if (!iframeSrc) {
      throw new Error('No server found');
    }

    if (!iframeSrc.startsWith('http')) {
      iframeSrc = 'https:' + iframeSrc;
    }

    const iframeBaseUrl = iframeSrc.split('?')[0];

    const iframeRes = await axios.get(iframeBaseUrl, {
      headers: { Referer: 'https://anineko.to/' }
    });

    const iframeHtml = iframeRes.data;
    const iframe$ = cheerio.load(iframeHtml);

    let m3u8Url = null;

    if (iframeBaseUrl.includes('bibiemb') || iframeBaseUrl.includes('playmogo') || iframeHtml.includes('m3u8')) {
      try {
        let m3u8Matches = iframeHtml.match(/https?:\/\/[^"'\s>]+\.m3u8[^"'\s>]*/gi);

        if (m3u8Matches && m3u8Matches.length > 0) {
          m3u8Url = m3u8Matches[0];
        } else {
          const unpacked = unpackDeanEdwards(iframeHtml);
          if (unpacked) {
            m3u8Matches = unpacked.match(/https?:\/\/[^"'\s>]+\.m3u8[^"'\s>]*/gi);
            if (m3u8Matches && m3u8Matches.length > 0) {
              m3u8Url = m3u8Matches[0];
            }
          }
        }

        if (m3u8Url) {
          return { streamUrl: m3u8Url, subtitleUrl };
        }
      } catch (iframeErr) {
        console.error('Error fetching iframe for stream extraction:', iframeErr.message);
      }

      return { streamUrl: iframeBaseUrl, subtitleUrl };
    }

    const videoSrc = iframe$('video source').attr('src') || iframe$('video').attr('src');
    if (videoSrc) {
      return { streamUrl: videoSrc, subtitleUrl };
    }

    throw new Error('No stream found on episode page');
  } catch (err) {
    console.error('Error extracting stream URL:', err.message);
    return { streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', subtitleUrl: null };
  }
}

function unpackDeanEdwards(html) {
  const packedRegex = /eval\s*\(\s*function\s*\(\s*p\s*,\s*a\s*,\s*c\s*,\s*k\s*,\s*e\s*,\s*[r|d]\s*\)\s*\{[\s\S]*?return\s+p\s*\}\s*\(\s*['"]([\s\S]*?)['"]\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*['"]([\s\S]*?)['"]\.split\s*\(\s*['"]\|['"]\s*\)/i;
  const match = html.match(packedRegex);
  if (!match) return null;

  let p = match[1];
  const a = parseInt(match[2], 10);
  const c = parseInt(match[3], 10);
  const k = match[4].split('|');

  let count = c;
  while (count--) {
    if (k[count]) {
      const baseN = count.toString(a);
      const reg = new RegExp('\\b' + baseN + '\\b', 'g');
      p = p.replace(reg, k[count]);
    }
  }
  return p;
}
