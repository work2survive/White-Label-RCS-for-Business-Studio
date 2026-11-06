/**
 * @fileoverview Official RCS for Business (RBM) & SMS Specifications,
 * Device Presets, OS/App Skins, Documentation Links, and Sample Presets.
 * Framework-agnostic ES Module.
 */

export const RCS_DOCS = {
  overview: {
    label: 'RCS for Business Overview',
    url: 'https://developers.google.com/business-communications/rcs-business-messaging/guides/get-started/how-it-works'
  },
  richCards: {
    label: 'Standalone Rich Cards Spec',
    url: 'https://developers.google.com/business-communications/rcs-business-messaging/guides/build/messages/send#rich-cards'
  },
  carousels: {
    label: 'Rich Card Carousels Spec',
    url: 'https://developers.google.com/business-communications/rcs-business-messaging/guides/build/messages/send#rich-card-carousels'
  },
  media: {
    label: 'Media & Crop Guidelines (dp / px / KB)',
    url: 'https://developers.google.com/business-communications/rcs-business-messaging/guides/Design/best-practices#media'
  },
  suggestedActions: {
    label: 'Suggested Replies & Actions API',
    url: 'https://developers.google.com/business-communications/rcs-business-messaging/guides/build/messages/send#suggested-replies-and-actions'
  },
  agentInfo: {
    label: 'RBM Agent Branding & Verification',
    url: 'https://developers.google.com/business-communications/rcs-business-messaging/guides/build/agents/create-agent'
  },
  webview: {
    label: 'RBM Webviews (Full / Half / Tall)',
    url: 'https://developers.google.com/business-communications/rcs-business-messaging/guides/build/features/webview'
  },
  fallback: {
    label: 'SMS/MMS Fallback & Revoke API',
    url: 'https://developers.google.com/business-communications/rcs-business-messaging/guides/build/messages/revoke'
  },
  restReference: {
    label: 'REST API: AgentContentMessage',
    url: 'https://developers.google.com/business-communications/rcs-business-messaging/reference/rest/v1/phones.agentMessages#AgentContentMessage'
  }
};

export const TEXT_LIMITS = {
  title: {
    max: 200,
    recommended: 40,
    lineChars: 34,
    maxVisibleLines: 2,
    docUrl: RCS_DOCS.richCards.url,
    hint: 'Max 200 chars. Keep ≤ 40 chars (1–2 lines) to prevent wrapping or ellipsis in carousels.'
  },
  description: {
    max: 2000,
    recommended: 140,
    lineChars: 42,
    maxVisibleLines: 4,
    docUrl: RCS_DOCS.richCards.url,
    hint: 'Max 2,000 chars. Keep ≤ 140 chars (~3–4 lines) before the OS collapses text behind "More…".'
  },
  suggestionText: {
    max: 25,
    recommended: 20,
    docUrl: RCS_DOCS.suggestedActions.url,
    hint: 'Hard limit: 25 characters per Suggested Reply or Action label. Truncates beyond 25 chars.'
  },
  textMessage: {
    max: 3072,
    recommended: 320,
    docUrl: RCS_DOCS.overview.url,
    hint: 'RCS plain text supports up to 3,072 chars with rich UTF-8 emojis.'
  },
  smsFallback: {
    gsmSingle: 160,
    gsmMulti: 153,
    ucsSingle: 70,
    ucsMulti: 67,
    docUrl: RCS_DOCS.fallback.url,
    hint: 'GSM-7: 160 chars/segment (153 multipart). Unicode/Emoji (UCS-2): 70 chars/segment (67 multipart).'
  }
};

