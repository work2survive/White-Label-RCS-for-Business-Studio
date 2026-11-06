/**
 * @fileoverview Agnostic RCS Template Chooser & Content/Agent Configurator Module.
 * Can be mounted standalone in any DOM container via `new RcsTemplateChooser(el, opts)`
 * or used as a Web Component `<rcs-template-chooser>`.
 * Communicates via standard CustomEvents (`rcs:change`, `rcs:template-select`, `rcs:crop-overlay-toggle`, `rcs:simulate-flow`).
 */

import {
  RCS_DOCS,
  TEXT_LIMITS,
  MEDIA_SPECS,
  CAROUSEL_WIDTH_SPECS,
  TEMPLATES,
  ACTION_TYPES,
  REAL_CAMPAIGN_PRESETS,
  analyzeSmsSegments,
  evaluateMediaCrop
} from './rcs-specs.js';
import { getIcon, renderDocLink } from './icons.js';

export class RcsTemplateChooser {
  /**
   * @param {HTMLElement|string} container
   * @param {Object} options
   */
  constructor(container, options = {}) {
    this.root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!this.root) {
      throw new Error('RcsTemplateChooser: valid target container element is required.');
    }

    const defaultPreset = REAL_CAMPAIGN_PRESETS[options.initialPreset || 'tipos_lottery'];
    this.state = {
      activePresetId: defaultPreset.id,
      activeSubTab: 'content', // 'content' | 'agent' | 'fallback' | 'json'
      activeCardIndex: 0,
      showCropGuides: true,
      agentDetected: true,
      agent: structuredClone(options.agent || defaultPreset.agent),
      payload: structuredClone(options.payload || defaultPreset.payload)
    };

    this.onChange = typeof options.onChange === 'function' ? options.onChange : null;
    this.onTriggerFlow = typeof options.onTriggerFlow === 'function' ? options.onTriggerFlow : null;

