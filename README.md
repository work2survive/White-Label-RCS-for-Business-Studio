# White-Label RCS for Business Solution — Template Chooser & Phone Simulator SDK

Framework-agnostic, zero-dependency HTML/ES6 JavaScript modules for selecting **RCS for Business (RBM)** Rich Card templates, validating character & media crop specifications, and previewing the outcome across **Google Messages (Android 14/15 Material 3)**, **Samsung Messages (One UI 6/7)**, and **Apple Messages (iOS 18+ RCS)** in Light and Dark themes.

## Architecture: Two Decoupled, Standalone Modules

The system is split into two independent ES modules that can be embedded individually in separate parts of your application or wired together:

1. **Module 1 — [`RcsTemplateChooser`](./src/modules/template-chooser.js)** (`<rcs-template-chooser>`)
   - Compact, 720p-first pictogram UI for choosing templates:
     - **Standalone Vertical Rich Card** (`SHORT` 112dp, `MEDIUM` 168dp, `TALL` 264dp)
     - **Standalone Horizontal Rich Card** (`LEFT` or `RIGHT` 128dp thumbnail)
     - **Rich Card Carousel** (`SMALL` 120dp / `MEDIUM` 200dp width, 2–10 cards)
     - **Stacked Multi-Card Campaign Flow**
     - **Conversational RCS Text + Floating Suggestion Chips**
     - **Regular SMS & Automated SMS Fallback**
   - **Live Character & Truncation Recommendations**: Title (`≤ 40` rec / `200` max), Description (`≤ 140` rec before fold / `2000` max), Suggested Actions/Replies (`25` char hard limit), and GSM-7 (`160`) vs Unicode UCS-2 (`70`) SMS segment counter.
   - **Media Resolution, KB & Safe-Zone Center-Crop Visualizer**: Shows exactly which part of an uploaded image, animated GIF, or MP4/WebM video is displayed vs cropped out by the messaging app.
   - **Color-Neutral Official Documentation Links**: Every template, media property, and action type includes a subtle `ℹ` icon linking directly to the corresponding Google RCS for Business developer documentation section.
   - **Agent Brand Auto-Detection & Fallback**: Accepts an external RBM Agent configuration (name, verified badge, hex color, logo, tagline) or auto-extracts dominant brand colors from an uploaded logo, falling back cleanly to a generic profile when not detected.

2. **Module 2 — [`RcsPhonePreview`](./src/modules/phone-preview.js)** (`<rcs-phone-preview>`)
   - Loyal hardware and OS message thread simulation based on real mobile screenshots (**TIPOS**, **Telekom Magenta Moments**, **DOXXbet**):
     - **Phones**: Google Pixel 9 Pro, Samsung Galaxy S24 Ultra, Motorola Edge 50 Pro, iPhone 16 Pro, iPhone 15 / SE Compact, Foldable Dual-Screen (Unfolded), plus a **Custom Preset Builder** (`+ Preset`) for adding future devices or app UI versions.
     - **OS / App Skins**: Google Messages (Material 3), Samsung Messages (One UI), and iOS 18+ RCS in both **Light** and **Dark** themes.
     - **Interactive Gestures & Animations**: Mouse/touch drag on carousels with peeking adjacent cards, tap-to-zoom full-screen media lightbox, interactive action/webview sheets, animated reply bubbles & typing indicators, zoom controls (`50%`–`135%`), and real-time `rcs:telemetry` events for reporting/tracking integration.

## Usage Example (Standalone or Combined)

```html
<link rel="stylesheet" href="./src/styles/rcs-studio.css" />

<!-- Use as Web Components or instantiate via JS -->
<div id="my-chooser"></div>
<div id="my-preview"></div>

<script type="module">
  import { RcsTemplateChooser } from './src/modules/template-chooser.js';
  import { RcsPhonePreview } from './src/modules/phone-preview.js';

  const preview = new RcsPhonePreview('#my-preview', {
    deviceId: 'pixel_9_pro',
    skinId: 'google_messages_m3',
    theme: 'light',
    onTelemetry: (evt) => console.log('Tracking event:', evt)
  });

  const chooser = new RcsTemplateChooser('#my-chooser', {
    initialPreset: 'telekom_carousel',
    onChange: ({ payload, agent, showCropGuides }) => {
      preview.update({ payload, agent, showCropGuides });
    }
  });
</script>
```
