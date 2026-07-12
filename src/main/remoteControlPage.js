/**
 * Self-contained mobile remote-control page for FreeTube.
 * No external resources are loaded (no CDN scripts/styles/fonts), so it
 * works fully offline over the LAN and satisfies a strict same-origin CSP.
 */
export function getRemoteControlPageHtml(nonce) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>FreeTube Remote</title>
<style nonce="${nonce}">
  :root {
    color-scheme: light dark;
    --bg: #f4f4f5;
    --card: #ffffff;
    --text: #18181b;
    --muted: #71717a;
    --accent: #d92929;
    --border: #e4e4e7;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #121214;
      --card: #1c1c1f;
      --text: #f4f4f5;
      --muted: #a1a1aa;
      --border: #2c2c30;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
    padding-bottom: 2rem;
  }
  header {
    padding: 0.85rem 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
    background: var(--bg);
    z-index: 10;
  }
  header h1 { font-size: 1.05rem; margin: 0; }
  #status {
    font-size: 0.8rem;
    color: var(--muted);
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
  #status .dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: var(--muted);
  }
  #status.connected .dot { background: #22c55e; }
  #status.disconnected .dot { background: var(--accent); }
  main { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
  .card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    padding: 1rem;
  }
  #nowPlayingCard { display: none; }
  #nowPlayingCard.active { display: block; }
  #npRow { display: flex; gap: 0.75rem; align-items: center; }
  #npThumb {
    width: 4.5rem;
    height: 2.5rem;
    object-fit: cover;
    border-radius: 0.4rem;
    background: var(--bg);
    flex-shrink: 0;
  }
  #npTitle {
    font-size: 0.9rem;
    line-height: 1.25;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .controls { display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-top: 0.9rem; }
  button.iconBtn {
    border: none;
    background: var(--accent);
    color: #fff;
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    font-size: 1.1rem;
    flex-shrink: 0;
  }
  button.iconBtn.secondary {
    background: var(--bg);
    color: var(--text);
    border: 1px solid var(--border);
    width: 2.6rem;
    height: 2.6rem;
    font-size: 0.75rem;
    font-weight: 600;
  }
  button.iconBtn:active { opacity: 0.7; }
  button.iconBtn:disabled { opacity: 0.4; }
  input[type="range"] { width: 100%; }
  .rangeRow { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: var(--muted); margin-top: 0.6rem; }
  .rangeRow input { flex: 1; }
  button.muteBtn {
    border: none;
    background: transparent;
    color: var(--text);
    font-size: 1.1rem;
    padding: 0;
    width: 1.5rem;
    flex-shrink: 0;
  }
  body.disconnected .controls button,
  body.disconnected .rangeRow input,
  body.disconnected .rangeRow button,
  body.disconnected #searchInput,
  body.disconnected #searchBtn,
  body.disconnected .result {
    opacity: 0.5;
    pointer-events: none;
  }
  form#searchForm { display: flex; gap: 0.5rem; }
  input#searchInput {
    flex: 1;
    padding: 0.6rem 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid var(--border);
    background: var(--card);
    color: var(--text);
    font-size: 0.95rem;
  }
  button#searchBtn {
    border: none;
    background: var(--accent);
    color: #fff;
    padding: 0 1.1rem;
    border-radius: 0.5rem;
    font-size: 0.95rem;
  }
  #results { display: flex; flex-direction: column; gap: 0.6rem; margin-top: 0.9rem; }
  .result {
    display: flex;
    gap: 0.6rem;
    align-items: center;
    padding: 0.5rem;
    border-radius: 0.5rem;
    cursor: pointer;
  }
  .result:active { background: var(--bg); }
  .result img {
    width: 5rem;
    height: 2.8rem;
    object-fit: cover;
    border-radius: 0.35rem;
    background: var(--bg);
    flex-shrink: 0;
  }
  .result .meta { min-width: 0; }
  .result .title {
    font-size: 0.85rem;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .result .author { font-size: 0.75rem; color: var(--muted); margin-top: 0.15rem; }
  #searchMessage { font-size: 0.8rem; color: var(--muted); margin-top: 0.5rem; }
  #tokenError { display: none; padding: 1rem; text-align: center; color: var(--muted); }
</style>
</head>
<body>
<header>
  <h1>FreeTube Remote</h1>
  <span id="status" class="disconnected"><span class="dot"></span><span id="statusText">Connecting…</span></span>
</header>

<div id="tokenError">Missing or invalid access link. Open FreeTube &gt; Settings &gt; Remote Control and scan the QR code again.</div>

<main id="app" style="display:none">
  <div id="nowPlayingCard" class="card">
    <div id="npRow">
      <img id="npThumb" alt="">
      <div id="npTitle">Nothing playing</div>
    </div>
    <div class="controls">
      <button type="button" id="skipBackBtn" class="iconBtn secondary" aria-label="Skip back 10 seconds">-10</button>
      <button type="button" id="playPauseBtn" class="iconBtn" aria-label="Play/Pause">&#9654;</button>
      <button type="button" id="skipFwdBtn" class="iconBtn secondary" aria-label="Skip forward 10 seconds">+10</button>
      <button type="button" id="fullscreenBtn" class="iconBtn secondary" aria-label="Toggle fullscreen">&#9974;</button>
    </div>
    <div class="rangeRow">
      <button type="button" id="muteBtn" class="muteBtn" aria-label="Mute/Unmute">&#128266;</button>
      <input type="range" id="volumeRange" min="0" max="100" value="100">
    </div>
    <div class="rangeRow">
      <span id="currentTimeLabel">0:00</span>
      <input type="range" id="seekRange" min="0" max="0" value="0">
      <span id="durationLabel">0:00</span>
    </div>
  </div>

  <div class="card">
    <form id="searchForm">
      <input type="text" id="searchInput" placeholder="Search videos" maxlength="100" autocomplete="off">
      <button type="submit" id="searchBtn">Go</button>
    </form>
    <div id="searchMessage"></div>
    <div id="results"></div>
  </div>
</main>

<script nonce="${nonce}">
(() => {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const token = params.get('t');

  if (!token) {
    document.getElementById('tokenError').style.display = 'block';
    return;
  }

  document.getElementById('app').style.display = 'flex';
  document.getElementById('app').style.flexDirection = 'column';
  // Controls start disabled until the first successful WS connection (see setStatus below).
  document.body.classList.add('disconnected');

  const statusEl = document.getElementById('status');
  const statusTextEl = document.getElementById('statusText');
  const npCard = document.getElementById('nowPlayingCard');
  const npThumb = document.getElementById('npThumb');
  const npTitle = document.getElementById('npTitle');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const skipBackBtn = document.getElementById('skipBackBtn');
  const skipFwdBtn = document.getElementById('skipFwdBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const muteBtn = document.getElementById('muteBtn');
  const volumeRange = document.getElementById('volumeRange');
  const seekRange = document.getElementById('seekRange');
  const currentTimeLabel = document.getElementById('currentTimeLabel');
  const durationLabel = document.getElementById('durationLabel');
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const searchMessage = document.getElementById('searchMessage');
  const resultsEl = document.getElementById('results');

  let lastPaused = true;
  let lastNonZeroVolume = 100;
  // While the user is dragging the seek/volume sliders we ignore incoming state
  // updates for that control, otherwise the slider would jump back mid-drag.
  let isSeeking = false;
  let isAdjustingVolume = false;
  let pendingRequestId = null;
  let ws = null;
  let reconnectDelay = 1000;

  /**
   * @param {number} totalSeconds
   * @returns {string} formatted as m:ss
   */
  const formatTime = (totalSeconds) => {
    const s = Math.max(0, Math.floor(totalSeconds || 0));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  };

  const vibrate = () => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  /**
   * @param {boolean} connected
   */
  const setStatus = (connected) => {
    statusEl.className = connected ? 'connected' : 'disconnected';
    statusTextEl.textContent = connected ? 'Connected' : 'Reconnecting…';
    // Disable all controls while disconnected, since sending a command would be a no-op anyway.
    document.body.classList.toggle('disconnected', !connected);
  };

  /**
   * @param {object} obj
   */
  const send = (obj) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(obj));
    }
  };

  const connect = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = protocol + '//' + window.location.host + '/ws?t=' + encodeURIComponent(token);
    ws = new WebSocket(url);

    ws.addEventListener('open', () => {
      setStatus(true);
      reconnectDelay = 1000;
    });

    ws.addEventListener('close', () => {
      setStatus(false);
      // Reconnect with capped exponential backoff, e.g. after the desktop app restarts.
      setTimeout(connect, reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay * 1.5, 8000);
    });

    ws.addEventListener('error', () => {
      ws.close();
    });

    ws.addEventListener('message', (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      handleMessage(msg);
    });
  };

  /**
   * @param {{ type: string, [key: string]: any }} msg
   */
  const handleMessage = (msg) => {
    if (!msg || typeof msg.type !== 'string') {
      return;
    }

    switch (msg.type) {
      case 'state':
        applyState(msg);
        break;
      case 'searchResults':
        if (msg.requestId === pendingRequestId) {
          renderResults(Array.isArray(msg.results) ? msg.results : []);
        }
        break;
      case 'searchError':
        if (msg.requestId === pendingRequestId) {
          searchMessage.textContent = typeof msg.message === 'string' ? msg.message : 'Search failed';
        }
        break;
    }
  };

  /**
   * @param {{ title?: string, thumbnail?: string, paused?: boolean, volume?: number, duration?: number, currentTime?: number }} state
   */
  const applyState = (state) => {
    if (state.title) {
      npCard.classList.add('active');
      npTitle.textContent = state.title;
    }

    if (typeof state.thumbnail === 'string' && state.thumbnail.indexOf('https://') === 0) {
      npThumb.src = state.thumbnail;
    }

    if (typeof state.paused === 'boolean') {
      lastPaused = state.paused;
      playPauseBtn.innerHTML = state.paused ? '&#9654;' : '&#10074;&#10074;';
    }

    if (typeof state.volume === 'number' && !isAdjustingVolume) {
      volumeRange.value = String(Math.round(state.volume));
      updateMuteIcon(state.volume);
      if (state.volume > 0) {
        lastNonZeroVolume = state.volume;
      }
    }

    if (typeof state.duration === 'number' && state.duration > 0) {
      seekRange.max = String(Math.floor(state.duration));
      durationLabel.textContent = formatTime(state.duration);
    }

    if (typeof state.currentTime === 'number' && !isSeeking) {
      seekRange.value = String(Math.floor(state.currentTime));
      currentTimeLabel.textContent = formatTime(state.currentTime);
    }
  };

  /**
   * @param {number} volume 0-100
   */
  const updateMuteIcon = (volume) => {
    muteBtn.textContent = volume > 0 ? '🔊' : '🔇';
  };

  playPauseBtn.addEventListener('click', () => {
    vibrate();
    send({ type: lastPaused ? 'play' : 'pause' });
  });

  /**
   * @param {number} deltaSeconds positive to skip forward, negative to rewind
   */
  const skip = (deltaSeconds) => {
    vibrate();
    const duration = Number(seekRange.max) || 0;
    const newTime = Math.max(0, Math.min(duration, Number(seekRange.value) + deltaSeconds));
    seekRange.value = String(newTime);
    currentTimeLabel.textContent = formatTime(newTime);
    send({ type: 'seek', value: newTime });
  };

  skipBackBtn.addEventListener('click', () => skip(-10));
  skipFwdBtn.addEventListener('click', () => skip(10));

  fullscreenBtn.addEventListener('click', () => {
    vibrate();
    send({ type: 'fullscreen' });
  });

  muteBtn.addEventListener('click', () => {
    vibrate();
    const current = Number(volumeRange.value);
    const target = current > 0 ? 0 : lastNonZeroVolume;
    if (current > 0) {
      lastNonZeroVolume = current;
    }
    volumeRange.value = String(target);
    updateMuteIcon(target);
    send({ type: 'volume', value: target });
  });

  volumeRange.addEventListener('input', () => { isAdjustingVolume = true; });
  volumeRange.addEventListener('change', () => {
    const value = Number(volumeRange.value);
    if (value > 0) {
      lastNonZeroVolume = value;
    }
    updateMuteIcon(value);
    send({ type: 'volume', value });
    isAdjustingVolume = false;
  });

  seekRange.addEventListener('input', () => {
    isSeeking = true;
    currentTimeLabel.textContent = formatTime(Number(seekRange.value));
  });
  seekRange.addEventListener('change', () => {
    send({ type: 'seek', value: Number(seekRange.value) });
    isSeeking = false;
  });

  /**
   * @param {{ videoId: string, title: string, author: string, thumbnail: string }[]} results
   */
  const renderResults = (results) => {
    searchMessage.textContent = results.length === 0 ? 'No results' : '';
    resultsEl.textContent = '';

    results.forEach((result) => {
      const item = document.createElement('div');
      item.className = 'result';
      item.setAttribute('role', 'button');
      item.tabIndex = 0;

      const img = document.createElement('img');
      if (typeof result.thumbnail === 'string' && result.thumbnail.indexOf('https://') === 0) {
        img.src = result.thumbnail;
      }
      img.alt = '';

      const meta = document.createElement('div');
      meta.className = 'meta';

      const title = document.createElement('div');
      title.className = 'title';
      title.textContent = result.title || '';

      const author = document.createElement('div');
      author.className = 'author';
      author.textContent = result.author || '';

      meta.appendChild(title);
      meta.appendChild(author);
      item.appendChild(img);
      item.appendChild(meta);

      const open = () => {
        if (result.videoId) {
          vibrate();
          send({ type: 'open', videoId: result.videoId });
        }
      };
      item.addEventListener('click', open);
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });

      resultsEl.appendChild(item);
    });
  };

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (!query) {
      return;
    }

    pendingRequestId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    searchMessage.textContent = 'Searching…';
    resultsEl.textContent = '';
    send({ type: 'search', requestId: pendingRequestId, query });
  });

  connect();
})();
</script>
</body>
</html>`
}