    this.render();
    this.attachEvents();
    this.emitChange('init');
  }

  /**
   * Public API: Get current complete state (payload + agent + crop config)
   */
  getState() {
    return structuredClone(this.state);
  }

  /**
   * Public API: Load one of the real campaign presets or custom state
   */
  loadPreset(presetId) {
    const preset = REAL_CAMPAIGN_PRESETS[presetId];
    if (!preset) return;
    this.state.activePresetId = preset.id;
    this.state.activeCardIndex = 0;
    this.state.agent = structuredClone(preset.agent);
    this.state.payload = structuredClone(preset.payload);
    this.render();
    this.attachEvents();
    this.emitChange('preset-load');
  }

  /**
   * Public API: Simulate auto-detecting Agent Branding from an external RBM Agent object
   * or falling back to a generic white-label agent if not detected.
   */
  setAgentFromExternal(agentData = null) {
    if (agentData && agentData.name) {
      this.state.agentDetected = true;
      this.state.agent = {
        ...this.state.agent,
        ...agentData
      };
    } else {
      this.state.agentDetected = false;
      this.state.agent = {
        name: 'Generic Business Agent',
        verified: false,
        tagline: 'Automated RCS Business Messaging Service (Fallback Agent Profile)',
        color: '#475569',
        avatarShape: 'rounded',
        logoUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="36" fill="#475569"/><text x="80" y="98" fill="#ffffff" font-family="system-ui, sans-serif" font-size="56" font-weight="800" text-anchor="middle">RCS</text></svg>')}`,
        showAgentHeader: true,
        showRbmChatNotice: true,
        timestampLabel: 'Today • 12:00',
        messageTime: '12:00',
        showSpamBanner: false,
        showScrollDownBtn: false
      };
    }
    this.render();
    this.attachEvents();
    this.emitChange('agent-detect');
  }

  emitChange(reason = 'update') {
    const detail = {
      reason,
      state: this.getState(),
      agent: structuredClone(this.state.agent),
      payload: structuredClone(this.state.payload),
      showCropGuides: this.state.showCropGuides
    };
    this.root.dispatchEvent(new CustomEvent('rcs:change', { detail, bubbles: true, composed: true }));
    if (this.onChange) {
      this.onChange(detail);
    }
  }

  getCurrentCard() {
    const cards = this.state.payload.cards || [];
    if (!cards.length) {
      cards.push({
        id: `card-${Date.now()}`,
        mediaUrl: '',
        mediaType: 'image',
        mediaSizeKb: 250,
        mediaDimensions: { width: 1440, height: 720 },
        title: 'Card Title',
        description: 'Card description text.',
        suggestions: []
      });
    }
    if (this.state.activeCardIndex >= cards.length) {
      this.state.activeCardIndex = 0;
    }
    return cards[this.state.activeCardIndex];
  }

  selectTemplate(templateId) {
    const tpl = TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;

    this.state.payload.templateId = tpl.id;
    this.state.payload.channel = tpl.channel;
    this.state.payload.mediaHeight = tpl.defaultMediaHeight;

    if (tpl.id === 'carousel' || tpl.id === 'multi_card_feed') {
      if (this.state.payload.cards.length < 2) {
        const first = structuredClone(this.getCurrentCard());
        first.id = `card-${Date.now()}-2`;
        first.title = 'Second Offer Card ✨';
        this.state.payload.cards.push(first);
      }
    }

    this.render();
    this.attachEvents();
    this.emitChange('template-select');
  }

  renderCharMeter(text = '', limitSpec) {
    const len = Array.from(text || '').length;
    const rec = limitSpec.recommended;
    const max = limitSpec.max;
    const pct = Math.min(100, Math.round((len / max) * 100));
    let statusClass = 'ok';
    let statusText = `Optimal (≤ ${rec})`;
    if (len > max) {
      statusClass = 'danger';
      statusText = `Exceeds max (${max})!`;
    } else if (len > rec) {
      statusClass = 'warn';
      statusText = `Long (> ${rec} chars may wrap/fold)`;
    }

    return `
      <div class="rcs-meter-wrap">
        <div class="rcs-meter-bar">
          <div class="rcs-meter-fill is-${statusClass}" style="width:${pct}%"></div>
        </div>
        <div class="rcs-meter-meta">
          <span class="rcs-meter-badge is-${statusClass}">${statusText}</span>
          <span class="rcs-meter-count"><strong>${len}</strong> / ${ rec } rec (${max} max)</span>
        </div>
      </div>
    `;
  }

  render() {
    const { payload, agent, activeSubTab, activeCardIndex, showCropGuides, activePresetId, agentDetected } = this.state;
    const currentTemplate = TEMPLATES.find((t) => t.id === payload.templateId) || TEMPLATES[0];
    const card = this.getCurrentCard();
    const isMulti = payload.templateId === 'carousel' || payload.templateId === 'multi_card_feed';
    const isCarousel = payload.templateId === 'carousel';
    const isHorizontal = payload.templateId === 'standalone_horizontal';
    const isTextOnly = payload.templateId === 'text_with_chips';
    const isSms = payload.templateId === 'sms_regular';

    const cropInfo = evaluateMediaCrop(
      card.mediaDimensions,
      payload.mediaHeight,
      isCarousel,
      payload.cardWidth
    );

    const smsAnalysis = analyzeSmsSegments(payload.smsFallbackText || card.description || '');

    this.root.innerHTML = `
      <div class="rcs-chooser-shell">
        <!-- Compact Top Header: Preset Selector + Sub-navigation -->
        <div class="rcs-chooser-topbar">
          <div class="rcs-module-title">
            <span class="rcs-module-badge">MODULE 1</span>
            <h2>Template & Content Chooser</h2>
            ${renderDocLink(RCS_DOCS.overview.url, 'Official Google RBM Developer Documentation')}
          </div>

          <div class="rcs-preset-bar" title="Load authentic campaign presets from real screenshots">
            <label for="rcs-preset-select" class="rcs-sr-only">Preset</label>
            <select id="rcs-preset-select" class="rcs-select-compact">
              ${Object.values(REAL_CAMPAIGN_PRESETS).map((p) => `
                <option value="${p.id}" ${p.id === activePresetId ? 'selected' : ''}>★ Preset: ${p.label}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- 1. Pictogram Template Strip (Always visible for 1-click switching) -->
        <div class="rcs-template-strip" role="listbox" aria-label="RCS Rich Card Templates">
          ${TEMPLATES.map((tpl) => {
            const active = tpl.id === payload.templateId;
            return `
              <button type="button"
                class="rcs-tpl-btn ${active ? 'is-active' : ''}"
                data-tpl-id="${tpl.id}"
                role="option"
                aria-selected="${active}"
                title="${tpl.description}">
                <div class="rcs-tpl-btn-top">
                  ${getIcon(tpl.icon, 'rcs-tpl-ico')}
                  ${renderDocLink(tpl.docUrl, `${tpl.name} — Official Spec`)}
                </div>
                <span class="rcs-tpl-name">${tpl.shortName}</span>
              </button>
            `;
          }).join('')}
        </div>

        <!-- Secondary Mode Tabs (Content & Crop | Agent Brand | SMS Fallback & Flow | JSON Payload) -->
        <div class="rcs-subtabs" role="tablist">
          <button type="button" class="rcs-subtab ${activeSubTab === 'content' ? 'is-active' : ''}" data-subtab="content">
            ${getIcon('crop')} <span>Card & Media Specs</span>
          </button>
          <button type="button" class="rcs-subtab ${activeSubTab === 'agent' ? 'is-active' : ''}" data-subtab="agent">
            ${getIcon('verified')} <span>Agent Branding</span>
            <span class="rcs-dot ${agentDetected ? 'is-detected' : 'is-fallback'}" title="${agentDetected ? 'Agent branding detected' : 'Using fallback generic brand'}"></span>
          </button>
          <button type="button" class="rcs-subtab ${activeSubTab === 'fallback' ? 'is-active' : ''}" data-subtab="fallback">
            ${getIcon('sms')} <span>SMS Fallback & Flow</span>
          </button>
          <button type="button" class="rcs-subtab ${activeSubTab === 'json' ? 'is-active' : ''}" data-subtab="json">
            ${getIcon('code')} <span>RBM JSON</span>
          </button>
        </div>

        <!-- Tab Body (Scrollable internally within 720p layout) -->
        <div class="rcs-chooser-body">
          ${activeSubTab === 'content' ? this.renderContentTab({
            payload,
            card,
            currentTemplate,
            isMulti,
            isCarousel,
            isHorizontal,
            isTextOnly,
            isSms,
            cropInfo,
            showCropGuides,
            activeCardIndex
          }) : ''}

          ${activeSubTab === 'agent' ? this.renderAgentTab({ agent, agentDetected }) : ''}

          ${activeSubTab === 'fallback' ? this.renderFallbackTab({ payload, card, smsAnalysis }) : ''}

          ${activeSubTab === 'json' ? this.renderJsonTab({ payload, agent }) : ''}
        </div>
      </div>
    `;
  }

  renderContentTab({
    payload,
    card,
    isMulti,
    isCarousel,
    isHorizontal,
    isTextOnly,
    isSms,
    cropInfo,
    showCropGuides,
    activeCardIndex
  }) {
    const sizeKb = card.mediaSizeKb || 320;
    const maxKb = card.mediaType === 'video'
      ? cropInfo.spec.maxVideoKb
      : card.mediaType === 'gif'
        ? cropInfo.spec.maxGifKb
        : cropInfo.spec.maxImageKb;
    const sizeOk = sizeKb <= maxKb;

    return `
      <!-- Multi-Card Switcher (when Carousel or Stacked Multi-Card is active) -->
      ${isMulti ? `
        <div class="rcs-card-switcher">
          <div class="rcs-card-pills">
            ${payload.cards.map((c, idx) => `
              <button type="button" class="rcs-card-pill ${idx === activeCardIndex ? 'is-active' : ''}" data-card-idx="${idx}">
                #${idx + 1} ${this.escapeHtml((c.title || 'Card').slice(0, 14))}
              </button>
            `).join('')}
          </div>
          <div class="rcs-card-actions">
            <button type="button" class="rcs-icon-btn" id="rcs-add-card-btn" title="Add Card (max 10 in Carousel)" ${payload.cards.length >= 10 ? 'disabled' : ''}>
              ${getIcon('plus')} <span>Card</span>
            </button>
            ${payload.cards.length > 2 ? `
              <button type="button" class="rcs-icon-btn is-danger" id="rcs-del-card-btn" title="Remove active card">
                ${getIcon('trash')}
              </button>
            ` : ''}
          </div>
        </div>
      ` : ''}

      <!-- Geometry & Media Crop Section (Hidden in pure text/SMS mode) -->
      ${(!isTextOnly && !isSms) ? `
        <div class="rcs-panel-section">
          <div class="rcs-section-head">
            <span class="rcs-section-title">
              ${getIcon('crop')} Media Geometry & Safe-Zone Crop
              ${renderDocLink(RCS_DOCS.media.url, 'Official Media Sizes, Heights & Center-Crop Spec')}
            </span>
            <label class="rcs-toggle-pill" title="Highlight cropped vs visible zones on the preview">
              <input type="checkbox" id="rcs-crop-guide-toggle" ${showCropGuides ? 'checked' : ''}/>
              <span>Show Crop Overlay</span>
            </label>
          </div>

          <div class="rcs-geometry-grid">
            ${!isHorizontal ? `
              <div class="rcs-field-group">
                <label class="rcs-field-label">
                  Media Height (dp) ${renderDocLink(RCS_DOCS.richCards.url, 'CardMedia.Height: SHORT (112dp), MEDIUM (168dp), TALL (264dp)')}
                </label>
                <div class="rcs-segmented">
                  ${['SHORT', 'MEDIUM', 'TALL'].map((hKey) => `
                    <button type="button" class="rcs-seg-btn ${payload.mediaHeight === hKey ? 'is-active' : ''}" data-media-height="${hKey}">
                      <strong>${hKey}</strong>
                      <small>${MEDIA_SPECS[hKey].dpHeight}dp</small>
                    </button>
                  `).join('')}
                </div>
              </div>
            ` : `
              <div class="rcs-field-group">
                <label class="rcs-field-label">
                  Thumbnail Side ${renderDocLink(RCS_DOCS.richCards.url, 'Horizontal Rich Card ThumbnailAlignment')}
                </label>
                <div class="rcs-segmented">
                  ${['LEFT', 'RIGHT'].map((side) => `
                    <button type="button" class="rcs-seg-btn ${payload.thumbnailAlignment === side ? 'is-active' : ''}" data-thumb-align="${side}">
                      <strong>${side}</strong>
                      <small>128dp</small>
                    </button>
                  `).join('')}
                </div>
              </div>
            `}

            ${isCarousel ? `
              <div class="rcs-field-group">
                <label class="rcs-field-label">
                  Carousel Width ${renderDocLink(RCS_DOCS.carousels.url, 'CarouselCard.CardWidth: SMALL (120dp) or MEDIUM (200dp)')}
                </label>
                <div class="rcs-segmented">
                  ${['SMALL', 'MEDIUM'].map((wKey) => `
                    <button type="button" class="rcs-seg-btn ${payload.cardWidth === wKey ? 'is-active' : ''}" data-card-width="${wKey}">
                      <strong>${wKey}</strong>
                      <small>${CAROUSEL_WIDTH_SPECS[wKey].rawSpecDp}dp</small>
                    </button>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Interactive Crop & File Size Diagnostic Box -->
          <div class="rcs-crop-diagnostic">
            <div class="rcs-crop-minimap" title="Visual representation of how RCS center-crops your media">
              <div class="rcs-crop-stage" style="aspect-ratio: ${cropInfo.srcW} / ${cropInfo.srcH}; background-image: url('${card.mediaUrl}')">
                <div class="rcs-crop-mask is-${cropInfo.cropAxis}" style="
                  ${cropInfo.cropAxis === 'horizontal'
                    ? `width: ${Math.round(cropInfo.visibleFraction * 100)}%; height: 100%;`
                    : cropInfo.cropAxis === 'vertical'
                      ? `width: 100%; height: ${Math.round(cropInfo.visibleFraction * 100)}%;`
                      : 'width: 100%; height: 100%;'}
                ">
                  <span class="rcs-crop-safe-tag">SAFE VISIBLE ZONE</span>
                </div>
              </div>
            </div>

            <div class="rcs-crop-stats">
              <div class="rcs-spec-pill">
                <span class="rcs-spec-k">Rec. Size:</span>
                <strong class="rcs-spec-v">${cropInfo.recText}</strong>
              </div>
              <div class="rcs-spec-pill">
                <span class="rcs-spec-k">Current Asset:</span>
                <strong class="rcs-spec-v ${sizeOk ? 'is-ok' : 'is-warn'}">
                  ${cropInfo.srcW}×${cropInfo.srcH} px • ${sizeKb} KB (${(card.mediaType || 'image').toUpperCase()})
                </strong>
              </div>
              <div class="rcs-spec-pill">
                <span class="rcs-spec-k">Center-Crop:</span>
                <strong class="rcs-spec-v ${cropInfo.croppedPercent > 20 ? 'is-warn' : 'is-ok'}">
                  ${cropInfo.croppedPercent === 0
                    ? 'Exact aspect match (0% cropped)'
                    : `${cropInfo.croppedPercent}% cropped (${cropInfo.cropAxis === 'horizontal' ? 'left/right edges' : 'top/bottom edges'})`}
                </strong>
              </div>

              <div class="rcs-upload-row">
                <label class="rcs-upload-btn">
                  ${getIcon('upload')} <span>Upload Image / GIF / MP4</span>
                  <input type="file" id="rcs-media-file-input" accept="image/*,video/mp4,video/webm" hidden />
                </label>
                <button type="button" class="rcs-btn-ghost" id="rcs-sample-gif-btn" title="Load animated GIF/Video simulation">
                  ${getIcon('play')} <span>Demo Animated Media</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Text Recommendations & Content Inputs -->
      <div class="rcs-panel-section">
        <div class="rcs-section-head">
          <span class="rcs-section-title">
            Text & Copy Recommendations
            ${renderDocLink(RCS_DOCS.richCards.url, 'Title (max 200 chars) & Description (max 2,000 chars)')}
          </span>
        </div>

        ${!isTextOnly && !isSms ? `
          <div class="rcs-field-group">
            <div class="rcs-label-row">
              <label for="rcs-card-title" class="rcs-field-label">
                Card Title ${renderDocLink(TEXT_LIMITS.title.docUrl, TEXT_LIMITS.title.hint)}
              </label>
              <span class="rcs-micro-hint">Rec ≤ 40 chars (max 200)</span>
            </div>
            <input type="text" id="rcs-card-title" class="rcs-input" value="${this.escapeHtml(card.title)}" maxlength="220" placeholder="Enter headline..." />
            ${this.renderCharMeter(card.title, TEXT_LIMITS.title)}
          </div>
        ` : ''}

        <div class="rcs-field-group">
          <div class="rcs-label-row">
            <label for="rcs-card-desc" class="rcs-field-label">
              ${isSms ? 'SMS Message Body' : isTextOnly ? 'RCS Message Text' : 'Card Description'}
              ${renderDocLink(isSms ? TEXT_LIMITS.smsFallback.docUrl : TEXT_LIMITS.description.docUrl, isSms ? TEXT_LIMITS.smsFallback.hint : TEXT_LIMITS.description.hint)}
            </label>
            <span class="rcs-micro-hint">${isSms ? '160 GSM-7 / 70 Unicode' : 'Rec ≤ 140 chars before fold'}</span>
          </div>
          <textarea id="rcs-card-desc" class="rcs-textarea" rows="3" placeholder="Enter message description...">${this.escapeHtml(card.description)}</textarea>
          ${this.renderCharMeter(card.description, isSms ? { recommended: 160, max: 320 } : TEXT_LIMITS.description)}
        </div>
      </div>

      <!-- Suggested Replies & Actions (Up to 4 per card) -->
      ${!isSms ? `
        <div class="rcs-panel-section">
          <div class="rcs-section-head">
            <span class="rcs-section-title">
              Suggested Actions & Replies (${(card.suggestions || []).length}/4)
              ${renderDocLink(RCS_DOCS.suggestedActions.url, 'Up to 4 Suggested Actions / Replies per card (max 25 chars each)')}
            </span>
            <button type="button" class="rcs-icon-btn" id="rcs-add-suggestion-btn" ${(card.suggestions || []).length >= 4 ? 'disabled' : ''}>
              ${getIcon('plus')} <span>Add Action</span>
            </button>
          </div>

          <div class="rcs-suggestions-list">
            ${(card.suggestions || []).map((sug, sIdx) => {
              const sugLen = Array.from(sug.text || '').length;
              const isOver = sugLen > TEXT_LIMITS.suggestionText.max;
              return `
                <div class="rcs-sug-row" data-sug-idx="${sIdx}">
                  <select class="rcs-sug-type" data-sug-idx="${sIdx}" title="Action Type">
                    ${Object.values(ACTION_TYPES).map((a) => `
                      <option value="${a.id}" ${sug.type === a.id ? 'selected' : ''}>${a.label}</option>
                    `).join('')}
                  </select>
                  <div class="rcs-sug-input-wrap">
                    <input type="text" class="rcs-input rcs-sug-text" data-sug-idx="${sIdx}" value="${this.escapeHtml(sug.text)}" placeholder="Button label (≤25 chars)" />
                    <span class="rcs-sug-counter ${isOver ? 'is-danger' : sugLen > 20 ? 'is-warn' : ''}" title="Max 25 chars">${sugLen}/25</span>
                  </div>
                  <input type="text" class="rcs-input rcs-sug-val" data-sug-idx="${sIdx}" value="${this.escapeHtml(sug.value || '')}" placeholder="URL / Phone / Payload" />
                  ${renderDocLink(ACTION_TYPES[sug.type]?.docUrl || RCS_DOCS.suggestedActions.url, `${ACTION_TYPES[sug.type]?.label || 'Action'} API Spec`)}
                  <button type="button" class="rcs-sug-del" data-sug-idx="${sIdx}" title="Remove button">${getIcon('trash')}</button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}
    `;
  }

  renderAgentTab({ agent, agentDetected }) {
    return `
      <div class="rcs-panel-section">
        <div class="rcs-section-head">
          <span class="rcs-section-title">
            ${getIcon('verified')} RBM Agent Identity & Brand Detection
            ${renderDocLink(RCS_DOCS.agentInfo.url, 'Official Google RBM Agent Brand & Verification Spec')}
          </span>
          <div class="rcs-agent-detect-actions">
            <button type="button" class="rcs-btn-ghost" id="rcs-simulate-missing-agent" title="Test fallback when agent brand info is not detected">
              ${agentDetected ? 'Simulate Missing Agent' : 'Restore Detected Agent'}
            </button>
          </div>
        </div>

        <div class="rcs-agent-banner ${agentDetected ? 'is-detected' : 'is-fallback'}">
          <span>${agentDetected
            ? '✓ Brand metadata & colors synced from RBM Agent profile.'
            : '⚠ Agent metadata not detected — using customizable generic preview fallback.'}</span>
        </div>

        <div class="rcs-agent-grid">
          <div class="rcs-field-group">
            <label class="rcs-field-label" for="rcs-agent-name">
              Brand / Agent Display Name ${renderDocLink(RCS_DOCS.agentInfo.url, 'Agent Display Name shown in top bar & profile header')}
            </label>
            <input type="text" id="rcs-agent-name" class="rcs-input" value="${this.escapeHtml(agent.name)}" />
          </div>

          <div class="rcs-field-group">
            <label class="rcs-field-label" for="rcs-agent-color">
              Brand Color & Avatar Shape ${renderDocLink(RCS_DOCS.agentInfo.url, 'Agent hex color & logo styling')}
            </label>
            <div class="rcs-color-row">
              <input type="color" id="rcs-agent-color" class="rcs-color-picker" value="${agent.color || '#D61F26'}" />
              <input type="text" id="rcs-agent-color-hex" class="rcs-input rcs-hex-input" value="${this.escapeHtml(agent.color || '#D61F26')}" />
              <select id="rcs-agent-shape" class="rcs-select-compact">
                <option value="rounded" ${agent.avatarShape === 'rounded' ? 'selected' : ''}>Rounded Square</option>
                <option value="circle" ${agent.avatarShape === 'circle' ? 'selected' : ''}>Circle Avatar</option>
              </select>
            </div>
          </div>
        </div>

        <div class="rcs-field-group">
          <label class="rcs-field-label" for="rcs-agent-tagline">Agent Description / Tagline (shown in top profile header)</label>
          <input type="text" id="rcs-agent-tagline" class="rcs-input" value="${this.escapeHtml(agent.tagline || '')}" />
        </div>

        <div class="rcs-upload-row">
          <label class="rcs-upload-btn">
            ${getIcon('upload')} <span>Upload Brand Logo (Auto-Extracts Color)</span>
            <input type="file" id="rcs-agent-logo-input" accept="image/*" hidden />
          </label>
          <label class="rcs-toggle-pill">
            <input type="checkbox" id="rcs-agent-verified" ${agent.verified ? 'checked' : ''} />
            <span>Verified Badge</span>
          </label>
        </div>

        <div class="rcs-section-head" style="margin-top:8px">
          <span class="rcs-section-title">Real Conversation Chrome Toggles (from Screenshots)</span>
        </div>
        <div class="rcs-chrome-toggles">
          <label class="rcs-toggle-pill">
            <input type="checkbox" id="rcs-show-agent-header" ${agent.showAgentHeader ? 'checked' : ''} />
            <span>Large Profile Header (TIPOS style)</span>
          </label>
          <label class="rcs-toggle-pill">
            <input type="checkbox" id="rcs-show-rbm-notice" ${agent.showRbmChatNotice !== false ? 'checked' : ''} />
            <span>"This is an RCS for Business chat."</span>
          </label>
          <label class="rcs-toggle-pill">
            <input type="checkbox" id="rcs-show-spam-banner" ${agent.showSpamBanner ? 'checked' : ''} />
            <span>"block & report" Shield Banner (Telekom style)</span>
          </label>
          <label class="rcs-toggle-pill">
            <input type="checkbox" id="rcs-show-scroll-btn" ${agent.showScrollDownBtn ? 'checked' : ''} />
            <span>Floating Scroll-Down ↓ Button</span>
          </label>
        </div>
      </div>
    `;
  }

  renderFallbackTab({ payload, smsAnalysis }) {
    return `
      <div class="rcs-panel-section">
        <div class="rcs-section-head">
          <span class="rcs-section-title">
            ${getIcon('sms')} SMS Fallback System & Segment Calculator
            ${renderDocLink(RCS_DOCS.fallback.url, 'Official RCS-to-SMS Fallback & Revoke API Spec')}
          </span>
          <button type="button" class="rcs-btn-ghost" id="rcs-autogenerate-fallback">
            Auto-Generate from Rich Card
          </button>
        </div>

        <div class="rcs-field-group">
          <label class="rcs-field-label" for="rcs-fallback-text">
            Fallback SMS Text (sent automatically when recipient device is offline or lacks RCS)
          </label>
          <textarea id="rcs-fallback-text" class="rcs-textarea" rows="3">${this.escapeHtml(payload.smsFallbackText || '')}</textarea>
          <div class="rcs-sms-stats">
            <span class="rcs-sms-pill">Encoding: <strong>${smsAnalysis.encoding}</strong></span>
            <span class="rcs-sms-pill">Length: <strong>${smsAnalysis.length} chars</strong></span>
            <span class="rcs-sms-pill ${smsAnalysis.segments > 1 ? 'is-warn' : 'is-ok'}">
              Segments: <strong>${smsAnalysis.segments} SMS</strong> (${smsAnalysis.remaining} chars left in segment)
            </span>
          </div>
        </div>
      </div>

      <div class="rcs-panel-section">
        <div class="rcs-section-head">
          <span class="rcs-section-title">
            ${getIcon('play')} Interactive Conversation & Animation Simulator
          </span>
        </div>
        <p class="rcs-micro-copy">
          Test how bubbles, typing indicators, user taps, and rich cards animate in real time inside the phone preview.
        </p>
        <div class="rcs-flow-buttons">
          <button type="button" class="rcs-btn-primary" data-flow-action="play-full-conversation">
            ${getIcon('play')} Simulate Animated Conversation Flow
          </button>
          <button type="button" class="rcs-btn-ghost" data-flow-action="push-user-msg">
            + User Bubble ("Chcem ponuku")
          </button>
          <button type="button" class="rcs-btn-ghost" data-flow-action="toggle-sms-fallback-view">
            ⇄ Toggle SMS Fallback View in Phone
          </button>
        </div>
      </div>
    `;
  }

  renderJsonTab({ payload, agent }) {
    const card = this.getCurrentCard();
    const rbmPayload = {
      contentMessage: payload.templateId === 'carousel'
        ? {
            richCard: {
              carouselCard: {
                cardWidth: payload.cardWidth || 'MEDIUM',
                cardContents: payload.cards.map((c) => ({
                  title: c.title,
                  description: c.description,
                  media: {
                    height: payload.mediaHeight || 'TALL',
                    contentInfo: { fileUrl: c.mediaUrl.slice(0, 64) + '...', forceRefresh: false }
                  },
                  suggestions: (c.suggestions || []).map((s) => ({
                    [s.type === 'reply' ? 'reply' : 'action']: {
                      text: s.text,
                      postbackData: s.value || s.text
                    }
                  }))
                }))
              }
            }
          }
        : {
            richCard: {
              standaloneCard: {
                cardOrientation: payload.templateId === 'standalone_horizontal' ? 'HORIZONTAL' : 'VERTICAL',
                ...(payload.templateId === 'standalone_horizontal'
                  ? { thumbnailImageAlignment: payload.thumbnailAlignment || 'LEFT' }
                  : {}),
                cardContent: {
                  title: card.title,
                  description: card.description,
                  media: {
                    height: payload.mediaHeight || 'TALL',
                    contentInfo: { fileUrl: card.mediaUrl.slice(0, 64) + '...', forceRefresh: false }
                  },
                  suggestions: (card.suggestions || []).map((s) => ({
                    [s.type === 'reply' ? 'reply' : 'action']: {
                      text: s.text,
                      postbackData: s.value || s.text
                    }
                  }))
                }
              }
            }
          },
      agentInfo: {
        displayName: agent.name,
        verified: agent.verified,
        brandColor: agent.color
      },
      fallbackSms: payload.smsFallbackText
    };

    return `
      <div class="rcs-panel-section">
        <div class="rcs-section-head">
          <span class="rcs-section-title">
            ${getIcon('code')} Google RBM API Payload (v1/phones.agentMessages)
            ${renderDocLink(RCS_DOCS.restReference.url, 'Official AgentContentMessage REST Reference')}
          </span>
          <button type="button" class="rcs-btn-ghost" id="rcs-copy-json-btn">Copy JSON</button>
        </div>
        <pre class="rcs-json-pre"><code>${this.escapeHtml(JSON.stringify(rbmPayload, null, 2))}</code></pre>
      </div>
    `;
  }

  attachEvents() {
    // Preset switcher
    const presetSelect = this.root.querySelector('#rcs-preset-select');
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => this.loadPreset(e.target.value));
    }

    // Template strip buttons
    this.root.querySelectorAll('[data-tpl-id]').forEach((btn) => {
      btn.addEventListener('click', () => this.selectTemplate(btn.dataset.tplId));
    });

    // Subtabs
    this.root.querySelectorAll('[data-subtab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.state.activeSubTab = btn.dataset.subtab;
        this.render();
        this.attachEvents();
      });
    });

    // Multi-card switcher pills
    this.root.querySelectorAll('[data-card-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.state.activeCardIndex = Number(btn.dataset.cardIdx);
        this.render();
        this.attachEvents();
        this.emitChange('card-switch');
      });
    });

    const addCardBtn = this.root.querySelector('#rcs-add-card-btn');
    if (addCardBtn) {
      addCardBtn.addEventListener('click', () => {
        const clone = structuredClone(this.getCurrentCard());
        clone.id = `card-${Date.now()}`;
        clone.title = `Offer Card #${this.state.payload.cards.length + 1}`;
        this.state.payload.cards.push(clone);
        this.state.activeCardIndex = this.state.payload.cards.length - 1;
        this.render();
        this.attachEvents();
        this.emitChange('card-add');
      });
    }

    const delCardBtn = this.root.querySelector('#rcs-del-card-btn');
    if (delCardBtn) {
      delCardBtn.addEventListener('click', () => {
        if (this.state.payload.cards.length <= 1) return;
        this.state.payload.cards.splice(this.state.activeCardIndex, 1);
        this.state.activeCardIndex = Math.max(0, this.state.activeCardIndex - 1);
        this.render();
        this.attachEvents();
        this.emitChange('card-delete');
      });
    }

    // Media height buttons
    this.root.querySelectorAll('[data-media-height]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.state.payload.mediaHeight = btn.dataset.mediaHeight;
        this.render();
        this.attachEvents();
        this.emitChange('media-height');
      });
    });

    // Horizontal alignment buttons
    this.root.querySelectorAll('[data-thumb-align]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.state.payload.thumbnailAlignment = btn.dataset.thumbAlign;
        this.render();
        this.attachEvents();
        this.emitChange('thumb-align');
      });
    });

    // Carousel width buttons
    this.root.querySelectorAll('[data-card-width]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.state.payload.cardWidth = btn.dataset.cardWidth;
        this.render();
        this.attachEvents();
        this.emitChange('card-width');
      });
    });

    // Crop guide toggle
    const cropToggle = this.root.querySelector('#rcs-crop-guide-toggle');
    if (cropToggle) {
      cropToggle.addEventListener('change', (e) => {
        this.state.showCropGuides = e.target.checked;
        this.emitChange('crop-guide-toggle');
      });
    }

    // Upload media (Image / GIF / Video)
    const fileInput = this.root.querySelector('#rcs-media-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const card = this.getCurrentCard();
        card.mediaSizeKb = Math.max(1, Math.round(file.size / 1024));
        const isVideo = file.type.startsWith('video/');
        const isGif = file.type === 'image/gif';
        card.mediaType = isVideo ? 'video' : isGif ? 'gif' : 'image';

        const reader = new FileReader();
        reader.onload = () => {
          card.mediaUrl = reader.result;
          if (!isVideo) {
            const img = new Image();
            img.onload = () => {
              card.mediaDimensions = { width: img.naturalWidth || 1200, height: img.naturalHeight || 800 };
              this.render();
              this.attachEvents();
              this.emitChange('media-upload');
            };
            img.src = reader.result;
          } else {
            card.mediaDimensions = { width: 1280, height: 720 };
            this.render();
            this.attachEvents();
            this.emitChange('media-upload');
          }
        };
        reader.readAsDataURL(file);
      });
    }

    // Demo animated media button
    const sampleGifBtn = this.root.querySelector('#rcs-sample-gif-btn');
    if (sampleGifBtn) {
      sampleGifBtn.addEventListener('click', () => {
        const card = this.getCurrentCard();
        card.mediaType = 'gif';
        card.mediaSizeKb = 1180;
        card.mediaDimensions = { width: 1200, height: 900 };
        const animatedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
          <defs>
            <linearGradient id="ag" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#0F172A"/>
              <stop offset="100%" stop-color="#1E3A8A"/>
            </linearGradient>
          </defs>
          <rect width="1200" height="900" fill="url(#ag)"/>
          <circle cx="600" cy="450" r="220" fill="#38BDF8" opacity="0.2">
            <animate attributeName="r" values="180;290;180" dur="2.6s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.3;0.08;0.3" dur="2.6s" repeatCount="indefinite"/>
          </circle>
          <rect x="250" y="290" width="700" height="320" rx="36" fill="#0284C7" stroke="#7DD3FC" stroke-width="4"/>
          <text x="600" y="425" fill="#ffffff" font-family="system-ui, sans-serif" font-size="68" font-weight="900" text-anchor="middle">⚡ LIVE ANIMATED GIF</text>
          <text x="600" y="515" fill="#E0F2FE" font-family="system-ui, sans-serif" font-size="40" font-weight="700" text-anchor="middle">Auto-Plays Inline in RCS Chat</text>
        </svg>`;
        card.mediaUrl = `data:image/svg+xml;utf8,${encodeURIComponent(animatedSvg)}`;
        this.render();
        this.attachEvents();
        this.emitChange('media-animated-demo');
      });
    }

    // Title & Description live input
    const titleInput = this.root.querySelector('#rcs-card-title');
    if (titleInput) {
      titleInput.addEventListener('input', (e) => {
        const card = this.getCurrentCard();
        card.title = e.target.value;
        this.updateMetersInPlace();
        this.emitChange('title-input');
      });
    }

    const descInput = this.root.querySelector('#rcs-card-desc');
    if (descInput) {
      descInput.addEventListener('input', (e) => {
        const card = this.getCurrentCard();
        card.description = e.target.value;
        if (this.state.payload.templateId === 'sms_regular') {
          this.state.payload.smsFallbackText = e.target.value;
        }
        this.updateMetersInPlace();
        this.emitChange('desc-input');
      });
    }

    // Suggestions add/edit/remove
    const addSugBtn = this.root.querySelector('#rcs-add-suggestion-btn');
    if (addSugBtn) {
      addSugBtn.addEventListener('click', () => {
        const card = this.getCurrentCard();
        card.suggestions = card.suggestions || [];
        if (card.suggestions.length >= 4) return;
        card.suggestions.push({
          id: `sug-${Date.now()}`,
          type: 'url',
          text: 'Open Offer',
          value: 'https://example.com'
        });
        this.render();
        this.attachEvents();
        this.emitChange('suggestion-add');
      });
    }

    this.root.querySelectorAll('.rcs-sug-type').forEach((sel) => {
      sel.addEventListener('change', (e) => {
        const idx = Number(sel.dataset.sugIdx);
        const card = this.getCurrentCard();
        if (card.suggestions?.[idx]) {
          card.suggestions[idx].type = e.target.value;
          this.render();
          this.attachEvents();
          this.emitChange('suggestion-type');
        }
      });
    });

    this.root.querySelectorAll('.rcs-sug-text').forEach((inp) => {
      inp.addEventListener('input', (e) => {
        const idx = Number(inp.dataset.sugIdx);
        const card = this.getCurrentCard();
        if (card.suggestions?.[idx]) {
          card.suggestions[idx].text = e.target.value;
          const counter = inp.parentElement.querySelector('.rcs-sug-counter');
          if (counter) {
            const len = Array.from(e.target.value).length;
            counter.textContent = `${len}/25`;
            counter.className = `rcs-sug-counter ${len > 25 ? 'is-danger' : len > 20 ? 'is-warn' : ''}`;
          }
          this.emitChange('suggestion-text');
        }
      });
    });

    this.root.querySelectorAll('.rcs-sug-val').forEach((inp) => {
      inp.addEventListener('input', (e) => {
        const idx = Number(inp.dataset.sugIdx);
        const card = this.getCurrentCard();
        if (card.suggestions?.[idx]) {
          card.suggestions[idx].value = e.target.value;
          this.emitChange('suggestion-val');
        }
      });
    });

    this.root.querySelectorAll('.rcs-sug-del').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.sugIdx);
        const card = this.getCurrentCard();
        card.suggestions.splice(idx, 1);
        this.render();
        this.attachEvents();
        this.emitChange('suggestion-delete');
      });
    });

    // Agent tab events
    const simMissingBtn = this.root.querySelector('#rcs-simulate-missing-agent');
    if (simMissingBtn) {
      simMissingBtn.addEventListener('click', () => {
        if (this.state.agentDetected) {
          this.setAgentFromExternal(null);
        } else {
          const preset = REAL_CAMPAIGN_PRESETS[this.state.activePresetId] || REAL_CAMPAIGN_PRESETS.tipos_lottery;
          this.setAgentFromExternal(structuredClone(preset.agent));
        }
      });
    }

    const agentName = this.root.querySelector('#rcs-agent-name');
    if (agentName) {
      agentName.addEventListener('input', (e) => {
        this.state.agent.name = e.target.value;
        this.emitChange('agent-name');
      });
    }

    const agentColor = this.root.querySelector('#rcs-agent-color');
    const agentColorHex = this.root.querySelector('#rcs-agent-color-hex');
    if (agentColor && agentColorHex) {
      agentColor.addEventListener('input', (e) => {
        this.state.agent.color = e.target.value;
        agentColorHex.value = e.target.value;
        this.emitChange('agent-color');
      });
      agentColorHex.addEventListener('input', (e) => {
        if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
          this.state.agent.color = e.target.value;
          agentColor.value = e.target.value;
          this.emitChange('agent-color');
        }
      });
    }

    const agentShape = this.root.querySelector('#rcs-agent-shape');
    if (agentShape) {
      agentShape.addEventListener('change', (e) => {
        this.state.agent.avatarShape = e.target.value;
        this.emitChange('agent-shape');
      });
    }

    const agentTagline = this.root.querySelector('#rcs-agent-tagline');
    if (agentTagline) {
      agentTagline.addEventListener('input', (e) => {
        this.state.agent.tagline = e.target.value;
        this.emitChange('agent-tagline');
      });
    }

    const agentLogoInput = this.root.querySelector('#rcs-agent-logo-input');
    if (agentLogoInput) {
      agentLogoInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          this.state.agent.logoUrl = reader.result;
          this.extractDominantColor(reader.result, (hex) => {
            if (hex) this.state.agent.color = hex;
            this.render();
            this.attachEvents();
            this.emitChange('agent-logo');
          });
        };
        reader.readAsDataURL(file);
      });
    }

    const bindCheckbox = (selector, prop) => {
      const el = this.root.querySelector(selector);
      if (el) {
        el.addEventListener('change', (e) => {
          this.state.agent[prop] = e.target.checked;
          this.emitChange(`agent-${prop}`);
        });
      }
    };
    bindCheckbox('#rcs-agent-verified', 'verified');
    bindCheckbox('#rcs-show-agent-header', 'showAgentHeader');
    bindCheckbox('#rcs-show-rbm-notice', 'showRbmChatNotice');
    bindCheckbox('#rcs-show-spam-banner', 'showSpamBanner');
    bindCheckbox('#rcs-show-scroll-btn', 'showScrollDownBtn');

    // Fallback tab events
    const fallbackInput = this.root.querySelector('#rcs-fallback-text');
    if (fallbackInput) {
      fallbackInput.addEventListener('input', (e) => {
        this.state.payload.smsFallbackText = e.target.value;
        this.render();
        this.attachEvents();
        const textarea = this.root.querySelector('#rcs-fallback-text');
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }
        this.emitChange('fallback-text');
      });
    }

    const autoGenFallback = this.root.querySelector('#rcs-autogenerate-fallback');
    if (autoGenFallback) {
      autoGenFallback.addEventListener('click', () => {
        const card = this.getCurrentCard();
        const firstUrl = (card.suggestions || []).find((s) => s.type === 'url' || s.type === 'webview')?.value || 'https://r.bzn.sk/m';
        this.state.payload.smsFallbackText = `${this.state.agent.name}: ${card.title} - ${(card.description || '').replace(/\s+/g, ' ').slice(0, 90)} ${firstUrl}`;
        this.render();
        this.attachEvents();
        this.emitChange('fallback-autogen');
      });
    }

    this.root.querySelectorAll('[data-flow-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.flowAction;
        this.root.dispatchEvent(new CustomEvent('rcs:flow-action', {
          detail: { action, state: this.getState() },
          bubbles: true,
          composed: true
        }));
        if (this.onTriggerFlow) {
          this.onTriggerFlow(action, this.getState());
        }
      });
    });

    const copyJsonBtn = this.root.querySelector('#rcs-copy-json-btn');
    if (copyJsonBtn) {
      copyJsonBtn.addEventListener('click', () => {
        const code = this.root.querySelector('.rcs-json-pre')?.textContent || '';
        navigator.clipboard?.writeText(code);
        copyJsonBtn.textContent = '✓ Copied!';
        setTimeout(() => { copyJsonBtn.textContent = 'Copy JSON'; }, 1500);
      });
    }
  }

  updateMetersInPlace() {
    const card = this.getCurrentCard();
    const titleInput = this.root.querySelector('#rcs-card-title');
    if (titleInput && titleInput.nextElementSibling) {
      titleInput.nextElementSibling.outerHTML = this.renderCharMeter(card.title, TEXT_LIMITS.title);
    }
    const descInput = this.root.querySelector('#rcs-card-desc');
    if (descInput && descInput.nextElementSibling) {
      const isSms = this.state.payload.templateId === 'sms_regular';
      descInput.nextElementSibling.outerHTML = this.renderCharMeter(
        card.description,
        isSms ? { recommended: 160, max: 320 } : TEXT_LIMITS.description
      );
    }
  }

  extractDominantColor(dataUrl, callback) {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 16, 16);
        const data = ctx.getImageData(4, 4, 8, 8).data;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] > 128) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
          }
        }
        if (count > 0) {
          const toHex = (n) => Math.round(n / count).toString(16).padStart(2, '0');
          callback(`#${toHex(r)}${toHex(g)}${toHex(b)}`);
          return;
        }
      } catch (_) {
        // ignore canvas errors
      }
      callback(null);
    };
    img.onerror = () => callback(null);
    img.src = dataUrl;
  }

  escapeHtml(str = '') {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// Register agnostic Custom Element <rcs-template-chooser>
if (typeof window !== 'undefined' && !customElements.get('rcs-template-chooser')) {
  class RcsTemplateChooserElement extends HTMLElement {
    connectedCallback() {
      if (!this.instance) {
        const preset = this.getAttribute('preset') || 'tipos_lottery';
        this.instance = new RcsTemplateChooser(this, { initialPreset: preset });
      }
    }
  }
  customElements.define('rcs-template-chooser', RcsTemplateChooserElement);
}