export const MEDIA_SPECS = {
  SHORT: {
    id: 'SHORT',
    label: 'Short (112 dp)',
    dpHeight: 112,
    aspectRatio: 16 / 9,
    aspectLabel: '16:9 or 3:1',
    recWidthPx: 1440,
    recHeightPx: 480,
    safeZoneRatio: 0.72,
    maxImageKb: 1536,
    maxGifKb: 5120,
    maxVideoKb: 10240,
    docUrl: RCS_DOCS.media.url,
    description: '112 dp height. Best for compact banners (1440×480 px, ≤ 1.5 MB JPG/PNG). Center-cropped vertically.'
  },
  MEDIUM: {
    id: 'MEDIUM',
    label: 'Medium (168 dp)',
    dpHeight: 168,
    aspectRatio: 2 / 1,
    aspectLabel: '2:1 (16:9 safe)',
    recWidthPx: 1440,
    recHeightPx: 720,
    safeZoneRatio: 0.80,
    maxImageKb: 1536,
    maxGifKb: 5120,
    maxVideoKb: 10240,
    docUrl: RCS_DOCS.media.url,
    description: '168 dp height. Recommended optimal balance (1440×720 px, 2:1 aspect, ≤ 1.5 MB).'
  },
  TALL: {
    id: 'TALL',
    label: 'Tall (264 dp)',
    dpHeight: 264,
    aspectRatio: 4 / 3,
    aspectLabel: '4:3 or 1:1',
    recWidthPx: 1440,
    recHeightPx: 1080,
    safeZoneRatio: 0.86,
    maxImageKb: 2048,
    maxGifKb: 5120,
    maxVideoKb: 10240,
    docUrl: RCS_DOCS.media.url,
    description: '264 dp height. High-impact visual hero (1440×1080 px, 4:3 or 1:1, ≤ 2 MB).'
  },
  HORIZONTAL: {
    id: 'HORIZONTAL',
    label: 'Side Media (128 dp)',
    dpHeight: 148,
    aspectRatio: 3 / 4,
    aspectLabel: '1:1 or 3:4',
    recWidthPx: 720,
    recHeightPx: 960,
    safeZoneRatio: 0.78,
    maxImageKb: 1536,
    maxGifKb: 5120,
    maxVideoKb: 10240,
    docUrl: RCS_DOCS.richCards.url,
    description: 'Horizontal Rich Card thumbnail on Left or Right (720×720 px or 720×960 px).'
  }
};

export const CAROUSEL_WIDTH_SPECS = {
  SMALL: {
    id: 'SMALL',
    label: 'Small Width (120 dp)',
    dpWidth: 186, // Rendered effective width in Google Messages M3
    rawSpecDp: 120,
    maxSuggestions: 4,
    docUrl: RCS_DOCS.carousels.url,
    description: 'Compact carousel card (~186 px effective width). Best for product grids with short titles.'
  },
  MEDIUM: {
    id: 'MEDIUM',
    label: 'Medium Width (200 dp)',
    dpWidth: 264, // Rendered effective width in Google Messages M3 (matches Telekom screenshot)
    rawSpecDp: 200,
    maxSuggestions: 4,
    docUrl: RCS_DOCS.carousels.url,
    description: 'Standard carousel card (~264 px effective width). Adjacent cards peek in on left/right.'
  }
};

