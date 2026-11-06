/**
 * @fileoverview Main Workbench Entrypoint connecting the two independent,
 * framework-agnostic modules:
 *  - Module 1: `RcsTemplateChooser` (`./modules/template-chooser.js`)
 *  - Module 2: `RcsPhonePreview` (`./modules/phone-preview.js`)
 *
 * Either module can also be imported and mounted alone in any third-party app.
 */

import { RcsTemplateChooser } from './modules/template-chooser.js';
import { RcsPhonePreview } from './modules/phone-preview.js';
import { REAL_CAMPAIGN_PRESETS } from './modules/rcs-specs.js';

document.addEventListener('DOMContentLoaded', () => {
  const chooserHost = document.getElementById('chooser-module-root');
  const previewHost = document.getElementById('preview-module-root');
  const telemetryLogEl = document.getElementById('rcs-telemetry-last-event');
  const telemetryCountEl = document.getElementById('rcs-telemetry-counter');
  const workbenchGrid = document.getElementById('rcs-workbench-grid');

  // Instantiate Module 2 (Phone Preview) independently
  const previewModule = new RcsPhonePreview(previewHost, {
    initialPreset: 'tipos_lottery',
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

  // Instantiate Module 1 (Template Chooser) independently & wire via standard callback / CustomEvent
  const chooserModule = new RcsTemplateChooser(chooserHost, {
    initialPreset: 'tipos_lottery',
    onChange: (detail) => {
      const activePreset = REAL_CAMPAIGN_PRESETS[detail.state.activePresetId];
      previewModule.update({
        payload: detail.payload,
        agent: detail.agent,
        showCropGuides: detail.showCropGuides,
        referenceScreenshot: activePreset?.referenceScreenshot
      });
    },
    onTriggerFlow: (action) => {
      previewModule.triggerFlowAction(action);
    }
  });

  // Allow testing each module completely standalone (Split | Chooser Only | Preview Only)
  document.querySelectorAll('[data-layout-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-layout-mode]').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const mode = btn.dataset.layoutMode;

      workbenchGrid.classList.remove('is-mode-chooser-only', 'is-mode-preview-only');
      chooserHost.style.display = '';
      previewHost.style.display = '';

      if (mode === 'chooser') {
        workbenchGrid.classList.add('is-mode-chooser-only');
        previewHost.style.display = 'none';
      } else if (mode === 'preview') {
        workbenchGrid.classList.add('is-mode-preview-only');
        chooserHost.style.display = 'none';
      }
    });
  });

  // Expose on window for developer console / external white-label host integration
  window.RCS_WHITE_LABEL_SDK = {
    RcsTemplateChooser,
    RcsPhonePreview,
    chooserModule,
    previewModule
  };
});
