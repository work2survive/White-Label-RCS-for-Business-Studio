/**
 * @fileoverview Agnostic Mobile Phone RCS & SMS Preview Module (`RcsPhonePreview`).
 * Can be used completely independently via `new RcsPhonePreview(el, options)` or `<rcs-phone-preview>`.
 * Accurately simulates Google Messages (Android 14/15 Material 3), Samsung Messages (One UI),
 * and Apple iOS 18+ RCS in Light & Dark themes across popular phone models, with interactive
 * carousel dragging, thumbnail lightbox, action sheets, bubble entrance animations, SMS fallback,
 * zoom controls, and real-time reporting/telemetry event emission.
 */

import {
  RCS_DOCS,
  MEDIA_SPECS,
  CAROUSEL_WIDTH_SPECS,
  DEVICE_PRESETS,
  OS_APP_SKINS,
  REAL_CAMPAIGN_PRESETS,
  analyzeSmsSegments,
  evaluateMediaCrop
} from './rcs-specs.js';
import { getIcon, renderDocLink } from './icons.js';

export class RcsPhonePreview {
  /**
   * @param {HTMLElement|string} container
   * @param {Object} options
   */
  constructor(container, options = {}) {
    this.root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!this.root) {
      throw new Error('RcsPhonePreview: valid target container element is required.');
    }

    const defaultPreset = REAL_CAMPAIGN_PRESETS[options.initialPreset || 'tipos_lottery'];

    this.devices = structuredClone(DEVICE_PRESETS);
    this.skins = structuredClone(OS_APP_SKINS);

    this.state = {
      deviceId: options.deviceId || 'pixel_9_pro',
      skinId: options.skinId || 'google_messages_m3',
      theme: options.theme || 'light', // 'light' | 'dark'
      zoom: options.zoom || 0.76, // Fits 720p viewport cleanly by default
      autoFit: options.autoFit !== false,
      channelOverride: null, // null | 'sms_fallback'
      showCropGuides: options.showCropGuides ?? true,
      showRealRefOverlay: false,
      referenceScreenshot: defaultPreset.referenceScreenshot,
      agent: structuredClone(options.agent || defaultPreset.agent),
      payload: structuredClone(options.payload || defaultPreset.payload),
      conversationHistory: [], // Additional interactive messages in the feed
      isTyping: false,
      activeModal: null, // { type: 'lightbox' | 'webview' | 'dial' | 'location' | 'calendar' | 'preset-Modal', data: ... }
      expandedDescriptions: new Set(),
      telemetryCount: 0
    };

    this.onTelemetry = typeof options.onTelemetry === 'function' ? options.onTelemetry : null;