export const TEMPLATES = [
  {
    id: 'standalone_vertical',
    name: 'Rich Card (Vertical)',
    shortName: 'Vertical Card',
    icon: 'card-vertical',
    channel: 'rcs',
    cardOrientation: 'VERTICAL',
    defaultMediaHeight: 'TALL',
    docUrl: RCS_DOCS.richCards.url,
    description: 'Standalone vertical Rich Card with Short/Medium/Tall top media, title, description, and up to 4 stacked action buttons.'
  },
  {
    id: 'standalone_horizontal',
    name: 'Rich Card (Horizontal)',
    shortName: 'Horizontal',
    icon: 'card-horizontal',
    channel: 'rcs',
    cardOrientation: 'HORIZONTAL',
    thumbnailAlignment: 'LEFT',
    defaultMediaHeight: 'HORIZONTAL',
    docUrl: RCS_DOCS.richCards.url,
    description: 'Side-by-side layout with media thumbnail on the left or right and stacked actions below.'
  },
  {
    id: 'carousel',
    name: 'Rich Card Carousel',
    shortName: 'Carousel',
    icon: 'carousel',
    channel: 'rcs',
    cardOrientation: 'CAROUSEL',
    cardWidth: 'MEDIUM',
    defaultMediaHeight: 'TALL',
    docUrl: RCS_DOCS.carousels.url,
    description: '2 to 10 horizontally swipeable Rich Cards with synchronized media height and peeking neighbors.'
  },
  {
    id: 'multi_card_feed',
    name: 'Stacked Rich Cards Flow',
    shortName: 'Multi-Card',
    icon: 'multi-card',
    channel: 'rcs',
    cardOrientation: 'MULTI_VERTICAL',
    defaultMediaHeight: 'MEDIUM',
    docUrl: RCS_DOCS.richCards.url,
    description: 'Sequential standalone Rich Cards in a single campaign flow (matches DOXXbet real screenshot).'
  },
  {
    id: 'text_with_chips',
    name: 'RCS Text + Suggestion Chips',
    shortName: 'Text + Chips',
    icon: 'text-chips',
    channel: 'rcs',
    cardOrientation: 'TEXT',
    defaultMediaHeight: 'SHORT',
    docUrl: RCS_DOCS.suggestedActions.url,
    description: 'Conversational RCS bubble with floating horizontal Suggested Reply/Action chips underneath.'
  },
  {
    id: 'sms_regular',
    name: 'Regular SMS / Fallback',
    shortName: 'SMS / Fallback',
    icon: 'sms',
    channel: 'sms',
    cardOrientation: 'SMS',
    defaultMediaHeight: 'SHORT',
    docUrl: RCS_DOCS.fallback.url,
    description: 'Standard 160-char GSM-7 or 70-char Unicode SMS preview & automated RCS-to-SMS fallback simulator.'
  }
];

export const ACTION_TYPES = {
   url: {
    id: 'url',
    label: 'Open URL / App',
    icon: 'globe',
    docUrl: RCS_DOCS.webview.url,
    placeholder: 'https://example.com/offer'
  },
  webview: {
    id: 'webview',
    label: 'In-App Webview',
    icon: 'browser',
    docUrl: RCS_DOCS.webview.url,
    placeholder: 'https://example.com/app-view'
  },
  dial: {
    id: 'dial',
    label: 'Call Phone',
    icon: 'phone',
    docUrl: RCS_DOCS.suggestedActions.url,
    placeholder: '+421 900 123 456'
  },
  location: {
    id: 'location',
    label: 'View Map Pin',
    icon: 'map-pin',
    docUrl: RCS_DOCS.suggestedActions.url,
    placeholder: '48.1486, 17.1077 (Bratislava)'
  },
  calendar: {
    id: 'calendar',
    label: 'Calendar Event',
    icon: 'calendar',
    docUrl: RCS_DOCS.suggestedActions.url,
    placeholder: '2026-06-20T18:00 / Match Reminder'
  },
  reply: {
    id: 'reply',
    label: 'Quick Reply',
    icon: 'reply',
    docUrl: RCS_DOCS.suggestedActions.url,
    placeholder: 'YES_BOOK_NOW'
  }
};

