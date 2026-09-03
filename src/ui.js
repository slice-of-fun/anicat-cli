import blessed from 'blessed';
import { searchAnime, getEpisodes, getStreamUrl, getAvailableResolutions, getExactResolutionUrl } from './scraper.js';
import { fetchAnimeDetails } from './art.js';
import { playStream } from './player.js';
import terminalImage from 'terminal-image';
import got from 'got';
import sharp from 'sharp';

export async function startApp() {
  const screen = blessed.screen({
    smartCSR: true,
    title: 'Ani-Cat CLI 🐱',
    fullUnicode: true
  });
  const header = blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: 3,
    content: ' 🐱 Ani-Cat CLI | Search, Browse & Stream Anime ',
    style: {
      fg: 'yellow',
      bg: 'black',
      bold: true,
      border: { fg: 'orange' }
    },
    border: { type: 'line' }
  });
  const leftPane = blessed.box({
    top: 3,
    left: 0,
    width: '42%',
    height: '100%-3',
    label: ' Details ',
    border: { type: 'line' },
    style: {
      border: { fg: 'orange' },
      label: { fg: 'yellow', bold: true }
    },
    tags: true,
    scrollable: true,
    alwaysScroll: true
  });
  const rightPane = blessed.box({
    top: 3,
    left: '42%',
    width: '58%',
    height: '100%-3',
    border: { type: 'line' },
    style: {
      border: { fg: 'yellow' }
    }
  });
  const searchInput = blessed.textbox({
    parent: rightPane,
    top: 0,
    left: 0,
    width: '100%-2',
    height: 3,
    label: ' Search Anime (Press Enter) ',
    border: { type: 'line' },
    style: {
      fg: 'yellow',
      border: { fg: 'orange' },
      focus: { border: { fg: 'yellow' } }
    },
    inputOnFocus: true
  });
  const animeList = blessed.list({
    parent: rightPane,
    top: 3,
    left: 0,
    width: '100%-2',
    height: '100%-5',
    label: ' Search Results (Press Enter to select) ',
    border: { type: 'line' },
    keys: true,
    vi: true,
    mouse: true,
    style: {
      border: { fg: 'orange' },
      selected: { bg: 'yellow', fg: 'black', bold: true },
      item: { fg: 'white' },
      label: { fg: 'orange', bold: true }
    }
  });
  const epList = blessed.list({
    parent: rightPane,
    top: 3,
    left: 0,
    width: '100%-2',
    height: '100%-5',
    label: ' Episodes (Press Enter to Play) ',
    border: { type: 'line' },
    keys: true,
    vi: true,
    mouse: true,
    hidden: true,
    style: {
      border: { fg: 'orange' },
      selected: { bg: 'orange', fg: 'black', bold: true },
      item: { fg: 'white' },
      label: { fg: 'yellow', bold: true }
    }
  });

  screen.append(header);
  screen.append(leftPane);
  screen.append(rightPane);

  let currentSearchResults = [];
  let currentEpisodes = [];
  let selectedAnimeItem = null;
  let selectedEpisodeItem = null;
  let selectedEpisodeIndex = 0;
  let currentStreamUrl = null;
  let currentSubtitleUrl = null;
  let currentResolutions = [];
  let uiMode = 'search';

  async function updateLeftPane(anime) {
    if (!anime) return;
    leftPane.setContent('{yellow-fg}{bold}Loading details...{/yellow-fg}{/bold}');
    screen.render();

    let details = await fetchAnimeDetails(anime.title);
    let coverUrl = details.coverUrl || (anime.poster && !anime.poster.startsWith('/') ? anime.poster : null);

    let infoText = `{yellow-fg}{bold}${anime.title}{/yellow-fg}{/bold}\n`;
    if (details.averageScore) infoText += `{cyan-fg}Score:{/cyan-fg} ${details.averageScore}%\n`;
    if (details.genres.length > 0) infoText += `{cyan-fg}Genres:{/cyan-fg} ${details.genres.join(', ')}\n`;
    infoText += `{cyan-fg}Sub Episodes:{/cyan-fg} ${anime.sub || '0'}\n`;
    infoText += `{cyan-fg}Dub Episodes:{/cyan-fg} ${anime.dub || '0'}\n\n`;

    let desc = (details.description || '').replace(/<[^>]+>/g, '').trim();
    if (desc) {
      infoText += `{white-fg}${desc}{/white-fg}\n\n`;
    }

    if (coverUrl) {
      try {
        let imageBuffer = await got(coverUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          timeout: { request: 10000 }
        }).buffer();

        imageBuffer = await sharp(imageBuffer).png().toBuffer();

        const renderedArt = await terminalImage.buffer(imageBuffer, { height: '30%', preserveAspectRatio: true });
        leftPane.setContent(`${renderedArt}\n\n${infoText}`);
      } catch (err) {
        leftPane.setContent(`{red-fg}Could not render cover image: ${err.message}{/red-fg}\n\n${infoText}`);
      }
    } else {
      leftPane.setContent(`{red-fg}No cover art found.{/red-fg}\n\n${infoText}`);
    }
    screen.render();
  }

  async function loadEpisodesForAnime(anime) {
    if (!anime) return;
    selectedAnimeItem = anime;
    uiMode = 'episodes';

    epList.setLabel(` Episodes for: ${anime.title} (Fetching...) `);
    epList.setItems(['Loading episode list...']);
    animeList.hide();
    epList.show();
    screen.render();

    const subCount = parseInt(anime.sub) || 0;
    const dubCount = parseInt(anime.dub) || 0;
    const maxEpisodes = Math.max(subCount, dubCount);

    if (maxEpisodes > 0) {
      currentEpisodes = [];
      for (let i = 1; i <= maxEpisodes; i++) {
        currentEpisodes.push({
          name: `Episode ${i}`,
          url: `${anime.url}/ep-${i}`
        });
      }
    } else {
      currentEpisodes = await getEpisodes(anime.url);
    }

    if (currentEpisodes.length === 0) {
      epList.setLabel(` Episodes for: ${anime.title} (0 Episodes) `);
      epList.setItems(['No episodes available.', '🔙 Go Back to Search']);
    } else {
      epList.setLabel(` Episodes for: ${anime.title} (${currentEpisodes.length} Total) `);
      const items = currentEpisodes.map((ep, i) => `[${i + 1}/${currentEpisodes.length}] ${ep.name}`);
      items.push('🔙 Go Back to Search');
      epList.setItems(items);
      epList.focus();
      epList.select(0);
    }
    screen.render();
  }
  searchInput.on('submit', async (value) => {
    if (!value.trim()) {
      searchInput.clearValue();
      screen.render();
      return;
    }
    uiMode = 'search';
    leftPane.setContent('{yellow-fg}Searching...{/yellow-fg}');
    animeList.setItems(['Searching...']);
    epList.setItems([]);
    epList.setLabel(' Episodes ');
    epList.hide();
    animeList.show();
    searchInput.clearValue();
    screen.render();

    currentSearchResults = await searchAnime(value);
    if (currentSearchResults.length === 0) {
      animeList.setItems(['No results found. Press "s" to search again.']);
      leftPane.setContent('{red-fg}No anime found.{/red-fg}');
      animeList.focus();
      screen.render();
      return;
    }

    const displayItems = currentSearchResults.map(item => `${item.title} (SUB: ${item.sub} | DUB: ${item.dub})`);
    animeList.setItems(displayItems);
    animeList.focus();
    animeList.select(0);
    screen.render();
    updateLeftPane(currentSearchResults[0]);
  });
  let detailsTimeout = null;

  animeList.on('select item', (item, index) => {
    const anime = currentSearchResults[index];
    if (anime) {
      if (detailsTimeout) clearTimeout(detailsTimeout);
      detailsTimeout = setTimeout(() => {
        updateLeftPane(anime);
      }, 400);
    }
  });

  animeList.on('select', (item, index) => {
    const anime = currentSearchResults[index];
    if (anime) {
      loadEpisodesForAnime(anime);
    }
  });

  function showLanguageSelectionForEpisode(anime, ep, index) {
    uiMode = 'language';
    selectedEpisodeItem = ep;
    selectedEpisodeIndex = index;
    epList.setLabel(` Play: ${ep.name} `);

    const options = [];
    const subCount = parseInt(anime.sub) || 0;
    const dubCount = parseInt(anime.dub) || 0;

    const epNumber = index + 1;

    if (subCount >= epNumber || anime.sub === '?') options.push(`📺 Watch Sub`);
    if (dubCount >= epNumber) options.push(`🎤 Watch Dub`);

    if (options.length === 0) {
      options.push(`📺 Watch`);
    }

    options.push(`🔙 Go Back to Episodes`);

    epList.setItems(options);
    epList.focus();
    epList.select(0);
    screen.render();
  }

  epList.on('select', async (item, index) => {
    if (uiMode === 'episodes') {
      const text = epList.items[index].getText();
      if (text.includes('Go Back to Search')) {
        uiMode = 'search';
        epList.hide();
        animeList.show();
        animeList.focus();
        screen.render();
        return;
      }
      const ep = currentEpisodes[index];
      if (ep) {
        showLanguageSelectionForEpisode(selectedAnimeItem, ep, index);
      }
      return;
    }

    if (uiMode === 'language') {
      const text = epList.items[index].getText();

      if (text.includes('Go Back')) {
        uiMode = 'episodes';
        epList.setLabel(` Episodes for: ${selectedAnimeItem.title} (${currentEpisodes.length} Total) `);
        const items = currentEpisodes.map((ep, i) => `[${i + 1}/${currentEpisodes.length}] ${ep.name}`);
        items.push('🔙 Go Back to Search');
        epList.setItems(items);
        epList.focus();
        screen.render();
        return;
      }

      if (!selectedEpisodeItem || !selectedAnimeItem) return;

      leftPane.setContent(`{yellow-fg}{bold}▶️ Fetching Stream...{/yellow-fg}{/bold}\n\n{cyan-fg}${selectedAnimeItem.title}{/cyan-fg}\n${selectedEpisodeItem.name} (${text.includes('Dub') ? 'DUB' : 'SUB'})`);
      screen.render();

      const streamType = text.includes('Dub') ? 'dub' : 'sub';
      const streamData = await getStreamUrl(selectedEpisodeItem.url, streamType);
      
      if (!streamData || !streamData.streamUrl) {
        leftPane.setContent(`{red-fg}{bold}❌ Error: Stream not found.{/red-fg}{/bold}\n\nCould not extract stream URL for this episode. The server might be down or using an unsupported format.`);
        screen.render();
        
        uiMode = 'episodes';
        epList.setLabel(` Episodes for: ${selectedAnimeItem.title} (${currentEpisodes.length} Total) `);
        const items = currentEpisodes.map((ep, i) => `[${i + 1}/${currentEpisodes.length}] ${ep.name}`);
        items.push('🔙 Go Back to Search');
        epList.setItems(items);
        epList.focus();
        screen.render();
        return;
      }

      currentStreamUrl = streamData.streamUrl;
      currentSubtitleUrl = streamData.subtitleUrl;
      currentResolutions = await getAvailableResolutions(currentStreamUrl);

      uiMode = 'resolution';
      epList.setLabel(` Select Resolution: ${selectedEpisodeItem.name} `);
      const options = currentResolutions.map(r => `⚙️ ${r}`);
      options.push(`🔙 Go Back`);

      epList.setItems(options);
      epList.focus();
      epList.select(0);

      leftPane.setContent(`{yellow-fg}{bold}▶️ Select Resolution{/yellow-fg}{/bold}\n\n{cyan-fg}${selectedAnimeItem.title}{/cyan-fg}\n${selectedEpisodeItem.name}`);
      screen.render();
      return;
    }

    if (uiMode === 'resolution') {
      const text = epList.items[index].getText();

      if (text.includes('Go Back')) {
        showLanguageSelectionForEpisode(selectedAnimeItem, selectedEpisodeItem, selectedEpisodeIndex);
        return;
      }

      if (!currentStreamUrl || !selectedAnimeItem) return;

      const resolution = text.replace('⚙️ ', '').trim();

      leftPane.setContent(`{yellow-fg}{bold}▶️ Launching Player...{/yellow-fg}{/bold}\n\n{cyan-fg}${selectedAnimeItem.title}{/cyan-fg}\n${selectedEpisodeItem.name} [${resolution}]`);
      screen.render();

      screen.leave();
      const exactStreamUrl = await getExactResolutionUrl(currentStreamUrl, resolution);
      await playStream(exactStreamUrl, `${selectedAnimeItem.title} - ${selectedEpisodeItem.name} [${resolution}]`, resolution, currentSubtitleUrl);

      screen.enter();
      screen.render();
    }
  });
  screen.key(['escape', 'q', 'C-c'], () => process.exit(0));
  screen.key(['s', 'S'], () => {
    searchInput.clearValue();
    searchInput.readInput();
    screen.render();
  });
  screen.key(['tab'], () => {
    if (screen.focused === searchInput) animeList.focus();
    else if (screen.focused === animeList) epList.focus();
    else searchInput.focus();
  });

  searchInput.focus();
  screen.render();
}
