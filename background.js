let isEnabled = true;

function updateIcon(enabled) {
  const path = enabled ? 'icons/icon16.png' : 'icons/icon16Off.png';
  chrome.action.setIcon({ path: { 16: path } });
}

function loadState() {
  chrome.storage.sync.get(['enabled'], function(result) {
    isEnabled = result.enabled !== false;
    updateIcon(isEnabled);
  });
}

loadState();
chrome.tabs.onActivated.addListener(loadState);

chrome.storage.onChanged.addListener(function(changes) {
  if (changes.enabled) {
    isEnabled = changes.enabled.newValue;
    updateIcon(isEnabled);
  }
});

chrome.webNavigation.onBeforeNavigate.addListener(
  function(details) {
    if (details.frameId !== 0) return;
    if (!isEnabled) return;

    const googleMapsUrl = convertBingToGoogleMaps(new URL(details.url));
    chrome.tabs.update(details.tabId, { url: googleMapsUrl });
  },
  {
    url: [
      { hostContains: 'bing.com', pathContains: 'maps' }
    ]
  }
);

function convertBingToGoogleMaps(bingUrl) {
  const params = bingUrl.searchParams;
  const cp = params.get('cp');       // center point
  const lvl = params.get('lvl');     // zoom level
  const where = params.get('where'); // location search
  const q = params.get('q');         // query/search term
  const ss = params.get('ss');       // search string
  const ppois = params.get('ppois'); // point of interest
  const rtp = params.get('rtp');     // route

  let googleUrl = 'https://www.google.com/maps';

  if (rtp) {
    const routeParts = rtp.split('~');
    if (routeParts.length >= 2) {
      const start = extractLocation(routeParts[0]);
      const end = extractLocation(routeParts[routeParts.length - 1]);

      if (start && end) {
        googleUrl += `/dir/${start}/${end}`;
        if (routeParts.length > 2) {
          for (let i = 1; i < routeParts.length - 1; i++) {
            const waypoint = extractLocation(routeParts[i]);
            if (waypoint) googleUrl += `/${waypoint}`;
          }
        }
        return googleUrl;
      }
    }
  }

  if (q || where || ss) {
    const searchTerm = q || where || ss;

    if (isCoordinateQuery(searchTerm)) {
      if (ppois) {
        const coords = extractPPoisData(ppois);
        if (coords) {
          const zoom = buildZoomParam(lvl);
          googleUrl += `/place/${coords.lat},${coords.lon}/@${coords.lat},${coords.lon}${zoom}`;
        }
      } else if (cp) {
        const [lat, lon] = cp.split('~');
        const zoom = buildZoomParam(lvl);
        googleUrl += `/place/${lat},${lon}/@${lat},${lon}${zoom}`;
      }
    } else {
      googleUrl += `/search/${encodeURIComponent(searchTerm)}`;

      if (ppois) {
        const coords = extractPPoisData(ppois);
        if (coords) {
          const zoom = buildZoomParam(lvl);
          googleUrl += `/@${coords.lat},${coords.lon}${zoom}`;
        }
      } else if (cp) {
        const [lat, lon] = cp.split('~');
        const zoom = buildZoomParam(lvl);
        googleUrl += `/@${lat},${lon}${zoom}`;
      }
    }
  } else if (ppois) {
    const poiData = extractPPoisData(ppois);
    if (poiData) {
      if (poiData.name) googleUrl += `/search/${encodeURIComponent(poiData.name)}`;
      const zoom = buildZoomParam(lvl);
      googleUrl += `/@${poiData.lat},${poiData.lon}${zoom}`;
    }
  } else if (cp) {
    const [lat, lon] = cp.split('~');
    const zoom = buildZoomParam(lvl);
    googleUrl += `/@${lat},${lon}${zoom}`;
  } else {
    const path = bingUrl.pathname;
    const match = path.match(/maps\/([^/]+)/);
    if (match && match[1]) googleUrl += `/search/${encodeURIComponent(match[1])}`;
  }

  return googleUrl;
}

function buildZoomParam(lvl) {
  return lvl ? `,${convertZoomLevel(lvl)}z` : '';
}

function isCoordinateQuery(query) {
  const cleaned = query.replace(/\s+/g, '');
  const coordPattern = /^-?\d+[,\.]\d+[,\s]+-?\d+[,\.]\d+$/;
  return coordPattern.test(cleaned);
}

function extractPPoisData(ppois) {
  const parts = ppois.split('_');
  if (parts.length >= 3) {
    const name = parts.slice(2).join('_').replace('_~', '').replace('~', '');
    return { lat: parts[0], lon: parts[1], name: name };
  } else if (parts.length >= 2) {
    return { lat: parts[0], lon: parts[1], name: null };
  }
  return null;
}

function extractLocation(part) {
  if (part.startsWith('pos.')) return part.substring(4).replace('_', ',');
  if (part.startsWith('adr.')) return encodeURIComponent(part.substring(4));
  return null;
}

function convertZoomLevel(bingZoom) {
  const level = parseInt(bingZoom);
  return Math.min(Math.max(level, 1), 21).toString();
}