export const DEVICE_PRESETS = [
  {
    id: 'pixel_9_pro',
    name: 'Google Pixel 9 Pro',
    brand: 'Google',
    os: 'android',
    defaultSkin: 'google_messages_m3',
    width: 380,
    height: 820,
    logicalRes: '412 × 915 dp (1344 × 2992 px)',
    dpi: '489 ppi',
    bezelRadius: 42,
    screenRadius: 34,
    cutout: 'punch-center',
    aspect: '20:9',
    networkLabel: '4G',
    battery: 88
  },
  {
    id: 'galaxy_s24_ultra',
    name: 'Samsung Galaxy S24 Ultra',
    brand: 'Samsung',
    os: 'android',
    defaultSkin: 'samsung_messages_oneui',
    width: 388,
    height: 832,
    logicalRes: '412 × 891 dp (1440 × 3120 px)',
    dpi: '505 ppi',
    bezelRadius: 14,
    screenRadius: 8,
    cutout: 'punch-center-small',
    aspect: '19.5:9',
    networkLabel: '5G',
    battery: 94
  },
  {
    id: 'motorola_edge_50',
    name: 'Motorola Edge 50 Pro',
    brand: 'Motorola',
    os: 'android',
    defaultSkin: 'google_messages_m3',
    width: 376,
    height: 824,
    logicalRes: '412 × 915 dp (1220 × 2712 px)',
    dpi: '446 ppi',
    bezelRadius: 38,
    screenRadius: 30,
    cutout: 'punch-center',
    aspect: '20:9',
    networkLabel: '5G',
    battery: 79
  },
  {
    id: 'iphone_16_pro',
    name: 'iPhone 16 Pro',
    brand: 'Apple',
    os: 'ios',
    defaultSkin: 'ios_18_messages',
    width: 382,
    height: 816,
    logicalRes: '393 × 852 pt (1206 × 2622 px)',
    dpi: '460 ppi',
    bezelRadius: 48,
    screenRadius: 42,
    cutout: 'dynamic-island',
    aspect: '19.5:9',
    networkLabel: '5G',
    battery: 91
  },
  {
    id: 'iphone_15_compact',
    name: 'iPhone 15 / SE Compact',
    brand: 'Apple',
    os: 'ios',
    defaultSkin: 'ios_18_messages',
    width: 356,
    height: 740,
    logicalRes: '375 × 812 pt (1170 × 2532 px)',
    dpi: '460 ppi',
    bezelRadius: 42,
    screenRadius: 36,
    cutout: 'dynamic-island',
    aspect: '19.5:9',
    networkLabel: 'LTE',
    battery: 67
  },
  {
    id: 'pixel_fold_unfolded',
    name: 'Foldable Dual-Screen (Unfolded)',
    brand: 'Google / Samsung Fold',
    os: 'android',
    defaultSkin: 'google_messages_m3',
    width: 560,
    height: 760,
    logicalRes: '673 × 841 dp (2076 × 2152 px)',
    dpi: '373 ppi',
    bezelRadius: 28,
    screenRadius: 22,
    cutout: 'fold-crease',
    aspect: '6:5 Dual',
    networkLabel: '5G',
    battery: 83
  }
];

export const OS_APP_SKINS = [
  {
    id: 'google_messages_m3',
    name: 'Google Messages (Android 14/15 M3)',
    shortName: 'Google Msg',
    os: 'android',
    version: 'v2026.06 Material 3',
    description: 'Authentic Google Messages Material You UI matching real Slovak RBM screenshots (DOXXbet, TIPOS, Telekom).'
  },
  {
    id: 'samsung_messages_oneui',
    name: 'Samsung Messages (One UI 6.1 / 7)',
    shortName: 'Samsung UI',
    os: 'android',
    version: 'One UI 6.1+',
    description: 'Samsung Messages RCS layout with rounded One UI cards, divider action buttons, and One UI compose bar.'
  },
  {
    id: 'ios_18_messages',
    name: 'Apple Messages (iOS 18.2+ RCS)',
    shortName: 'iOS 18 RCS',
    os: 'ios',
    version: 'iOS 18.4 RBM Profile',
    description: 'iPhone iOS 18+ RCS Business Messaging UI with centered navigation bar, iOS card radii, and Text Message • RCS input.'
  }
];

/**
 * Rich SVG Data-URI illustrations & real screenshot presets so everything works
 * offline, in GitHub Pages, and without external broken image links.
 */
