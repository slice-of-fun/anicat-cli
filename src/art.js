import terminalImage from 'terminal-image';
import got from 'got';
import axios from 'axios';
function cleanTitleForSearch(title) {
  let cleaned = title.replace(/(Season|Part|Cour)\s*\d+/gi, '');
  cleaned = cleaned.replace(/Specials|Special|OVA|ONA|TV|Movie/gi, '');
  cleaned = cleaned.replace(/\(Dub\)|\(Sub\)/gi, '');
  cleaned = cleaned.replace(/[:\-]\s*$/g, '');
  return cleaned.trim();
}

async function fetchFromAnilist(title) {
  try {
    const query = `
      query ($search: String) {
        Media(search: $search, type: ANIME) {
          coverImage {
            extraLarge
            large
          }
          description(asHtml: false)
          averageScore
          genres
        }
      }
    `;
    const response = await axios.post('https://graphql.anilist.co', {
      query,
      variables: { search: title }
    }, { timeout: 5000 });

    const media = response.data?.data?.Media;
    if (media) {
      return {
        coverUrl: media.coverImage?.extraLarge || media.coverImage?.large,
        description: media.description,
        averageScore: media.averageScore,
        genres: media.genres || []
      };
    }
  } catch (err) {}
  return null;
}

async function fetchFromJikan(title) {
  try {
    const response = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1`, { timeout: 5000 });
    const media = response.data?.data?.[0];
    if (media) {
      return {
        coverUrl: media.images?.jpg?.large_image_url || media.images?.jpg?.image_url,
        description: media.synopsis,
        averageScore: media.score ? Math.round(media.score * 10) : null,
        genres: media.genres?.map(g => g.name) || []
      };
    }
  } catch (err) {}
  return null;
}

export async function fetchAnimeDetails(title) {
  const defaultDetails = {
    coverUrl: null,
    description: 'No description available.',
    averageScore: null,
    genres: []
  };

  // 1. Try exact title on Anilist
  let details = await fetchFromAnilist(title);
  if (details) return details;

  // 2. Try exact title on Jikan
  details = await fetchFromJikan(title);
  if (details) return details;

  // 3. Clean the title and try again (stripping "Season 2", "Specials", etc.)
  const cleanedTitle = cleanTitleForSearch(title);
  if (cleanedTitle && cleanedTitle !== title && cleanedTitle.length > 2) {
    details = await fetchFromAnilist(cleanedTitle);
    if (details) return details;

    details = await fetchFromJikan(cleanedTitle);
    if (details) return details;
    
    // 4. Absolute fallback: Just use the first 3-4 words of the cleaned title
    const shortTitle = cleanedTitle.split(' ').slice(0, 4).join(' ');
    if (shortTitle.length > 2) {
      details = await fetchFromAnilist(shortTitle);
      if (details) return details;
    }
  }

  return defaultDetails;
}

export async function displayCoverArt(imageUrl, title = '') {
  let urlToFetch = imageUrl;

  if (!urlToFetch || urlToFetch.startsWith('/')) {
    if (title) {
      const details = await fetchAnimeDetails(title);
      urlToFetch = details.coverUrl;
    }
  }

  if (!urlToFetch) {
    console.log('🖼️ No cover art available.');
    return;
  }

  try {
    const body = await got(urlToFetch).buffer();
    console.log(await terminalImage.buffer(body));
  } catch (err) {
    if (title && urlToFetch !== imageUrl) {
      const details = await fetchAnimeDetails(title);
      if (details.coverUrl) {
        try {
          const body = await got(details.coverUrl).buffer();
          console.log(await terminalImage.buffer(body));
          return;
        } catch (e) { }
      }
    }
    console.log('❌ Could not load cover art.');
  }
}
