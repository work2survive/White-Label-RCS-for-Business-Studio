/**
 * @fileoverview Compact SVG Pictograms & Color-Neutral Documentation Icon Helper
 * Designed for 720p high-density layouts and authentic OS status/message chrome.
 */

export const ICONS = {
  'card-vertical': `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="2" width="12" height="16" rx="2.5"/><rect x="6" y="4" width="8" height="5" rx="1" fill="currentColor" fill-opacity="0.2"/><line x1="6" y1="11.5" x2="14" y2="11.5"/><line x1="6" y1="14.5" x2="11" y2="14.5"/></svg>`,
  'card-horizontal': `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="4" width="16" height="12" rx="2.5"/><rect x="4" y="6" width="5" height="8" rx="1" fill="currentColor" fill-opacity="0.2"/><line x1="11" y1="7.5" x2="16" y2="7.5"/><line x1="11" y1="10.5" x2="16" y2="10.5"/><line x1="11" y1="13" x2="14" y2="13"/></svg>`,
  'carousel': `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="3" width="10" height="14" rx="2"/><rect x="6.5" y="5" width="7" height="4.5" rx="0.8" fill="currentColor" fill-opacity="0.2"/><path d="M2 5.5v9M18 5.5v9" stroke-linecap="round"/><line x1="7" y1="12" x2="13" y2="12"/><line x1="7" y1="14.5" x2="11" y2="14.5"/></svg>`,
  'multi-card': `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="2" width="12" height="7" rx="1.8"/><rect x="4" y="11" width="12" height="7" rx="1.8"/><line x1="6.5" y1="5.5" x2="13.5" y2="5.5"/><line x1="6.5" y1="14.5" x2="13.5" y2="14.5"/></svg>`,
  'text-chips': `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 5.5A2.5 2.5 0 0 1 5.5 3h9A2.5 2.5 0 0 1 17 5.5v4A2.5 2.5 0 0 1 14.5 12H7l-4 3V5.5Z"/><rect x="3" y="14.5" width="6" height="3" rx="1.5"/><rect x="10.5" y="14.5" width="6.5" height="3" rx="1.5"/></svg>`,
  'sms': `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7l-4 3V5Z"/><path d="M6.5 8.5h7M6.5 11h4.5" stroke-linecap="round"/></svg>`,
  'globe': `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10" cy="10" r="7.2"/><path d="M3 10h14M10 2.8c2.2 2.2 2.2 12.2 0 14.4M10 2.8c-2.2 2.2-2.2 12.2 0 14.4"/></svg>`,
  'browser': `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="14" height="12" rx="2"/><line x1="3" y1="7.5" x2="17" y2="7.5"/><circle cx="5.5" cy="5.8" r="0.7" fill="currentColor"/><circle cx="7.8" cy="5.8" r="0.7" fill="currentColor"/></svg>`,
  'phone': `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5.5 3.5h2.4l1.2 3.2-1.7 1.4a10.5 10.5 0 0 0 4.5 4.5l1.4-1.7 3.2 1.2v2.4a1.5 1.5 0 0 1-1.5 1.5A12.5 12.5 0 0 1 4 5a1.5 1.5 0 0 1 1.5-1.5Z"/></svg>`,
  'map-pin': `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10 17s5.5-4.6 5.5-8.8a5.5 5.5 0 1 0-11 0C4.5 12.4 10 17 10 17Z"/><circle cx="10" cy="8.2" r="2"/></svg>`,
  'calendar': `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4.5" width="14" height="12.5" rx="2"/><path d="M6.5 3v3M13.5 3v3M3 8.5h14"/></svg>`,
  'reply': `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 6 4 10l4 4"/><path d="M4 10h7.5a4.5 4.5 0 0 1 4.5 4.5v.5"/></svg>`,
  'crop': `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 2.5v11.5h11.5M3 6h11v11"/></svg>`,
  'sun': `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10" cy="10" r="3.6"/><path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4"/></svg>`,
  'moon': `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M15.8 12.6A6.5 6.5 0 0 1 7.4 4.2a6.5 6.5 0 1 0 8.4 8.4Z"/></svg>`,
  'zoom-in': `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="9" cy="9" r="5.5"/><path d="m13 13 4 4M9 6.5v5M6.5 9h5"/></svg>`,
  'zoom-out': `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="9" cy="9" r="5.5"/><path d="m13 13 4 4M6.5 9h5"/></svg>`,
  'upload': `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10 13V4m0 0L6.5 7.5M10 4l3.5 3.5"/><path d="M3.5 13.5v2a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5v-2"/></svg>`,
  'play': `<svg viewBox="0 0 20 20" fill="currentColor"><path d="M6.5 4.8a1 1 0 0 1 1.5-.86l8 5.2a1 1 0 0 1 0 1.72l-8 5.2a1 1 0 0 1-1.5-.86V4.8Z"/></svg>`,
  'plus': `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 4v12M4 10h12" stroke-linecap="round"/></svg>`,
  'trash': `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 6h12M8 6V4h4v2M6 6v10a1.5 1.5 0 0 0 1.5 1.5h5A1.5 1.5 0 0 0 14 16V6"/></svg>`,
  'verified': `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z"/></svg>`,
  'shield-g': `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5c1.21 0 2.23.44 3.01 1.18l-1.29 1.24c-.35-.34-.96-.67-1.72-.67-1.47 0-2.67 1.22-2.67 2.75s1.2 2.75 2.67 2.75c1.38 0 2.18-.79 2.36-1.75H12v-1.65h4.18c.05.28.08.56.08.92 0 2.61-1.75 4.23-4.26 4.23z"/></svg>`,
  'code': `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m6.5 6.5-3.5 3.5 3.5 3.5M13.5 6.5 17 10l-3.5 3.5M11.2 4.5l-2.4 11"/></svg>`,
  'analytics': `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 16V10M8 16V6M12 16v-4M16 16V4" stroke-linecap="round"/></svg>`,
  'device': `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="2" width="10" height="16" rx="2"/><line x1="8.5" y1="15.5" x2="11.5" y2="15.5"/></svg>`
};

/**
 * Tiny, ultra-neutral documentation link badge (`13×13px`) that opens official
 * Google RCS for Business documentation for the specific UI element or spec.
 */
export function renderDocLink(url, tooltip = 'Official Google RCS API Documentation') {
  const safeTitle = String(tooltip).replace(/"/g, '&quot;');
  return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="rcs-doc-link" title="${safeTitle}" aria-label="${safeTitle}" onclick="event.stopPropagation()">
    <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="8" cy="8" r="6.2"/>
      <path d="M8 7.2v4.2M8 4.8h.01" stroke-linecap="round"/>
    </svg>
  </a>`;
}

export function getIcon(name, className = 'rcs-ico') {
  const svg = ICONS[name] || ICONS['globe'];
  return `<span class="${className}" aria-hidden="true">${svg}</span>`;
}