function createSvgBannerDataUri({ bg1, bg2, accent, title, subtitle, badge, emoji }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bg1}"/>
        <stop offset="100%" stop-color="${bg2}"/>
      </linearGradient>
      <radialGradient id="r" cx="80%" cy="25%" r="55%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.55"/>
        <stop offset="100%" stop-color="${bg2}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1200" height="800" fill="url(#g)"/>
    <rect width="1200" height="800" fill="url(#r)"/>
    <circle cx="1020" cy="180" r="240" fill="${accent}" opacity="0.18"/>
    <circle cx="160" cy="680" r="290" fill="${accent}" opacity="0.14"/>
    <g transform="translate(80, 95)">
      <rect x="0" y="0" width="260" height="58" rx="14" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
      <text x="24" y="38" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="800" letter-spacing="1">${badge}</text>
    </g>
    <text x="920" y="470" font-family="system-ui, sans-serif" font-size="250" text-anchor="middle">${emoji}</text>
    <g transform="translate(80, 320)">
      <text x="0" y="0" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="78" font-weight="900" letter-spacing="-1">${title}</text>
      <rect x="0" y="55" width="660" height="120" rx="26" fill="${accent}"/>
      <text x="36" y="132" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="60" font-weight="900">${subtitle}</text>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createLogoSvgDataUri({ bg, text, fg = '#ffffff', sub = '' }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="36" fill="${bg}"/>
    <text x="80" y="${sub ? '88' : '102'}" fill="${fg}" font-family="system-ui, -apple-system, sans-serif" font-size="62" font-weight="900" text-anchor="middle">${text}</text>
    ${sub ? `<text x="80" y="126" fill="${fg}" opacity="0.85" font-family="system-ui, sans-serif" font-size="22" font-weight="700" text-anchor="middle">${sub}</text>` : ''}
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const REAL_CAMPAIGN_PRESETS = {
  tipos_lottery: {
    id: 'tipos_lottery',
    label: 'TIPOS: Dni šťastia (Tall Rich Card)',
    templateId: 'standalone_vertical',
    referenceScreenshot: './assets/screenshots/Screenshot_20260617-120218.png',
    agent: {
      name: 'DNI ŠTASTIA od TIPOSU',
      verified: true,
      tagline: 'Dni šťastia od spoločnosti TIPOS ti na jednom mieste prinášajú unikátne SMS hry',
      color: '#D61F26',
      avatarShape: 'rounded',
      logoUrl: createLogoSvgDataUri({ bg: '#D61F26', text: 'T', sub: 'TIPOS' }),
      showAgentHeader: true,
      timestampLabel: 'Thursday, Feb 12 • 22:46',
      messageTime: '22:46',
      showSpamBanner: false,
      showScrollDownBtn: true
    },
    payload: {
      templateId: 'standalone_vertical',
      channel: 'rcs',
      mediaHeight: 'TALL',
      cardWidth: 'MEDIUM',
      thumbnailAlignment: 'LEFT',
      cards: [
        {
          id: 'card-tipos-1',
          mediaUrl: createSvgBannerDataUri({
            bg1: '#5C2C1D',
            bg2: '#231411',
            accent: '#E30613',
            title: 'KVIK výhry!',
            subtitle: 'až 30 000 €',
            badge: 'TIPOS • 18+',
            emoji: '🐷'
          }),
          mediaType: 'image',
          mediaSizeKb: 384,
          mediaDimensions: { width: 1440, height: 1080 },
          title: 'TIPOS: Prasa v žite oslavuje 20 rokov!',
          description: 'Kúp si tlačený žreb Párty Prasa za 20 EUR s hlavnou výhrou 212.000 EUR vo svojej zberni alebo pošli SMS: PRASA na číslo 3333 s hlavnou výhrou 15.000 EUR. Cena SMS žrebu je 1 EUR.\n\nDnistastia.sk',
          suggestions: [
            { id: 's1', type: 'url', text: 'Hrať o 30 000 €', value: 'https://dnistastia.sk' },
            { id: 's2', type: 'reply', text: 'PRASA na 3333', value: 'PRASA' }
          ]
        }
      ],
      smsFallbackText: 'TIPOS: Prasa v zite oslavuje 20 rokov! Kup zreb za 20 EUR (vyhra az 212000 EUR) alebo posli SMS PRASA na 3333 (1 EUR). Viac na https://dnistastia.sk'
    }
  },

  telekom_carousel: {
    id: 'telekom_carousel',
    label: 'Telekom Magenta Moments (Carousel)',
    templateId: 'carousel',
    referenceScreenshot: './assets/screenshots/Screenshot_20260617-120327.png',
    agent: {
      name: 'Telekom Magenta Moments',
      verified: true,
      tagline: 'Exkluzívne výhody a zážitky pre zákazníkov Slovak Telekom',
      color: '#E20074',
      avatarShape: 'circle',
      logoUrl: createLogoSvgDataUri({ bg: '#E20074', text: 'T' }),
      showAgentHeader: false,
      showRbmChatNotice: true,
      timestampLabel: 'Friday, Jun 5 • 14:27',
      messageTime: '14:27',
      showSpamBanner: true,
      showScrollDownBtn: false
    },
    payload: {
      templateId: 'carousel',
      channel: 'rcs',
      mediaHeight: 'TALL',
      cardWidth: 'MEDIUM',
      cards: [
        {
          id: 'card-telekom-1',
          mediaUrl: createSvgBannerDataUri({
            bg1: '#8D5B4C',
            bg2: '#3D2722',
            accent: '#E20074',
            title: 'KÁVA A SLADKÉ',
            subtitle: 'POTEŠENIE ☕',
            badge: 'MAGENTA MOMENTS',
            emoji: '🍨'
          }),
          mediaType: 'image',
          mediaSizeKb: 412,
          mediaDimensions: { width: 1080, height: 1080 },
          title: 'Chvíľa, ktorá chutí lepšie ☕',
          description: 'Vyberte si kávu či obľúbenú sladkosť a urobte si krajší deň. ✨',
          suggestions: [
            { id: 't1', type: 'webview', text: 'Prejsť do apky', value: 'https://telekom.sk/app' }
          ]
        },
        {
          id: 'card-telekom-2',
          mediaUrl: createSvgBannerDataUri({
            bg1: '#1E3C72',
            bg2: '#2A5298',
            accent: '#E20074',
            title: '15 % ZĽAVA',
            subtitle: 'Dr.Max Lekáreň',
            badge: 'PARTNER VÝHODA',
            emoji: '💊'
          }),
          mediaType: 'image',
          mediaSizeKb: 355,
          mediaDimensions: { width: 1080, height: 1080 },
          title: 'V Dr.Max ušetríte viac ✨',
          description: 'Nakúpte vitamíny a kozmetiku so zľavou 15 % v aplikácii.',
          suggestions: [
            { id: 't2', type: 'webview', text: 'Získať kupón', value: 'https://telekom.sk/drmax' }
          ]
        },
        {
          id: 'card-telekom-3',
          mediaUrl: createSvgBannerDataUri({
            bg1: '#4A154B',
            bg2: '#1F0924',
            accent: '#E20074',
            title: 'LETNÉ KINO',
            subtitle: 'Lístky 1+1 zadarmo',
            badge: 'ZÁŽITKY',
            emoji: '🍿'
          }),
          mediaType: 'image',
          mediaSizeKb: 390,
          mediaDimensions: { width: 1080, height: 1080 },
          title: 'Večer plný filmov 🎬',
          description: 'Zoberte niekoho blízkeho do kina s výhodou 1+1 lístok zadarmo.',
          suggestions: [
            { id: 't3', type: 'webview', text: 'Rezervovať', value: 'https://telekom.sk/kino' }
          ]
        }
      ],
      smsFallbackText: 'Telekom Magenta Moments: Chvila, ktora chuti lepsie! Vyberte si kavu ci sladkost a urobte si krajsi den. Otvorte apku: https://t-m.sk/moments'
    }
  },

  doxxbet_multi: {
    id: 'doxxbet_multi',
    label: 'DOXXbet (Multi-Card Flow)',
    templateId: 'multi_card_feed',
    referenceScreenshot: './assets/screenshots/Screenshot_20260617-120444.png',
    agent: {
      name: 'DOXXbet, s. r. o.',
      verified: true,
      tagline: 'Tipovanie, online kasíno a najvyššie kurzy na Slovensku',
      color: '#E5092F',
      avatarShape: 'rounded',
      logoUrl: createLogoSvgDataUri({ bg: '#E5092F', text: 'XX', fg: '#151922' }),
      showAgentHeader: false,
      showRbmChatNotice: false,
      timestampLabel: 'Today • 19:34',
      messageTime: '19:34',
      showSpamBanner: false,
      showScrollDownBtn: false
    },
    payload: {
      templateId: 'multi_card_feed',
      channel: 'rcs',
      mediaHeight: 'MEDIUM',
      cardWidth: 'MEDIUM',
      cards: [
        {
          id: 'card-doxx-1',
          mediaUrl: createSvgBannerDataUri({
            bg1: '#0F3878',
            bg2: '#C8102E',
            accent: '#FFD100',
            title: 'HOKEJOVÉ DERBY',
            subtitle: 'SLOVENSKO vs ČESKO',
            badge: 'DOXXBET LIVE',
            emoji: '🏒'
          }),
          mediaType: 'image',
          mediaSizeKb: 310,
          mediaDimensions: { width: 1440, height: 720 },
          title: 'HOKEJOVÉ DERBY 🏒',
          description: 'Slovensko vs. Česko! A iPhone bude tvoj za najvyšší kurz 📱🔥',
          suggestions: [
            { id: 'd1', type: 'url', text: 'SÚŤAŽIŤ O IPHONE', value: 'https://doxxbet.sk/iphone' },
            { id: 'd2', type: 'url', text: 'BETNI SI', value: 'https://doxxbet.sk/live' }
          ]
        },
        {
          id: 'card-doxx-2',
          mediaUrl: createSvgBannerDataUri({
            bg1: '#D80056',
            bg2: '#6A0572',
            accent: '#FFB703',
            title: 'DRES READY?',
            subtitle: 'FRÍBET 10 € ISTÝCH',
            badge: 'BONUS DNES',
            emoji: '🇸🇰'
          }),
          mediaType: 'image',
          mediaSizeKb: 340,
          mediaDimensions: { width: 1440, height: 720 },
          title: 'DRES READY? KANADA ČAKÁ 🇸🇰🏒',
          description: 'Ale nervy bokom! U nás máš 10€ istých aj keď ti tiket nevyjde.',
          suggestions: [
            { id: 'd3', type: 'url', text: 'FRÍBET 10 € TU', value: 'https://doxxbet.sk/freebet' },
            { id: 'd4', type: 'url', text: 'BETNI SI', value: 'https://doxxbet.sk/hokej' }
          ]
        }
      ],
      smsFallbackText: 'DOXXbet: HOKEJOVE DERBY Slovensko vs. Cesko! Sutaz o iPhone a ziskaj 10 EUR freebet aj ked tiket nevyjde: https://doxxbet.sk/hokej'
    }
  },

  whitelabel_booking: {
    id: 'whitelabel_booking',
    label: 'White-Label SMB Booking & Purchase',
    templateId: 'standalone_horizontal',
    referenceScreenshot: null,
    agent: {
      name: 'Bistro Urban & Co.',
      verified: true,
      tagline: 'Fresh artisan lunch, table bookings & instant order pickup',
      color: '#0D9488',
      avatarShape: 'rounded',
      logoUrl: createLogoSvgDataUri({ bg: '#0D9488', text: 'BU', sub: 'BISTRO' }),
      showAgentHeader: true,
      showRbmChatNotice: true,
      timestampLabel: 'Today • 11:45',
      messageTime: '11:45',
      showSpamBanner: false,
      showScrollDownBtn: false
    },
    payload: {
      templateId: 'standalone_horizontal',
      channel: 'rcs',
      mediaHeight: 'HORIZONTAL',
      thumbnailAlignment: 'LEFT',
      cardWidth: 'MEDIUM',
      cards: [
        {
          id: 'card-smb-1',
          mediaUrl: createSvgBannerDataUri({
            bg1: '#0F766E',
            bg2: '#115E59',
            accent: '#F59E0B',
            title: 'TABLE FOR 2',
            subtitle: 'TODAY • 19:00',
            badge: 'INSTANT BOOKING',
            emoji: '🍽️'
          }),
          mediaType: 'image',
          mediaSizeKb: 220,
          mediaDimensions: { width: 720, height: 960 },
          title: 'Confirm Dinner Reservation 🍽️',
          description: 'Table for 2 guests today at 19:00 on the heated terrace. Pre-order welcome drinks with 20% off.',
          suggestions: [
            { id: 'b1', type: 'reply', text: 'Confirm Table', value: 'CONFIRM_1900' },
            { id: 'b2', type: 'calendar', text: 'Add to Calendar', value: '2026-11-06T19:00' },
            { id: 'b3', type: 'location', text: 'View Map', value: '48.145, 17.109' },
            { id: 'b4', type: 'dial', text: 'Call Bistro', value: '+421905111222' }
          ]
        }
      ],
      smsFallbackText: 'Bistro Urban: Confirm your dinner table for 2 today at 19:00. Reply YES to confirm or manage booking at https://bistro.urban/r/842'
    }
  }
};

/**
 * Compute SMS segment count and encoding (GSM-7 vs UCS-2)
 */
export function analyzeSmsSegments(text = '') {
  // Basic GSM-7 character check
  const gsm7Regex = /^[@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,\-./0-9:;<=>?¡A-ZÄÖÑÜ§¿a-zäöñüà^{}\\[~\]|€]*$/;
  const isGsm7 = gsm7Regex.test(text);
  const length = Array.from(text).length;
  const singleLimit = isGsm7 ? TEXT_LIMITS.smsFallback.gsmSingle : TEXT_LIMITS.smsFallback.ucsSingle;
  const multiLimit = isGsm7 ? TEXT_LIMITS.smsFallback.gsmMulti : TEXT_LIMITS.smsFallback.ucsMulti;
  const segments = length === 0 ? 0 : length <= singleLimit ? 1 : Math.ceil(length / multiLimit);
  const remaining = length <= singleLimit
    ? singleLimit - length
    : (segments * multiLimit) - length;

  return {
    encoding: isGsm7 ? 'GSM-7' : 'UCS-2 (Unicode)',
    length,
    segments,
    singleLimit,
    multiLimit,
    remaining
  };
}

/**
 * Evaluate media fit & crop percentage against target RCS media height/orientation
 */
export function evaluateMediaCrop(dimensions, mediaHeightKey = 'MEDIUM', isCarousel = false, cardWidthKey = 'MEDIUM') {
  const spec = MEDIA_SPECS[mediaHeightKey] || MEDIA_SPECS.MEDIUM;
  let targetRatio = spec.aspectRatio;

  if (isCarousel) {
    const cWidth = CAROUSEL_WIDTH_SPECS[cardWidthKey]?.dpWidth || 264;
    const cHeight = spec.dpHeight || 168;
    targetRatio = cWidth / cHeight;
  }

  const srcW = dimensions?.width || spec.recWidthPx;
  const srcH = dimensions?.height || spec.recHeightPx;
  const srcRatio = srcW / srcH;

  let cropAxis = 'none';
  let visibleFraction = 1;
  let croppedPercent = 0;

  if (Math.abs(srcRatio - targetRatio) > 0.03) {
    if (srcRatio > targetRatio) {
      // Source is wider than container -> left & right sides are cropped
      cropAxis = 'horizontal';
      visibleFraction = targetRatio / srcRatio;
    } else {
      // Source is taller than container -> top & bottom are cropped
      cropAxis = 'vertical';
      visibleFraction = srcRatio / targetRatio;
    }
    croppedPercent = Math.round((1 - visibleFraction) * 100);
  }

  return {
    spec,
    srcW,
    srcH,
    srcRatio,
    targetRatio,
    cropAxis,
    visibleFraction,
    croppedPercent,
    recText: `${spec.recWidthPx}×${spec.recHeightPx}px (${spec.aspectLabel}) • max ${Math.round(spec.maxImageKb / 1024 * 10) / 10}MB`
  };
}
