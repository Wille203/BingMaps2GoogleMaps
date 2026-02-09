// Cache the enabled state to avoid async issues during navigation
let isEnabled = true;

// Update the action icon based on enabled state
function updateIcon(enabled) {
  const path = enabled ? 'icons/icon16.png' : 'icons/icon16Off.png';
  chrome.action.setIcon({ path: { 16: path } });
}

// Load state and update icon
function loadState() {
  chrome.storage.sync.get(['enabled'], function(result) {
    isEnabled = result.enabled !== false;
    updateIcon(isEnabled);
  });
}

// Load state every time the service worker wakes up
loadState();

// Re-check icon whenever a tab is activated (catches browser restart edge cases)
chrome.tabs.onActivated.addListener(loadState);

chrome.storage.onChanged.addListener(function(changes) {
  if (changes.enabled) {
    isEnabled = changes.enabled.newValue;
    updateIcon(isEnabled);
  }
});

// Listen for navigation to Bing Maps and redirect to Google Maps
chrome.webNavigation.onBeforeNavigate.addListener(
  function(details) {
    // Only process main frame navigation (not iframes)
    if (details.frameId !== 0) return;
    
    // Check cached enabled state
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

// Convert Bing Maps URL to equivalent Google Maps URL
function convertBingToGoogleMaps(bingUrl) {
  const params = bingUrl.searchParams;
  
  // Extract Bing Maps URL parameters
  const cp = params.get('cp');       // Center point (lat~lon)
  const lvl = params.get('lvl');     // Zoom level
  const where = params.get('where'); // Search location
  const q = params.get('q');         // Query/search term
  const ss = params.get('ss');       // Search string
  const ppois = params.get('ppois'); // Point of interest data (lat_lon_name)
  const rtp = params.get('rtp');     // Route/directions data
  
  let googleUrl = 'https://www.google.com/maps';
  
  // Handle directions/routes
  if (rtp) {
    const routeParts = rtp.split('~');
    if (routeParts.length >= 2) {
      const start = extractLocation(routeParts[0]);
      const end = extractLocation(routeParts[routeParts.length - 1]);
      
      if (start && end) {
        googleUrl += `/dir/${start}/${end}`;
        // Add waypoints if present
        if (routeParts.length > 2) {
          for (let i = 1; i < routeParts.length - 1; i++) {
            const waypoint = extractLocation(routeParts[i]);
            if (waypoint) {
              googleUrl += `/${waypoint}`;
            }
          }
        }
        return googleUrl;
      }
    }
  }
  
  // Handle search queries and location searches
  if (q || where || ss) {
    const searchTerm = q || where || ss;
    
    // Check if query is coordinates (e.g., "40.7,-74.0")
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
      // Regular text search
      googleUrl += `/search/${encodeURIComponent(searchTerm)}`;
      
      // Add center coordinates if available
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
  // Handle point of interest without explicit search query
  } else if (ppois) {
    const poiData = extractPPoisData(ppois);
    if (poiData) {
      if (poiData.name) {
        googleUrl += `/search/${encodeURIComponent(poiData.name)}`;
      }
      const zoom = buildZoomParam(lvl);
      googleUrl += `/@${poiData.lat},${poiData.lon}${zoom}`;
    }
  // Handle center point without search (just viewing a location)
  } else if (cp) {
    const [lat, lon] = cp.split('~');
    const zoom = buildZoomParam(lvl);
    googleUrl += `/@${lat},${lon}${zoom}`;
  // Fallback: extract location from URL path
  } else {
    const path = bingUrl.pathname;
    const match = path.match(/maps\/([^/]+)/);
    if (match && match[1]) {
      googleUrl += `/search/${encodeURIComponent(match[1])}`;
    }
  }
  
  return googleUrl;
}

// Helper to build zoom parameter string
function buildZoomParam(lvl) {
  return lvl ? `,${convertZoomLevel(lvl)}z` : '';
}

// Check if a query string contains coordinates
function isCoordinateQuery(query) {
  const cleaned = query.replace(/\s+/g, '');
  const coordPattern = /^-?\d+[,\.]\d+[,\s]+-?\d+[,\.]\d+$/;
  return coordPattern.test(cleaned);
}

// Extract full point of interest data (coordinates and name)
function extractPPoisData(ppois) {
  const parts = ppois.split('_');
  if (parts.length >= 3) {
    const name = parts.slice(2).join('_').replace('_~', '').replace('~', '');
    return {
      lat: parts[0],
      lon: parts[1],
      name: name
    };
  } else if (parts.length >= 2) {
    return {
      lat: parts[0],
      lon: parts[1],
      name: null
    };
  }
  return null;
}

// Extract location from route part (handles both coordinates and addresses)
function extractLocation(part) {
  if (part.startsWith('pos.')) {
    const coords = part.substring(4).replace('_', ',');
    return coords;
  } else if (part.startsWith('adr.')) {
    return encodeURIComponent(part.substring(4));
  }
  return null;
}

// Convert Bing zoom level to Google Maps zoom level (both use 1-21 range)
function convertZoomLevel(bingZoom) {
  const level = parseInt(bingZoom);
  return Math.min(Math.max(level, 1), 21).toString();
}
