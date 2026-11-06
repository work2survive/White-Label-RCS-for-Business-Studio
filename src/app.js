/**
 * @fileoverview Main Workbench Entrypoint (`src/app.js`)
 *
 * Architectural Overview:
 * -----------------------
 * This file acts as the lightweight integration glue for the White-Label RCS Studio demo,
 * connecting two completely independent, framework-agnostic ES6 modules:
 *
 *  1. **Module 1: `RcsTemplateChooser`** (`./modules/template-chooser.js`)
 *     - Responsible for selecting the RCS/SMS template format (Standalone Vertical,
 *       Standalone Horizontal, Rich Card Carousel, Multi-Card Stack, Text + Chips, or Regular SMS),
 *       managing Carousel cards, computing safe-zone media cropping & character limits,
 *       configuring RBM Agent branding (or generic fallback), and exporting the REST JSON payload.
 *
 *  2. **Module 2: `RcsPhonePreview`** (`./modules/phone-preview.js`)
 *     - Responsible for rendering a pixel-accurate mobile hardware & OS messaging simulation
 *       (Google Messages Material 3, Samsung Messages One UI, Apple iOS 18+ RCS) across popular
 *       phone viewports (Pixel 9 Pro, Galaxy S24 Ultra, Motorola Edge 50, iPhone 16 Pro, etc.),
 *       including custom hand-pointer cursor, blue touch-area overlay, tap ripples, drag-scroll
 *       gestures, animated typing/message flows, and real-screenshot comparison.
 *
 * Decoupled Integration Contract:
 * -------------------------------
 * Neither module imports or depends on the other. Host applications (React, Vue, Angular,
 * or vanilla HTML) can mount either module standalone or wire them together via standard
 * DOM `CustomEvent`s (`rcs:change`, `rcs:flow-action`, `rcs:telemetry`) or callback hooks.
 */

import { RcsTemplateChooser } from './modules/template-chooser.js';
import { RcsPhonePreview } from './modules/phone-preview.js';
import { REAL_CAMPAIGN_PRESETS } from './modules/rcs-specs.js';

/**
 * Bootstraps the two-column RCS Workbench when the DOM is ready.
 * Supports both `#chooser-module-root` / `#preview-module-root` and `#rcs-chooser-mount` / `#rcs-preview-mount`
 * mount IDs so the entrypoint works seamlessly in both modular and single-file bundled builds.
 */
function initWorkbench() {
  // Resolve mount containers for Module 1 (Chooser) and Module 2 (Phone Preview)
  const chooserHost =
    document.getElementById('chooser-module-root') ||
    document.getElementById('rcs-chooser-mount');
  const previewHost =
    document.getElementById('preview-module-root') ||
    document.getElementById('rcs-preview-mount');

  // Guard against missing DOM nodes or duplicate initialization
  if (!chooserHost || !previewHost || chooserHost.dataset.initialized === 'true') return;
  chooserHost.dataset.initialized = 'true';

  // Optional header telemetry status elements
  const telemetryLogEl = document.getElementById('rcs-telemetry-last-event');
  const telemetryCountEl = document.getElementById('rcs-telemetry-counter');
  const workbenchGrid = document.getElementById('rcs-workbench-grid');

  // ---------------------------------------------------------------------------
  // 1. Instantiate Module 2 (`RcsPhonePreview`) independently
  // ---------------------------------------------------------------------------
  const previewModule = new RcsPhonePreview(previewHost, {
    initialPreset: 'hospital_preventive_carousel',
    /**
     * Telemetry callback invoked whenever a user interacts with the simulated phone
     * (e.g. tapping a Suggested Action, swiping a Carousel card, opening a media lightbox).
     * Future reporting/analytics backends can subscribe to this stream or the `rcs:telemetry` DOM event.
     */
    onTelemetry: (event) => {
      if (telemetryLogEl) {
        const metaStr = Object.entries(event)
          .filter(([k]) => !['id', 'timestamp', 'eventType'].includes(k))
          .map(([k, v]) => `${k}=${v}`)
          .join(' • ');
        telemetryLogEl.textContent = `[${event.timestamp}] ${event.eventType} ${metaStr ? `(${metaStr})` : ''}`;
      }
      if (telemetryCountEl) {
        telemetryCountEl.textContent = `${event.id} events tracked`;
      }
    }
  });

  // ---------------------------------------------------------------------------
  // 2. Instantiate Module 1 (`RcsTemplateChooser`) independently & wire to Preview
  // ---------------------------------------------------------------------------
  const chooserModule = new RcsTemplateChooser(chooserHost, {
    initialPreset: 'hospital_preventive_carousel',
    /**
     * Invoked whenever any template, card text, media height, crop guide toggle,
     * or RBM agent branding property is modified in Module 1.
     */
    onChange: (detail) => {
      previewModule.update({
        payload: detail.payload,
        agent: detail.agent,
        showCropGuides: detail.showCropGuides
      });
    },
    /**
     * Invoked when the user triggers an interactive conversation simulation action
     * (e.g. "Simulate Animated Conversation Flow", "+ User Bubble", or "Toggle SMS Fallback").
     */
    onTriggerFlow: (action) => {
      previewModule.triggerFlowAction(action);
    }
  });

  // ---------------------------------------------------------------------------
  // 3. Layout Mode Switcher (Split Workbench | Module 1 Only | Module 2 Only)
  //    Demonstrates that either module can operate independently on its own page.
  // ---------------------------------------------------------------------------
  document.querySelectorAll('[data-layout-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-layout-mode]').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const mode = btn.dataset.layoutMode;

      workbenchGrid.classList.remove('is-mode-chooser-only', 'is-mode-preview-only');
      chooserHost.style.display = '';
      previewHost.style.display = '';

      if (mode === 'chooser') {
        // Show only Module 1 (Template & Content Chooser)
        workbenchGrid.classList.add('is-mode-chooser-only');
        previewHost.style.display = 'none';
      } else if (mode === 'preview') {
        // Show only Module 2 (Mobile Phone Simulator)
        workbenchGrid.classList.add('is-mode-preview-only');
        chooserHost.style.display = 'none';
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Global SDK Namespace Exposure
  //    Allows external white-label host platforms or browser console scripts to
  //    inspect state, inject external RBM agent profiles, or mount new instances.
  // ---------------------------------------------------------------------------
  window.RCS_WHITE_LABEL_SDK = {
    RcsTemplateChooser,
    RcsPhonePreview,
    chooserModule,
    previewModule
  };
}

// Run immediately if the DOM is already parsed, or wait for DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWorkbench);
} else {
  initWorkbench();
}
