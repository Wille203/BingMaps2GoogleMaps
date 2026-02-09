# Bing Maps to Google Maps Redirector

A Microsoft Edge extension that automatically redirects Bing Maps URLs to Google Maps.

## Features

- Automatically detects when you navigate to Bing Maps
- Converts location information from Bing Maps format to Google Maps format
- Seamless redirection to Google Maps
- **Easy on/off toggle**: Click the extension icon to enable or disable redirects anytime
- **Visual indicator**: The extension icon changes appearance when disabled so you can see the current state at a glance

## Installation

### For Microsoft Edge (or any Chromium-based browser)

1. Open Microsoft Edge
2. Navigate to `edge://extensions/`
3. Enable "Developer mode" (toggle in the bottom left)
4. Click "Load unpacked"
5. Select the folder containing this extension
6. The extension is now installed and active!

**Note**: This also works in Google Chrome (`chrome://extensions/`) and other Chromium-based browsers.

## Usage

Once installed, the extension works automatically. However, you can control it:

- **Enable/Disable**: Click the extension icon in your browser toolbar to open a popup with a toggle switch
- **Turn it off**: Flip the switch to disable redirects temporarily (e.g., if you actually want to use Bing Maps)
- **Turn it back on**: Flip the switch again to resume automatic redirects
- Your preference is saved and remembered across browser sessions

## How It Works

The extension monitors navigation to Bing Maps URLs and:
1. Detects when you navigate to any Bing Maps page
2. Extracts location data from URL parameters:
   - Search queries (`q`, `where`, `ss`)
   - Coordinates (`cp` - center point)
   - Points of interest (`ppois`)
   - Directions/routes (`rtp`)
   - Zoom levels (`lvl`)
3. Converts to the equivalent Google Maps URL format
4. Automatically redirects your browser tab

## File Structure

```
BingMaps2GoogleMaps/
├── manifest.json       # Extension configuration and metadata
├── background.js       # Core redirect logic and URL conversion
├── popup.html          # Extension popup UI with toggle switch
├── popup.js            # Popup logic for enable/disable functionality
├── icons/              # Extension icons
│   ├── icon16.png      # Default icon (enabled)
│   ├── icon16Off.png   # Icon shown when disabled
│   ├── icon48.png
│   └── icon128.png
└── README.md           # Documentation
```

## Permissions

- `webNavigation`: To detect navigation to Bing Maps
- `tabs`: To redirect the browser tab
- `storage`: To remember your enable/disable preference
- `host_permissions` for `*.bing.com`: To access Bing URLs

## Technical Details

- Built using Manifest V3 for modern browser compatibility
- Uses `webNavigation` API for seamless URL interception
- Lightweight service worker with no persistent background processes
- Preserves location data, zoom levels, and route information during conversion

## Disclaimer

This extension is not affiliated with, endorsed by, or sponsored by Microsoft or Google. It's an independent tool created to improve user experience by redirecting between map services.