    this.render();
    this.attachEvents();
    this.logTelemetry('PREVIEW_INIT', {
      device: this.state.deviceId,
      skin: this.state.skinId,
      template: this.state.payload.templateId
    });
  }

  /**
   * Public API: Update message payload, agent branding, and crop guide visibility
   */
  update({ payload, agent, showCropGuides, referenceScreenshot } = {}) {
    if (payload) this.state.payload = structuredClone(payload);
    if (agent) this.state.agent = structuredClone(agent);
    if (typeof showCropGuides === 'boolean') this.state.showCropGuides = showCropGuides;
    if (referenceScreenshot !== undefined) this.state.referenceScreenshot = referenceScreenshot;

    this.renderViewportOnly();
    this.logTelemetry('CARD_IMPRESSION', {
      templateId: this.state.payload.templateId,
      mediaHeight: this.state.payload.mediaHeight,
      cardsCount: (this.state.payload.cards || []).length
    });
  }

  /**
   * Public API: Trigger interactive conversation animation or SMS fallback switch
   */
  triggerFlowAction(action) {
    if (action === 'toggle-sms-fallback-view') {
      this.state.channelOverride = this.state.channelOverride === 'sms_fallback' ? null : 'sms_fallback';
      this.render();
      this.attachEvents();
      this.logTelemetry('FALLBACK_TRIGGERED', {
        mode: this.state.channelOverride || 'rcs'
      });
      return;
    }

    if (action === 'push-user-msg') {
      this.pushUserMessage('Chcem využiť túto ponuku 👍');
      return;
    }

    if (action === 'play-full-conversation') {
      this.playAnimatedConversation();
    }
  }

  pushUserMessage(text, postback = null) {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    this.state.conversationHistory.push({
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      time: timeStr
    });
    this.renderViewportOnly();
    this.scrollToBottom();
    this.logTelemetry('USER_MESSAGE_SENT', { text, postback });

    // Simulate Agent typing & automated follow-up response
    this.state.isTyping = true;
    this.renderViewportOnly();
    this.scrollToBottom();

    setTimeout(() => {
      this.state.isTyping = false;
      this.state.conversationHistory.push({
        id: `msg-${Date.now()}-agent`,
        sender: 'agent',
        text: `✓ Ďakujeme! Vaša požiadavka ("${text}") bola spracovaná cez ${this.state.agent.name}.`,
        time: timeStr
      });
      this.renderViewportOnly();
      this.scrollToBottom();
      this.logTelemetry('AGENT_AUTO_REPLY', { replyTo: text });
    }, 950);
  }

  playAnimatedConversation() {
    this.state.conversationHistory = [];
    this.state.isTyping = true;
    this.renderViewportOnly();

    setTimeout(() => {
      this.state.isTyping = false;
      this.state.conversationHistory.push({
        id: `anim-1`,
        sender: 'user',
        text: 'Ahoj, aké sú dnešné akcie?',
        time: '12:03'
      });
      this.renderViewportOnly();
      this.scrollToBottom();

      setTimeout(() => {
        this.state.isTyping = true;
        this.renderViewportOnly();
        this.scrollToBottom();

        setTimeout(() => {
          this.state.isTyping = false;
          this.renderViewportOnly();
          this.scrollToBottom();
          this.logTelemetry('CONVERSATION_FLOW_COMPLETED', { steps: 2 });
        }, 700);
      }, 450);
    }, 450);
  }

  logTelemetry(eventType, metadata = {}) {
    this.state.telemetryCount += 1;
    const entry = {
      id: this.state.telemetryCount,
      timestamp: new Date().toISOString().slice(11, 19),
      eventType,
      ...metadata
    };
    this.root.dispatchEvent(new CustomEvent('rcs:telemetry', {
      detail: entry,
      bubbles: true,
      composed: true
    }));
    if (this.onTelemetry) {
      this.onTelemetry(entry);
    }
  }

  getCurrentDevice() {
    return this.devices.find((d) => d.id === this.state.deviceId) || this.devices[0];
  }

  getCurrentSkin() {
    return this.skins.find((s) => s.id === this.state.skinId) || this.skins[0];
  }

  render() {
    const device = this.getCurrentDevice();
    const skin = this.getCurrentSkin();
    const isSmsFallback = this.state.channelOverride === 'sms_fallback' || this.state.payload.templateId === 'sms_regular';
    const zoomPct = Math.round(this.state.zoom * 100);

    this.root.innerHTML = `
      <div class="rcs-preview-shell">
        <!-- Top Compact Control Bar -->
        <div class="rcs-preview-toolbar">
          <div class="rcs-module-title">
            <span class="rcs-module-badge is-preview">MODULE 2</span>
            <h2>Device & OS Simulator</h2>
            ${renderDocLink(RCS_DOCS.richCards.url, 'Official RCS UI Rendering Behavior')}
          </div>

          <!-- Phone Hardware Model Selector -->
          <div class="rcs-toolbar-group">
            <select id="rcs-device-select" class="rcs-select-compact" title="Choose Phone Model & Resolution">
              ${this.devices.map((d) => `
                <option value="${d.id}" ${d.id === device.id ? 'selected' : ''}>📱 ${d.name} (${d.aspect})</option>
              `).join('')}
            </select>

            <!-- OS / Messaging App Skin Selector -->
            <select id="rcs-skin-select" class="rcs-select-compact" title="Choose Messaging App UI Version">
              ${this.skins.map((s) => `
                <option value="${s.id}" ${s.id === skin.id ? 'selected' : ''}>💬 ${s.shortName} (${s.version})</option>
              `).join('')}
            </select>

            <!-- Add Custom Device / App Version Preset Button -->
            <button type="button" class="rcs-icon-btn" id="rcs-open-preset-modal" title="Create custom phone resolution, foldable, or future app UI preset">
              ${getIcon('plus')} <span>Preset</span>
            </button>
          </div>

          <!-- Theme, Channel Mode, Real Screenshot Compare & Zoom Controls -->
          <div class="rcs-toolbar-group">
            <button type="button" class="rcs-icon-btn ${isSmsFallback ? 'is-active-warn' : ''}" id="rcs-sms-mode-btn" title="Toggle between RCS Rich Message and SMS Fallback simulation">
              ${getIcon('sms')} <span>${isSmsFallback ? 'SMS Fallback ON' : 'RCS Live'}</span>
            </button>

            <button type="button" class="rcs-icon-btn" id="rcs-theme-btn" title="Switch Light / Dark OS Theme">
              ${getIcon(this.state.theme === 'dark' ? 'sun' : 'moon')}
              <span>${this.state.theme === 'dark' ? 'Dark' : 'Light'}</span>
            </button>

            <button type="button" class="rcs-icon-btn ${this.state.showRealRefOverlay ? 'is-active' : ''}" id="rcs-ref-compare-btn" title="Compare side-by-side with the real mobile screenshot">
              ${getIcon('device')} <span>Real Ref</span>
            </button>

            <div class="rcs-zoom-bar" title="Zoom Preview In / Out">
              <button type="button" class="rcs-zoom-btn" id="rcs-zoom-out" aria-label="Zoom out">${getIcon('zoom-out')}</button>
              <button type="button" class="rcs-zoom-readout" id="rcs-zoom-reset" title="Click to fit 720p screen">${zoomPct}%</button>
              <button type="button" class="rcs-zoom-btn" id="rcs-zoom-in" aria-label="Zoom in">${getIcon('zoom-in')}</button>
            </div>
          </div>
        </div>

        <!-- Sub-bar with hardware specs readout -->
        <div class="rcs-device-subbar">
          <span><strong>${device.name}</strong> • ${device.logicalRes} • ${device.dpi}</span>
          <span>App Skin: <strong>${skin.name}</strong></span>
          <span class="rcs-gesture-hint">💡 Drag carousels, tap thumbnails to zoom, or click buttons to test flow</span>
        </div>

        <!-- Main Stage (Phone Frame + Optional Real Screenshot Reference Comparison) -->
        <div class="rcs-stage-wrap">
          <div class="rcs-phone-scale-container" style="--phone-scale: ${this.state.zoom}; width: ${Math.round(device.width * this.state.zoom)}px; height: ${Math.round(device.height * this.state.zoom)}px;">
            <div class="rcs-phone-hardware is-os-${device.os} is-skin-${skin.id} is-theme-${this.state.theme} is-cutout-${device.cutout}"
                 id="rcs-phone-viewport-host"
                 style="width: ${device.width}px; height: ${device.height}px; border-radius: ${device.bezelRadius}px; --screen-radius: ${device.screenRadius}px;">
              ${this.renderPhoneScreenContents(device, skin, isSmsFallback)}
            </div>
          </div>

          ${this.state.showRealRefOverlay ? this.renderRealScreenshotComparison() : ''}
        </div>
      </div>
    `;
  }

  renderViewportOnly() {
    const host = this.root.querySelector('#rcs-phone-viewport-host');
    if (!host) {
      this.render();
      this.attachEvents();
      return;
    }
    const device = this.getCurrentDevice();
    const skin = this.getCurrentSkin();
    const isSmsFallback = this.state.channelOverride === 'sms_fallback' || this.state.payload.templateId === 'sms_regular';
    host.innerHTML = this.renderPhoneScreenContents(device, skin, isSmsFallback);
    this.attachViewportEvents();
  }

  renderPhoneScreenContents(device, skin, isSmsFallback) {
    const { agent, payload } = this.state;
    const isIos = skin.id === 'ios_18_messages';
    const isSamsung = skin.id === 'samsung_messages_oneui';

    return `
      <!-- Hardware Cutout (Punch-hole / Dynamic Island / Fold Crease) -->
      <div class="rcs-hw-cutout"></div>

      <!-- 1. Authentic Mobile OS Status Bar (Time, Wi-Fi, 4G/5G, Signal, Battery) -->
      <div class="rcs-os-statusbar">
        <div class="rcs-status-left">
          <span class="rcs-status-time">12:04</span>
        </div>
        <div class="rcs-status-right">
          <!-- Vibrate/Alarm icon matching real screenshot -->
          <svg class="rcs-status-ico" viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
            <path d="M2 5h1.5v6H2V5zm10.5 0H14v6h-1.5V5zM5 3h6a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/>
          </svg>
          <!-- Wi-Fi icon -->
          <svg class="rcs-status-ico" viewBox="0 0 16 16" width="13" height="13" fill="currentColor">
            <path d="M8 13.2 1.2 5.4C3.1 3.8 5.4 3 8 3s4.9.8 6.8 2.4L8 13.2z"/>
          </svg>
          <span class="rcs-status-net">${device.networkLabel || '4G'}</span>
          <!-- Signal triangle matching Android status bar -->
          <svg class="rcs-status-ico" viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
            <path d="M1 14h13V1L1 14zm11-2H8V6.5L12 2.5V12z"/>
          </svg>
          <!-- Battery vertical icon -->
          <div class="rcs-status-battery" title="Battery ${device.battery}%">
            <div class="rcs-battery-fill" style="height:${device.battery}%"></div>
          </div>
        </div>
      </div>

      <!-- 2. Messaging App Top Navigation Bar -->
      ${this.renderAppHeader(agent, isIos, isSamsung)}

      <!-- 3. Scrollable Conversation Feed -->
      <div class="rcs-chat-scroll" id="rcs-chat-scroll">
        <!-- Optional Large Centered Agent Info Header (Matches TIPOS Screenshot_20260617-120218.png) -->
        ${agent.showAgentHeader && !isSmsFallback ? `
          <div class="rcs-agent-hero-card">
            <img src="${agent.logoUrl}" alt="${this.escapeHtml(agent.name)}" class="rcs-agent-hero-logo is-${agent.avatarShape || 'rounded'}" />
            <div class="rcs-agent-hero-title">
              <span>${this.escapeHtml(agent.name)}</span>
              ${agent.verified ? `<span class="rcs-verified-badge" title="Verified RCS Business Agent">${getIcon('verified')}</span>` : ''}
            </div>
            ${agent.tagline ? `<p class="rcs-agent-hero-tagline">${this.escapeHtml(agent.tagline)}</p>` : ''}
          </div>
        ` : ''}

        <!-- Conversation Timestamp Pill -->
        <div class="rcs-chat-timestamp">${this.escapeHtml(agent.timestampLabel || 'Thursday, Feb 12 • 22:46')}</div>

        <!-- Optional "This is an RCS for Business chat." notice (Matches Telekom Screenshot_20260617-120327.png) -->
        ${agent.showRbmChatNotice !== false && !isSmsFallback ? `
          <div class="rcs-chat-system-notice">This is an RCS for Business chat.</div>
        ` : ''}
        ${isSmsFallback ? `
          <div class="rcs-chat-system-notice is-sms-notice">Text Message • SMS Fallback Mode</div>
        ` : ''}

        <!-- Main Message Content (Rich Card, Horizontal Card, Carousel, Multi-Card, Text+Chips, or SMS) -->
        <div class="rcs-message-group">
          ${this.renderPrimaryMessagePayload(payload, agent, isSmsFallback)}
          <div class="rcs-msg-delivery-time">${this.escapeHtml(agent.messageTime || '19:34')}</div>
        </div>

        <!-- Interactive Conversation History (User Taps / Replies / Animated Bubbles) -->
        ${this.state.conversationHistory.map((item) => `
          <div class="rcs-chat-bubble-row is-${item.sender}">
            <div class="rcs-chat-bubble is-${item.sender}" style="${item.sender === 'user' ? `--user-bubble-bg: ${agent.color || '#0B57D0'}` : ''}">
              <span>${this.escapeHtml(item.text)}</span>
            </div>
            <div class="rcs-bubble-time">${item.time}</div>
          </div>
        `).join('')}

        <!-- Animated Typing Indicator -->
        ${this.state.isTyping ? `
          <div class="rcs-typing-indicator">
            <span></span><span></span><span></span>
          </div>
        ` : ''}
      </div>

      <!-- Optional Floating Scroll-to-Bottom Arrow Button (Matches TIPOS Screenshot_20260617-120218.png) -->
      ${agent.showScrollDownBtn ? `
        <button type="button" class="rcs-floating-scroll-btn" id="rcs-scroll-bottom-btn" title="Scroll to bottom">
          <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 4v12m0 0-4.5-4.5M10 16l4.5-4.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      ` : ''}

      <!-- Optional Spam & Safety Shield Banner (Matches Telekom Screenshot_20260617-120327.png) -->
      ${agent.showSpamBanner ? `
        <div class="rcs-spam-shield-banner">
          <span class="rcs-shield-ico">${getIcon('shield-g')}</span>
          <span class="rcs-shield-text">For unwanted messages, <a href="#report" class="rcs-shield-link" onclick="event.preventDefault()">block &amp; report</a></span>
          <button type="button" class="rcs-shield-close" id="rcs-dismiss-spam-btn" aria-label="Dismiss">✕</button>
        </div>
      ` : ''}

      <!-- 4. Bottom Compose Bar (Matches Google Messages / Samsung / iOS 18) -->
      ${this.renderComposeBar(isSmsFallback, isIos, isSamsung)}

      <!-- 5. OS Home Gesture Indicator Bar -->
      <div class="rcs-os-gesture-bar">
        <div class="rcs-gesture-pill"></div>
      </div>

      <!-- 6. In-Phone Interactive Overlay Modals (Media Lightbox / Webview / Action Sheet / Custom Preset) -->
      ${this.state.activeModal ? this.renderActivePhoneModal() : ''}
    `;
  }

  renderAppHeader(agent, isIos, isSamsung) {
    if (isIos) {
      return `
        <div class="rcs-app-header is-ios">
          <button type="button" class="rcs-nav-back-ios" aria-label="Back">‹</button>
          <div class="rcs-ios-center-brand">
            <img src="${agent.logoUrl}" alt="" class="rcs-header-avatar is-circle" />
            <div class="rcs-ios-brand-row">
              <span class="rcs-header-title">${this.escapeHtml(agent.name)}</span>
              ${agent.verified ? `<span class="rcs-verified-badge">${getIcon('verified')}</span>` : ''}
              <span class="rcs-ios-chev">›</span>
            </div>
          </div>
          <button type="button" class="rcs-nav-info-ios" aria-label="Info">ⓘ</button>
        </div>
      `;
    }

    return `
      <div class="rcs-app-header ${isSamsung ? 'is-samsung' : 'is-google'}">
        <button type="button" class="rcs-nav-icon-btn" aria-label="Back">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5m0 0 7-7m-7 7 7 7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <img src="${agent.logoUrl}" alt="" class="rcs-header-avatar is-${agent.avatarShape || 'rounded'}" />
        <div class="rcs-header-title-wrap">
          <span class="rcs-header-title">${this.escapeHtml(agent.name)}</span>
          ${agent.verified ? `<span class="rcs-verified-badge" title="Verified Business Sender">${getIcon('verified')}</span>` : ''}
        </div>
        <button type="button" class="rcs-nav-icon-btn" aria-label="More options">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/>
          </svg>
        </button>
      </div>
    `;
  }

  renderPrimaryMessagePayload(payload, agent, isSmsFallback) {
    const cards = payload.cards || [];
    const firstCard = cards[0] || { title: '', description: '', suggestions: [] };

    // 1. SMS / Fallback Mode
    if (isSmsFallback) {
      const smsText = payload.smsFallbackText || `${agent.name}: ${firstCard.title}\n${firstCard.description}`;
      const seg = analyzeSmsSegments(smsText);
      return `
        <div class="rcs-sms-bubble-card">
          <div class="rcs-sms-text">${this.formatRichText(smsText)}</div>
          <div class="rcs-sms-meta-tag">${seg.encoding} • ${seg.segments} SMS segment${seg.segments === 1 ? '' : 's'} (${seg.length} chars)</div>
        </div>
      `;
    }

    // 2. Conversational RCS Text + Floating Suggestion Chips
    if (payload.templateId === 'text_with_chips') {
      return `
        <div class="rcs-text-plus-chips">
          <div class="rcs-plain-rcs-bubble">
            ${firstCard.title ? `<strong class="rcs-plain-title">${this.escapeHtml(firstCard.title)}</strong>` : ''}
            <div class="rcs-plain-desc">${this.formatRichText(firstCard.description)}</div>
          </div>
          ${(firstCard.suggestions || []).length ? `
            <div class="rcs-chips-scroll">
              ${(firstCard.suggestions || []).map((sug) => `
                <button type="button" class="rcs-floating-chip" data-action-type="${sug.type}" data-action-text="${this.escapeHtml(sug.text)}" data-action-val="${this.escapeHtml(sug.value || '')}">
                  <span class="rcs-chip-ico">${getIcon(this.getActionIconName(sug.type))}</span>
                  <span>${this.escapeHtml(sug.text.slice(0, 25))}</span>
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }

    // 3. Rich Card Carousel (Matches Telekom Screenshot_20260617-120327.png with peeking cards)
    if (payload.templateId === 'carousel') {
      const widthSpec = CAROUSEL_WIDTH_SPECS[payload.cardWidth] || CAROUSEL_WIDTH_SPECS.MEDIUM;
      const mediaSpec = MEDIA_SPECS[payload.mediaHeight] || MEDIA_SPECS.TALL;
      return `
        <div class="rcs-carousel-track" id="rcs-carousel-track" style="--carousel-card-w: ${widthSpec.dpWidth}px;">
          ${cards.map((c, idx) => this.renderSingleRichCard(c, {
            idx,
            mediaHeightPx: mediaSpec.dpHeight,
            mediaHeightKey: payload.mediaHeight,
            isCarousel: true,
            cardWidthKey: payload.cardWidth
          })).join('')}
        </div>
      `;
    }

    // 4. Horizontal Rich Card (Left / Right Side Thumbnail)
    if (payload.templateId === 'standalone_horizontal') {
      const align = payload.thumbnailAlignment || 'LEFT';
      return this.renderHorizontalRichCard(firstCard, align);
    }

    // 5. Stacked Multi-Card Flow (Matches DOXXbet Screenshot_20260617-120444.png)
    if (payload.templateId === 'multi_card_feed') {
      const mediaSpec = MEDIA_SPECS[payload.mediaHeight] || MEDIA_SPECS.MEDIUM;
      return `
        <div class="rcs-stacked-cards-feed">
          ${cards.map((c, idx) => this.renderSingleRichCard(c, {
            idx,
            mediaHeightPx: mediaSpec.dpHeight,
            mediaHeightKey: payload.mediaHeight,
            isCarousel: false
          })).join('')}
        </div>
      `;
    }

    // 6. Default: Standalone Vertical Rich Card (Matches TIPOS Screenshot_20260617-120218.png)
    const mediaSpec = MEDIA_SPECS[payload.mediaHeight] || MEDIA_SPECS.TALL;
    return this.renderSingleRichCard(firstCard, {
      idx: 0,
      mediaHeightPx: mediaSpec.dpHeight,
      mediaHeightKey: payload.mediaHeight,
      isCarousel: false
    });
  }

  renderSingleRichCard(card, { idx, mediaHeightPx, mediaHeightKey, isCarousel, cardWidthKey }) {
    const cropInfo = evaluateMediaCrop(card.mediaDimensions, mediaHeightKey, isCarousel, cardWidthKey);
    const isExpanded = this.state.expandedDescriptions.has(card.id || idx);
    const descLen = Array.from(card.description || '').length;
    const shouldFold = descLen > 185 && !isExpanded;
    const displayDesc = shouldFold ? `${card.description.slice(0, 175)}…` : (card.description || '');

    return `
      <article class="rcs-rich-card ${isCarousel ? 'is-carousel-item' : 'is-standalone'}" data-card-id="${card.id || idx}">
        <!-- Media Container with Center-Crop & Optional Safe-Zone Crop Guide Overlay -->
        <div class="rcs-card-media-wrap"
             style="height: ${mediaHeightPx}px;"
             data-lightbox-url="${card.mediaUrl}"
             data-lightbox-title="${this.escapeHtml(card.title)}"
             title="Tap thumbnail to preview full-screen media">
          ${card.mediaType === 'video' ? `
            <video src="${card.mediaUrl}" class="rcs-card-media-el" autoplay muted loop playsinline></video>
          ` : `
            <img src="${card.mediaUrl}" alt="${this.escapeHtml(card.title)}" class="rcs-card-media-el" draggable="false" />
          `}

          ${card.mediaType === 'gif' || card.mediaType === 'video' ? `
            <span class="rcs-media-type-badge">${card.mediaType.toUpperCase()}</span>
          ` : ''}

          ${this.state.showCropGuides ? `
            <div class="rcs-preview-crop-overlay">
              <div class="rcs-preview-crop-safe">
                <span>${mediaHeightKey} (${mediaHeightPx}dp) • ${cropInfo.croppedPercent > 0 ? `${cropInfo.croppedPercent}% edge crop` : '100% fit'}</span>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Card Body (Title + Description + Stacked Pill Action Buttons) -->
        <div class="rcs-card-content">
          ${card.title ? `
            <h3 class="rcs-card-title" title="Max 2 lines visible">${this.escapeHtml(card.title)}</h3>
          ` : ''}

          ${card.description ? `
            <div class="rcs-card-desc">
              ${this.formatRichText(displayDesc)}
              ${shouldFold ? `<button type="button" class="rcs-more-link" data-expand-card="${card.id || idx}">More</button>` : ''}
            </div>
          ` : ''}

          ${(card.suggestions || []).length ? `
            <div class="rcs-card-actions-stack">
              ${(card.suggestions || []).slice(0, 4).map((sug) => `
                <button type="button"
                        class="rcs-card-action-btn"
                        data-action-type="${sug.type}"
                        data-action-text="${this.escapeHtml(sug.text)}"
                        data-action-val="${this.escapeHtml(sug.value || '')}">
                  <span class="rcs-action-circle-ico">${getIcon(this.getActionIconName(sug.type))}</span>
                  <span class="rcs-action-label">${this.escapeHtml(sug.text.slice(0, 25))}</span>
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </article>
    `;
  }

  renderHorizontalRichCard(card, alignment = 'LEFT') {
    return `
      <article class="rcs-rich-card is-horizontal is-align-${alignment.toLowerCase()}">
        <div class="rcs-horiz-top">
          <div class="rcs-horiz-thumb"
               data-lightbox-url="${card.mediaUrl}"
               data-lightbox-title="${this.escapeHtml(card.title)}">
            <img src="${card.mediaUrl}" alt="${this.escapeHtml(card.title)}" class="rcs-card-media-el" draggable="false" />
            ${this.state.showCropGuides ? `
              <div class="rcs-preview-crop-overlay">
                <div class="rcs-preview-crop-safe"><span>128dp Side</span></div>
              </div>
            ` : ''}
          </div>
          <div class="rcs-horiz-copy">
            ${card.title ? `<h3 class="rcs-card-title">${this.escapeHtml(card.title)}</h3>` : ''}
            ${card.description ? `<div class="rcs-card-desc">${this.formatRichText(card.description)}</div>` : ''}
          </div>
        </div>

        ${(card.suggestions || []).length ? `
          <div class="rcs-card-actions-stack is-horiz-actions">
            ${(card.suggestions || []).slice(0, 4).map((sug) => `
              <button type="button"
                      class="rcs-card-action-btn"
                      data-action-type="${sug.type}"
                      data-action-text="${this.escapeHtml(sug.text)}"
                      data-action-val="${this.escapeHtml(sug.value || '')}">
                <span class="rcs-action-circle-ico">${getIcon(this.getActionIconName(sug.type))}</span>
                <span class="rcs-action-label">${this.escapeHtml(sug.text.slice(0, 25))}</span>
              </button>
            `).join('')}
          </div>
        ` : ''}
      </article>
    `;
  }

  renderComposeBar(isSmsFallback, isIos, isSamsung) {
    const placeholder = isIos
      ? (isSmsFallback ? 'Text Message • SMS' : 'Text Message • RCS')
      : (isSmsFallback ? 'Text message' : 'RCS message');

    if (isIos) {
      return `
        <div class="rcs-compose-bar is-ios">
          <button type="button" class="rcs-ios-plus-btn" aria-label="Add">+</button>
          <div class="rcs-ios-input-pill">
            <input type="text" id="rcs-live-chat-input" class="rcs-compose-input" placeholder="${placeholder}" />
            <span class="rcs-ios-mic">🎤</span>
          </div>
        </div>
      `;
    }

    return `
      <div class="rcs-compose-bar ${isSamsung ? 'is-samsung' : 'is-google'}">
        <div class="rcs-google-input-pill">
          <!-- Plus icon with notification dot matching real screenshot -->
          <button type="button" class="rcs-compose-ico-btn" aria-label="Attach">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="12" cy="12" r="9"/>
              <path d="M12 8v8M8 12h8" stroke-linecap="round"/>
            </svg>
          </button>
          <input type="text" id="rcs-live-chat-input" class="rcs-compose-input" placeholder="${placeholder}" />
          <!-- Emoji smiley icon -->
          <button type="button" class="rcs-compose-ico-btn" aria-label="Emoji">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="12" cy="12" r="9"/>
              <path d="M8.5 14.5s1.5 2 3.5 2 3.5-2 3.5-2" stroke-linecap="round"/>
              <circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/>
            </svg>
          </button>
          <!-- Image gallery icon -->
          <button type="button" class="rcs-compose-ico-btn" aria-label="Gallery">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="3" y="4" width="18" height="16" rx="2.5"/>
              <circle cx="8.5" cy="9" r="1.5"/>
              <path d="m21 15-5-5L5 20"/>
            </svg>
          </button>
        </div>

        <!-- Circular Green Voice Note / Waveform Button (Matches real Google Messages screenshot) -->
        <button type="button" class="rcs-voice-fab" id="rcs-send-or-voice-btn" title="Send message or voice note">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M4 12v1M8 8v8M12 5v14M16 8v8M20 11v2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    `;
  }

  renderActivePhoneModal() {
    const modal = this.state.activeModal;
    if (!modal) return '';

    if (modal.type === 'lightbox') {
      return `
        <div class="rcs-phone-modal-backdrop" id="rcs-close-phone-modal">
          <div class="rcs-lightbox-sheet" onclick="event.stopPropagation()">
            <div class="rcs-sheet-top">
              <span>${this.escapeHtml(modal.title || 'Media Preview')}</span>
              <button type="button" class="rcs-sheet-close" id="rcs-modal-close-btn">✕</button>
            </div>
            <div class="rcs-lightbox-body">
              <img src="${modal.url}" alt="" class="rcs-lightbox-img" />
            </div>
            <div class="rcs-lightbox-foot">Full-resolution asset inspection • Pinch/Tap zoom simulated</div>
          </div>
        </div>
      `;
    }

    if (modal.type === 'preset-builder') {
      return `
        <div class="rcs-phone-modal-backdrop" id="rcs-close-phone-modal">
          <div class="rcs-action-sheet" onclick="event.stopPropagation()">
            <div class="rcs-sheet-top">
              <strong>+ Add Custom Phone / Dual-Screen Preset</strong>
              <button type="button" class="rcs-sheet-close" id="rcs-modal-close-btn">✕</button>
            </div>
            <div class="rcs-sheet-body">
              <label class="rcs-field-label">Preset Name</label>
              <input type="text" id="rcs-custom-preset-name" class="rcs-input" value="Galaxy Z Fold6 (Dual Screen)" />
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">
                <div>
                  <label class="rcs-field-label">Width (px)</label>
                  <input type="number" id="rcs-custom-preset-w" class="rcs-input" value="580" min="320" max="900" />
                </div>
                <div>
                  <label class="rcs-field-label">Height (px)</label>
                  <input type="number" id="rcs-custom-preset-h" class="rcs-input" value="780" min="560" max="1000" />
                </div>
              </div>
              <div style="margin-top:8px;">
                <label class="rcs-field-label">OS / App Skin</label>
                <select id="rcs-custom-preset-skin" class="rcs-select-compact" style="width:100%">
                  ${this.skins.map((s) => `<option value="${s.id}">${s.name}</option>`).join('')}
                </select>
              </div>
              <button type="button" class="rcs-btn-primary" id="rcs-save-custom-preset" style="width:100%;margin-top:12px;">
                Save & Activate Preset
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // Simulated In-App Webview / Dialer / Location / Calendar Sheet
    return `
      <div class="rcs-phone-modal-backdrop" id="rcs-close-phone-modal">
        <div class="rcs-action-sheet" onclick="event.stopPropagation()">
          <div class="rcs-sheet-top">
            <strong>${this.escapeHtml(modal.label)} (${modal.actionType.toUpperCase()})</strong>
            <button type="button" class="rcs-sheet-close" id="rcs-modal-close-btn">✕</button>
          </div>
          <div class="rcs-sheet-body">
            <div class="rcs-webview-url-bar">🔒 ${this.escapeHtml(modal.value || 'https://business.rcs.app')}</div>
            <div class="rcs-webview-sim">
              <div class="rcs-webview-icon">${getIcon(this.getActionIconName(modal.actionType))}</div>
              <h4>Simulated RBM ${modal.actionType.toUpperCase()} Action</h4>
              <p>In Google Messages / iOS RCS, tapping <strong>"${this.escapeHtml(modal.label)}"</strong> launches the integrated ${modal.actionType} handler without leaving the conversation thread.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderRealScreenshotComparison() {
    const screenshots = [
      { id: 'tipos', label: 'TIPOS (Tall Card)', src: './assets/screenshots/Screenshot_20260617-120218.png' },
      { id: 'telekom', label: 'Telekom (Carousel)', src: './assets/screenshots/Screenshot_20260617-120327.png' },
      { id: 'doxxbet', label: 'DOXXbet (Multi-Card)', src: './assets/screenshots/Screenshot_20260617-120444.png' }
    ];
    const activeSrc = this.state.referenceScreenshot || screenshots[0].src;

    return `
      <div class="rcs-ref-screenshot-panel">
        <div class="rcs-ref-head">
          <span>Real Phone Screenshot Reference</span>
          <div class="rcs-ref-pills">
            ${screenshots.map((s) => `
              <button type="button" class="rcs-ref-pill ${activeSrc.includes(s.src.split('/').pop()) ? 'is-active' : ''}" data-ref-src="${s.src}">
                ${s.label}
              </button>
            `).join('')}
          </div>
        </div>
        <div class="rcs-ref-img-wrap">
          <img src="${activeSrc}" alt="Real Mobile RCS Screenshot" class="rcs-ref-img" />
        </div>
      </div>
    `;
  }

  getActionIconName(type) {
    const map = {
      url: 'globe',
      webview: 'browser',
      dial: 'phone',
      location: 'map-pin',
      calendar: 'calendar',
      reply: 'reply'
    };
    return map[type] || 'globe';
  }

  attachEvents() {
    const deviceSelect = this.root.querySelector('#rcs-device-select');
    if (deviceSelect) {
      deviceSelect.addEventListener('change', (e) => {
        const dev = this.devices.find((d) => d.id === e.target.value);
        if (dev) {
          this.state.deviceId = dev.id;
          this.state.skinId = dev.defaultSkin;
          this.render();
          this.attachEvents();
          this.logTelemetry('DEVICE_CHANGE', { deviceId: dev.id, skinId: dev.defaultSkin });
        }
      });
    }

    const skinSelect = this.root.querySelector('#rcs-skin-select');
    if (skinSelect) {
      skinSelect.addEventListener('change', (e) => {
        this.state.skinId = e.target.value;
        this.render();
        this.attachEvents();
        this.logTelemetry('OS_SKIN_CHANGE', { skinId: e.target.value });
      });
    }

    const openPresetModalBtn = this.root.querySelector('#rcs-open-preset-modal');
    if (openPresetModalBtn) {
      openPresetModalBtn.addEventListener('click', () => {
        this.state.activeModal = { type: 'preset-builder' };
        this.renderViewportOnly();
      });
    }

    const smsModeBtn = this.root.querySelector('#rcs-sms-mode-btn');
    if (smsModeBtn) {
      smsModeBtn.addEventListener('click', () => {
        this.triggerFlowAction('toggle-sms-fallback-view');
      });
    }

    const themeBtn = this.root.querySelector('#rcs-theme-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
        this.render();
        this.attachEvents();
        this.logTelemetry('THEME_TOGGLE', { theme: this.state.theme });
      });
    }

    const refCompareBtn = this.root.querySelector('#rcs-ref-compare-btn');
    if (refCompareBtn) {
      refCompareBtn.addEventListener('click', () => {
        this.state.showRealRefOverlay = !this.state.showRealRefOverlay;
        this.render();
        this.attachEvents();
      });
    }

    this.root.querySelectorAll('[data-ref-src]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.state.referenceScreenshot = btn.dataset.refSrc;
        this.render();
        this.attachEvents();
      });
    });

    const zoomOut = this.root.querySelector('#rcs-zoom-out');
    const zoomIn = this.root.querySelector('#rcs-zoom-in');
    const zoomReset = this.root.querySelector('#rcs-zoom-reset');

    if (zoomOut) {
      zoomOut.addEventListener('click', () => {
        this.state.zoom = Math.max(0.5, Math.round((this.state.zoom - 0.08) * 100) / 100);
        this.render();
        this.attachEvents();
      });
    }
    if (zoomIn) {
      zoomIn.addEventListener('click', () => {
        this.state.zoom = Math.min(1.35, Math.round((this.state.zoom + 0.08) * 100) / 100);
        this.render();
        this.attachEvents();
      });
    }
    if (zoomReset) {
      zoomReset.addEventListener('click', () => {
        this.state.zoom = 0.76;
        this.render();
        this.attachEvents();
      });
    }

    this.attachViewportEvents();
  }

  attachViewportEvents() {
    // 1. Carousel Mouse & Touch Drag Simulation
    const track = this.root.querySelector('#rcs-carousel-track');
    if (track) {
      let isDown = false;
      let startX = 0;
      let scrollLeft = 0;
      let dragged = false;

      track.addEventListener('pointerdown', (e) => {
        if (e.target.closest('button')) return;
        isDown = true;
        dragged = false;
        track.classList.add('is-dragging');
        startX = e.pageX - track.offsetLeft;
        scrollLeft = track.scrollLeft;
      });

      track.addEventListener('pointerleave', () => {
        isDown = false;
        track.classList.remove('is-dragging');
      });

      track.addEventListener('pointerup', () => {
        if (isDown && dragged) {
          this.logTelemetry('CAROUSEL_SWIPE', { scrollLeft: Math.round(track.scrollLeft) });
        }
        isDown = false;
        track.classList.remove('is-dragging');
      });

      track.addEventListener('pointermove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - track.offsetLeft;
        const walk = (x - startX) * 1.4;
        if (Math.abs(walk) > 6) dragged = true;
        track.scrollLeft = scrollLeft - walk;
      });
    }

    // 2. Thumbnail Tap -> Fullscreen Media Lightbox
    this.root.querySelectorAll('[data-lightbox-url]').forEach((el) => {
      el.addEventListener('click', () => {
        const url = el.dataset.lightboxUrl;
        const title = el.dataset.lightboxTitle;
        this.state.activeModal = { type: 'lightbox', url, title };
        this.renderViewportOnly();
        this.logTelemetry('MEDIA_EXPAND', { title });
      });
    });

    // 3. Suggested Action / Reply Button Clicks
    this.root.querySelectorAll('[data-action-type]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const actionType = btn.dataset.actionType;
        const label = btn.dataset.actionText;
        const value = btn.dataset.actionVal;

        this.logTelemetry('ACTION_CLICK', { actionType, label, value });

        if (actionType === 'reply') {
          this.pushUserMessage(label, value);
        } else {
          // Push user interaction & show simulated in-app webview/action sheet
          this.state.activeModal = {
            type: 'action-sheet',
            actionType,
            label,
            value
          };
          this.renderViewportOnly();
        }
      });
    });

    // 4. Expand "More" folded description
    this.root.querySelectorAll('[data-expand-card]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.state.expandedDescriptions.add(btn.dataset.expandCard);
        this.renderViewportOnly();
      });
    });

    // 5. Dismiss Spam Banner
    const dismissSpam = this.root.querySelector('#rcs-dismiss-spam-btn');
    if (dismissSpam) {
      dismissSpam.addEventListener('click', () => {
        this.state.agent.showSpamBanner = false;
        this.renderViewportOnly();
      });
    }

    // 6. Floating Scroll-to-Bottom Button
    const scrollBtn = this.root.querySelector('#rcs-scroll-bottom-btn');
    if (scrollBtn) {
      scrollBtn.addEventListener('click', () => this.scrollToBottom());
    }

    // 7. Live Compose Input inside the phone
    const chatInput = this.root.querySelector('#rcs-live-chat-input');
    const sendFab = this.root.querySelector('#rcs-send-or-voice-btn');
    if (chatInput) {
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && chatInput.value.trim()) {
          this.pushUserMessage(chatInput.value.trim());
        }
      });
    }
    if (sendFab && chatInput) {
      sendFab.addEventListener('click', () => {
        if (chatInput.value.trim()) {
          this.pushUserMessage(chatInput.value.trim());
        } else {
          this.pushUserMessage('🎤 [Hlasová správa 0:04]');
        }
      });
    }

    // 8. Close Modal / Save Custom Preset
    const closeBackdrop = this.root.querySelector('#rcs-close-phone-modal');
    const closeBtn = this.root.querySelector('#rcs-modal-close-btn');
    if (closeBackdrop) {
      closeBackdrop.addEventListener('click', () => {
        this.state.activeModal = null;
        this.renderViewportOnly();
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.state.activeModal = null;
        this.renderViewportOnly();
      });
    }

    const savePresetBtn = this.root.querySelector('#rcs-save-custom-preset');
    if (savePresetBtn) {
      savePresetBtn.addEventListener('click', () => {
        const name = this.root.querySelector('#rcs-custom-preset-name')?.value || 'Custom Device';
        const width = Math.min(860, Math.max(320, Number(this.root.querySelector('#rcs-custom-preset-w')?.value) || 412));
        const height = Math.min(980, Math.max(580, Number(this.root.querySelector('#rcs-custom-preset-h')?.value) || 880));
        const skinId = this.root.querySelector('#rcs-custom-preset-skin')?.value || 'google_messages_m3';
        const newId = `custom_${Date.now()}`;
        this.devices.push({
          id: newId,
          name,
          brand: 'Custom',
          os: skinId.includes('ios') ? 'ios' : 'android',
          defaultSkin: skinId,
          width,
          height,
          logicalRes: `${width} × ${height} dp (Custom Preset)`,
          dpi: '440 ppi',
          bezelRadius: 32,
          screenRadius: 26,
          cutout: width > 500 ? 'fold-crease' : 'punch-center',
          aspect: 'Custom',
          networkLabel: '5G',
          battery: 99
        });
        this.state.deviceId = newId;
        this.state.skinId = skinId;
        this.state.activeModal = null;
        this.render();
        this.attachEvents();
        this.logTelemetry('CUSTOM_PRESET_CREATED', { name, width, height, skinId });
      });
    }
  }

  scrollToBottom() {
    const scroller = this.root.querySelector('#rcs-chat-scroll');
    if (scroller) {
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' });
    }
  }

  formatRichText(str = '') {
    return this.escapeHtml(str).replace(/\n/g, '<br/>');
  }

  escapeHtml(str = '') {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// Register agnostic Custom Element <rcs-phone-preview>
if (typeof window !== 'undefined' && !customElements.get('rcs-phone-preview')) {
  class RcsPhonePreviewElement extends HTMLElement {
    connectedCallback() {
      if (!this.instance) {
        const preset = this.getAttribute('preset') || 'tipos_lottery';
        this.instance = new RcsPhonePreview(this, { initialPreset: preset });
      }
    }
  }
  customElements.define('rcs-phone-preview', RcsPhonePreviewElement);
}
