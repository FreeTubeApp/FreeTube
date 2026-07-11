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
  .controls { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.9rem; }
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
  button.iconBtn:active { opacity: 0.8; }
  input[type="range"] { width: 100%; }
  .rangeRow { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: var(--muted); margin-top: 0.6rem; }
  .rangeRow input { flex: 1; }
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
      <button type="button" id="playPauseBtn" class="iconBtn" aria-label="Play/Pause">&#9654;</button>
      <div style="flex:1">
        <div class="rangeRow">
          <span>&#128266;</span>
          <input type="range" id="volumeRange" min="0" max="100" value="100">
        </div>
        <div class="rangeRow">
          <span id="currentTimeLabel">0:00</span>
          <input type="range" id="seekRange" min="0" max="0" value="0">
          <span id="durationLabel">0:00</span>
        </div>
      </div>
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
(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  var token = params.get('t');

  if (!token) {
    document.getElementById('tokenError').style.display = 'block';
    return;
  }

  document.getElementById('app').style.display = 'flex';
  document.getElementById('app').style.flexDirection = 'column';

  var statusEl = document.getElementById('status');
  var statusTextEl = document.getElementById('statusText');
  var npCard = document.getElementById('nowPlayingCard');
  var npThumb = document.getElementById('npThumb');
  var npTitle = document.getElementById('npTitle');
  var playPauseBtn = document.getElementById('playPauseBtn');
  var volumeRange = document.getElementById('volumeRange');
  var seekRange = document.getElementById('seekRange');
  var currentTimeLabel = document.getElementById('currentTimeLabel');
  var durationLabel = document.getElementById('durationLabel');
  var searchForm = document.getElementById('searchForm');
  var searchInput = document.getElementById('searchInput');
  var searchMessage = document.getElementById('searchMessage');
  var resultsEl = document.getElementById('results');

  var lastPaused = true;
  var isSeeking = false;
  var isAdjustingVolume = false;
  var pendingRequestId = null;
  var ws = null;
  var reconnectDelay = 1000;

  function formatTime(totalSeconds) {
    var s = Math.max(0, Math.floor(totalSeconds || 0));
    var m = Math.floor(s / 60);
    var sec = s % 60;
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function setStatus(connected) {
    statusEl.className = connected ? 'connected' : 'disconnected';
    statusTextEl.textContent = connected ? 'Connected' : 'Disconnected';
  }

  function send(obj) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(obj));
    }
  }

  function connect() {
    var protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    var url = protocol + '//' + window.location.host + '/ws?t=' + encodeURIComponent(token);
    ws = new WebSocket(url);

    ws.addEventListener('open', function () {
      setStatus(true);
      reconnectDelay = 1000;
    });

    ws.addEventListener('close', function () {
      setStatus(false);
      setTimeout(connect, reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay * 1.5, 8000);
    });

    ws.addEventListener('error', function () {
      ws.close();
    });

    ws.addEventListener('message', function (event) {
      var msg;
      try {
        msg = JSON.parse(event.data);
      } catch (e) {
        return;
      }
      handleMessage(msg);
    });
  }

  function handleMessage(msg) {
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
  }

  function applyState(state) {
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
    }

    if (typeof state.duration === 'number' && state.duration > 0) {
      seekRange.max = String(Math.floor(state.duration));
      durationLabel.textContent = formatTime(state.duration);
    }

    if (typeof state.currentTime === 'number' && !isSeeking) {
      seekRange.value = String(Math.floor(state.currentTime));
      currentTimeLabel.textContent = formatTime(state.currentTime);
    }
  }

  playPauseBtn.addEventListener('click', function () {
    send({ type: lastPaused ? 'play' : 'pause' });
  });

  volumeRange.addEventListener('input', function () { isAdjustingVolume = true; });
  volumeRange.addEventListener('change', function () {
    send({ type: 'volume', value: Number(volumeRange.value) });
    isAdjustingVolume = false;
  });

  seekRange.addEventListener('input', function () {
    isSeeking = true;
    currentTimeLabel.textContent = formatTime(Number(seekRange.value));
  });
  seekRange.addEventListener('change', function () {
    send({ type: 'seek', value: Number(seekRange.value) });
    isSeeking = false;
  });

  function renderResults(results) {
    searchMessage.textContent = results.length === 0 ? 'No results' : '';
    resultsEl.textContent = '';

    results.forEach(function (result) {
      var item = document.createElement('div');
      item.className = 'result';
      item.setAttribute('role', 'button');
      item.tabIndex = 0;

      var img = document.createElement('img');
      if (typeof result.thumbnail === 'string' && result.thumbnail.indexOf('https://') === 0) {
        img.src = result.thumbnail;
      }
      img.alt = '';

      var meta = document.createElement('div');
      meta.className = 'meta';

      var title = document.createElement('div');
      title.className = 'title';
      title.textContent = result.title || '';

      var author = document.createElement('div');
      author.className = 'author';
      author.textContent = result.author || '';

      meta.appendChild(title);
      meta.appendChild(author);
      item.appendChild(img);
      item.appendChild(meta);

      var open = function () {
        if (result.videoId) {
          send({ type: 'open', videoId: result.videoId });
        }
      };
      item.addEventListener('click', open);
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });

      resultsEl.appendChild(item);
    });
  }

  searchForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var query = searchInput.value.trim();
    if (!query) {
      return;
    }

    pendingRequestId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    searchMessage.textContent = 'Searching…';
    resultsEl.textContent = '';
    send({ type: 'search', requestId: pendingRequestId, query: query });
  });

  connect();
})();
</script>
</body>
</html>`
}
