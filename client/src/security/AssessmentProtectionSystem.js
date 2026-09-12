/**
 * Assessment Protection System (Decoupled Security Module)
 * 
 * Provides automated detection of browser extensions, foreign script injections,
 * native JavaScript API hooking, anti-cheat bypassers (e.g., Always Active Window),
 * and isolated environment verification.
 * 
 * Used prior to exam launch to block attempts until the browser is extension-free.
 */

// Known extension selectors, DOM markers, and bypasser signatures
const KNOWN_EXTENSION_SELECTORS = [
  '#lwys-ctv-port',
  '[id*="lwys-ctv"]',
  '[data-pointercapture]',
  '[data-blur]',
  'grammarly-desktop-integration',
  'grammarly-extension',
  '[data-grammarly-part]',
  '[data-grammarly-shadow-root]',
  '#chatgpt-sidebar',
  '#ai-sidebar',
  '#sider-root',
  '#monica-root',
  '[id*="monica-"]',
  '[id*="sider-"]',
  '[class*="monica-"]',
  '[class*="sider-"]',
  '[id*="harpa-"]',
  '#immersive-translate-popup',
  '[data-immersive-translate-root]',
  '.goog-te-banner-frame',
  '#volume-booster-container',
  '#color-picker-container',
  '[id*="coupon"]',
  '[id*="honey-container"]',
  '#qb-sou-root',
  '[class*="extension-root"]',
  '[id*="dsa-tracker"]',
  '[class*="dsa-tracker"]',
  '[id*="leetcode-cheatsheet"]',
  '[id*="copilot-"]'
];

const KNOWN_GLOBAL_MARKERS = [
  '__lwys_ctv__',
  '__alwaysActiveWindow__',
  '__grammarly',
  '__CHATGPT_EXTENSION__',
  '_monica',
  '__SIDER__',
  '__HARPA__',
  '__EXT_INSTALLED__',
  'czShortcutListen'
];

// Common extension IDs with Web Accessible Resources and Chromium runtime IDs
export const KNOWN_EXTENSION_IDS = [
  { id: 'ehllkhjndgnlokhomdlhgbineffifcbj', name: 'Always active Window - Always Visible' },
  { id: 'fpjppnhnpnknbenelmbnidjbolhandnf', name: 'Enable Copy Paste - E.C.P' },
  { id: 'aefehdhdciieocakfobpaaolhipkcpgc', name: 'Simple Allow Copy' },
  { id: 'kbfnbcaeplbcioakkpcpgfkobkghlhen', name: 'Grammarly AI Assistant' },
  { id: 'inomeogfingihgjfjlpeplalcfajhgai', name: 'Chrome Remote Desktop' },
  { id: 'cghlldkonphebajalhncccpjahpliaea', name: 'CU Internet Auto Login' },
  { id: 'jpkfgepcmmchgfbjblnodjhldacghenp', name: 'AdBlocker Pro' },
  { id: 'dhdgffkkebhmkfjojejmpbldmpobfkfo', name: 'Tampermonkey' },
  { id: 'jinjaccalgkegednnccohejagnlnfdag', name: 'Violentmonkey' },
  { id: 'mlloloooolpffjkjaclpfpeednngpjon', name: 'Always Active Tab / Focus Spoofer' },
  { id: 'flliilndjeohchalpoidhhkfbdbljkgc', name: 'DontFuckWithPaste' },
  { id: 'pjhaggmfdnammjodfaojlnpobcbbhecn', name: 'Allow Right Click' },
  { id: 'hhojmcideegachlhfgfdhailpfhgknjm', name: 'SuperCopy - Enable Copy' },
  { id: 'gemfoflljhlndebgkdlnbcoebjkgbfad', name: 'Absolute Enable Right Click & Copy' },
  { id: 'alhinllfeapfdfnamjbdgiphfcnoenik', name: 'Auto Tab Switcher' },
  { id: 'pajimflpnjocndocohmahffjdheinggb', name: 'Tab Focus Bypasser' },
  { id: 'chnccghejnflbccphgkncbmllhfljdfa', name: 'Background Page / Window Bypasser' }
];

/**
 * Validates that a core browser API has not been hooked or monkey-patched.
 * Pure native functions always produce: "function <name>() { [native code] }"
 */
function isNativeFunction(fn) {
  try {
    if (typeof fn !== 'function') return false;
    const fnStr = Function.prototype.toString.call(fn);
    return fnStr.includes('[native code]');
  } catch (e) {
    return false;
  }
}

/**
 * 1. Checks JavaScript Native API Integrity & Anti-Cheat Bypasser Hooks.
 * Specifically checks for tampering on:
 * - document.hasFocus (Proxied by Always Active Window)
 * - document.hidden & document.visibilityState (Instance properties defined by extensions)
 * - window.requestAnimationFrame / cancelAnimationFrame (Proxied by Always Active Window)
 * - window.addEventListener / document.addEventListener / EventTarget prototypes
 * - window.fetch / navigator.clipboard
 */
export function checkApiIntegrity() {
  const tamperedApis = [];

  // 1A. Check document.hasFocus tampering (Always Active Window proxy check)
  try {
    if (!isNativeFunction(Document.prototype.hasFocus) || !isNativeFunction(document.hasFocus)) {
      tamperedApis.push('document.hasFocus (non-native function)');
    } else {
      // In standard native DOM, calling Document.prototype.hasFocus with a non-Document this (e.g. {})
      // throws a TypeError: Illegal invocation. Always Active Window proxy intercepts and returns true!
      try {
        const result = Document.prototype.hasFocus.call({});
        if (result === true || typeof result === 'boolean') {
          tamperedApis.push('document.hasFocus (intercepted by Proxy / Always Active Window)');
        }
      } catch (err) {
        // Expected native behavior is TypeError: Illegal invocation.
        const isIllegalInvocation =
          err &&
          err.name === 'TypeError' &&
          (err.message.toLowerCase().includes('illegal invocation') ||
            err.message.toLowerCase().includes('incompatible') ||
            err.message.toLowerCase().includes('called on non-object'));
        if (!isIllegalInvocation) {
          tamperedApis.push('document.hasFocus (anomalous prototype execution)');
        }
      }
    }
  } catch (e) {
    tamperedApis.push('document.hasFocus (inspection failure)');
  }

  // 1B. Check document.hidden & document.visibilityState property hijacking
  // In native DOM, these are getters on Document.prototype, NOT own properties on 'document'.
  // Extensions like Always Active Window use Object.defineProperty(document, 'hidden', ...)
  if (Object.prototype.hasOwnProperty.call(document, 'hidden')) {
    tamperedApis.push('document.hidden (overridden on document instance by extension)');
  }
  if (Object.prototype.hasOwnProperty.call(document, 'visibilityState')) {
    tamperedApis.push('document.visibilityState (overridden on document instance by extension)');
  }
  if (Object.prototype.hasOwnProperty.call(document, 'webkitHidden')) {
    tamperedApis.push('document.webkitHidden (overridden on document instance)');
  }
  if (Object.prototype.hasOwnProperty.call(document, 'webkitVisibilityState')) {
    tamperedApis.push('document.webkitVisibilityState (overridden on document instance)');
  }

  // 1C. Check Document.prototype getters integrity
  try {
    const hiddenDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden');
    if (hiddenDesc && hiddenDesc.get) {
      if (!isNativeFunction(hiddenDesc.get)) {
        tamperedApis.push('Document.prototype.hidden getter (tampered)');
      } else {
        try {
          hiddenDesc.get.call({});
          tamperedApis.push('Document.prototype.hidden getter (Proxy intercepted)');
        } catch (err) {
          // Expected Illegal invocation
        }
      }
    }
  } catch (e) {}

  try {
    const visDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState');
    if (visDesc && visDesc.get) {
      if (!isNativeFunction(visDesc.get)) {
        tamperedApis.push('Document.prototype.visibilityState getter (tampered)');
      } else {
        try {
          visDesc.get.call({});
          tamperedApis.push('Document.prototype.visibilityState getter (Proxy intercepted)');
        } catch (err) {
          // Expected Illegal invocation
        }
      }
    }
  } catch (e) {}

  // 1D. Check requestAnimationFrame & cancelAnimationFrame
  if (!isNativeFunction(window.requestAnimationFrame)) {
    tamperedApis.push('window.requestAnimationFrame (Proxy / Hooked)');
  }
  if (!isNativeFunction(window.cancelAnimationFrame)) {
    tamperedApis.push('window.cancelAnimationFrame (Proxy / Hooked)');
  }

  // 1E. Check Core EventTarget and Communication APIs
  if (!isNativeFunction(window.fetch)) tamperedApis.push('window.fetch');
  if (!isNativeFunction(document.addEventListener)) tamperedApis.push('document.addEventListener');
  if (!isNativeFunction(window.addEventListener)) tamperedApis.push('window.addEventListener');
  if (!isNativeFunction(EventTarget.prototype.addEventListener)) tamperedApis.push('EventTarget.prototype.addEventListener');
  if (!isNativeFunction(EventTarget.prototype.dispatchEvent)) tamperedApis.push('EventTarget.prototype.dispatchEvent');
  if (!isNativeFunction(window.WebSocket)) tamperedApis.push('window.WebSocket');

  // In native DOM, window does not have an own property addEventListener
  if (Object.prototype.hasOwnProperty.call(window, 'addEventListener')) {
    tamperedApis.push('window.addEventListener (own property override)');
  }
  if (Object.prototype.hasOwnProperty.call(document, 'addEventListener')) {
    tamperedApis.push('document.addEventListener (own property override)');
  }

  if (navigator.clipboard && !isNativeFunction(navigator.clipboard.writeText)) {
    tamperedApis.push('navigator.clipboard.writeText');
  }

  return {
    passed: tamperedApis.length === 0,
    tamperedApis
  };
}

/**
 * Whitelist of known benign hosting platform, CDN, framework, and UI portal elements.
 * Prevents false positives from Netlify badges (<iframe id="nl-badge-frame">),
 * Vercel analytics/speed-insights, Cloudflare challenges, React modals, etc.
 */
const BENIGN_DOM_IDS = new Set([
  'root',
  'nl-badge-frame',
  'netlify-badge',
  'netlify-identity-widget',
  'webpack-dev-server-client-overlay',
  'vite-plugin-checker-error-overlay',
  'modal-root',
  'portal-root',
  'headlessui-portal-root',
  'toast-root',
  'react-portal',
  'credential_picker_container'
]);

function isBenignElement(el) {
  if (!el || !el.tagName) return true;
  const tag = el.tagName.toLowerCase();
  if (tag === 'script' || tag === 'noscript' || tag === 'style' || tag === 'link') return true;

  const id = (el.id || '').toLowerCase();
  if (BENIGN_DOM_IDS.has(id)) return true;

  // Netlify / Vercel / Cloudflare hosting widgets & framework portals
  if (
    id.startsWith('nl-') ||
    id.includes('netlify') ||
    id.includes('vercel') ||
    id.includes('cloudflare') ||
    id.startsWith('headlessui-') ||
    id.startsWith('react-aria-') ||
    id.includes('portal')
  ) {
    return true;
  }

  const className = typeof el.className === 'string' ? el.className.toLowerCase() : '';
  if (
    className.includes('netlify') ||
    className.includes('portal') ||
    className.includes('toast') ||
    className.includes('tooltip')
  ) {
    return true;
  }

  // Google Sign-In or Google Translate benign elements
  if (id.startsWith('goog-') || className.includes('goog-')) return true;

  return false;
}

/**
 * 2. Checks for Injected DOM Elements, Ports, Foreign Nodes, and Extension Attributes.
 */
export function checkDomInjections() {
  const detectedItems = [];

  // 2A. Direct Always Active Window communication port check
  const lwysPort = document.getElementById('lwys-ctv-port') || document.querySelector('[id*="lwys-ctv"]');
  if (lwysPort) {
    detectedItems.push('Always Active Window communication port element (#lwys-ctv-port)');
  }

  // 2B. Direct children of document.documentElement
  // In standard HTML, <html> contains ONLY <head> and <body>.
  // Always Active Window appends <span id="lwys-ctv-port"> directly to documentElement!
  if (document.documentElement && document.documentElement.children) {
    for (let i = 0; i < document.documentElement.children.length; i++) {
      const child = document.documentElement.children[i];
      const tag = child.tagName.toLowerCase();
      if (tag !== 'head' && tag !== 'body') {
        if (isBenignElement(child)) continue;
        detectedItems.push(`Injected element on <html> root: <${tag}${child.id ? ` id="${child.id}"` : ''}>`);
      }
    }
  }

  // 2C. Foreign siblings of #root in document.body
  // In this React application, <body> should only contain #root and bundle <script> tags.
  // Whitelist benign hosting elements like Netlify badge (<iframe id="nl-badge-frame">)
  if (document.body && document.body.children) {
    for (let i = 0; i < document.body.children.length; i++) {
      const child = document.body.children[i];
      const tag = child.tagName.toLowerCase();
      if (child.id !== 'root') {
        if (isBenignElement(child)) continue;
        // Foreign element injected by extension (e.g., Grammarly, DSA Tracker, ChatGPT sidebar)
        detectedItems.push(`Foreign body element: <${tag}${child.id ? ` id="${child.id}"` : ''}${child.className && typeof child.className === 'string' ? ` class="${child.className.substring(0, 30)}"` : ''}>`);
      }
    }
  }

  // 2D. Check known extension selectors
  for (const sel of KNOWN_EXTENSION_SELECTORS) {
    try {
      const el = document.querySelector(sel);
      if (el) {
        detectedItems.push(`Extension element matched: ${sel}`);
      }
    } catch (ignored) {}
  }

  // 2E. Check known custom elements
  if (window.customElements) {
    const knownCustomTags = [
      'grammarly-desktop-integration',
      'grammarly-extension',
      'immersive-translate-custom-element',
      'chatgpt-sidebar-element',
      'dsa-tracker-widget'
    ];
    for (const tag of knownCustomTags) {
      if (customElements.get(tag)) {
        detectedItems.push(`Custom web component: <${tag}>`);
      }
    }
  }

  // 2F. Extension-specific DOM attributes
  const extensionAttributes = [
    'cz-shortcut-listen',
    'data-gr-ext-installed',
    'data-new-gr-c-s-check-loaded',
    'data-lt-installed',
    'data-loom-blur',
    'data-pointercapture',
    'data-extension-id'
  ];
  for (const attr of extensionAttributes) {
    if (document.documentElement.hasAttribute(attr) || (document.body && document.body.hasAttribute(attr))) {
      detectedItems.push(`Extension DOM attribute detected: [${attr}]`);
    }
  }

  // 2G. Check for external extension subresources (chrome-extension:// or moz-extension://)
  const resourceTags = document.querySelectorAll('script, link, iframe, embed, style');
  resourceTags.forEach((tag) => {
    const src = tag.getAttribute('src') || tag.getAttribute('href') || '';
    if (src.startsWith('chrome-extension://') || src.startsWith('moz-extension://')) {
      detectedItems.push(`Extension subresource loaded: ${src.substring(0, 50)}...`);
    }
  });

  return {
    passed: detectedItems.length === 0,
    detectedItems
  };
}

/**
 * 3. Checks for Global Window Object Extension Artifacts.
 */
export function checkGlobalMarkers() {
  const detectedMarkers = [];

  for (const marker of KNOWN_GLOBAL_MARKERS) {
    if (window[marker] !== undefined) {
      detectedMarkers.push(`window.${marker}`);
    }
  }

  return {
    passed: detectedMarkers.length === 0,
    detectedMarkers
  };
}

/**
 * 4. Checks Browser Storage Quota & Private Browsing Isolation.
 */
export async function checkIncognitoMode() {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const { quota } = await navigator.storage.estimate();
      // In Chrome/Chromium incognito mode, storage quota is strictly capped (< 2.5 GB)
      if (quota && quota < 2500 * 1024 * 1024) {
        return { isIncognito: true, quota };
      }
      return { isIncognito: false, quota };
    }
  } catch (e) {}

  return { isIncognito: false, quota: null };
}

/**
 * 5. Probes for known extensions via Chromium Runtime Handshake, fetch/WAR, and DOM/CSS.
 *
 * In Chromium (Chrome/Edge/Brave):
 * - If extension is NOT installed: chrome.runtime.sendMessage(extId) fails with:
 *     "Could not establish connection. Receiving end does not exist."
 * - If extension IS installed (even if externally_connectable is false or not specified):
 *     Chromium verifies the extension ID exists in the ExtensionRegistry and fails with:
 *     "Access to the specified extension ID is denied."
 *   Therefore, receiving "Access to the specified extension ID is denied" is 100% cryptographic proof
 *   that the extension is installed and active in the user's browser!
 * - If externally_connectable allows it or extension answers, response or other runtime message confirms installation.
 */
export async function probeKnownExtensions() {
  const detected = [];

  // 5A. Chromium runtime sendMessage probe
  const probeRuntime = (extId) =>
    new Promise((resolve) => {
      try {
        if (
          typeof window !== 'undefined' &&
          window.chrome &&
          window.chrome.runtime &&
          typeof window.chrome.runtime.sendMessage === 'function'
        ) {
          let resolved = false;
          const timer = setTimeout(() => {
            if (!resolved) {
              resolved = true;
              resolve({ installed: false, reason: 'timeout' });
            }
          }, 350);

          try {
            window.chrome.runtime.sendMessage(extId, { type: 'ping', action: 'check' }, (response) => {
              if (resolved) return;
              resolved = true;
              clearTimeout(timer);

              const lastErr = window.chrome.runtime.lastError;
              if (lastErr && lastErr.message) {
                const msg = lastErr.message.toLowerCase();
                // If Chrome says "Access to the specified extension ID is denied", it specifically means:
                // Extension exists in the Chrome Extension Service, but caller origin is not in externally_connectable.
                // If extension does not exist at all, Chrome says: "Could not establish connection. Receiving end does not exist."
                if (
                  msg.includes('access to the specified extension id is denied') ||
                  msg.includes('permission denied') ||
                  msg.includes('not permitted')
                ) {
                  resolve({ installed: true, reason: lastErr.message });
                  return;
                }
                resolve({ installed: false, reason: lastErr.message });
                return;
              }

              // If a response was returned, extension is certainly installed
              if (response !== undefined) {
                resolve({ installed: true, reason: 'responded' });
                return;
              }

              resolve({ installed: false, reason: 'empty' });
            });
          } catch (invokeErr) {
            if (!resolved) {
              resolved = true;
              clearTimeout(timer);
              resolve({ installed: false, reason: invokeErr.message });
            }
          }
        } else {
          resolve({ installed: false, reason: 'no-chrome-runtime' });
        }
      } catch (err) {
        resolve({ installed: false, reason: err.message });
      }
    });

  // 5B. Probe accessible resources (images / manifest / css)
  const probeResource = (url, timeoutMs = 150) =>
    new Promise((resolve) => {
      const img = new Image();
      let finished = false;
      img.onload = () => {
        if (!finished) {
          finished = true;
          resolve(true);
        }
      };
      img.onerror = () => {
        if (!finished) {
          finished = true;
          resolve(false);
        }
      };
      img.src = url;
      setTimeout(() => {
        if (!finished) {
          finished = true;
          resolve(false);
        }
      }, timeoutMs);
    });

  // 5C. Fetch probe (catches CORS vs 404 differences on web_accessible_resources)
  const probeFetch = async (url) => {
    try {
      const ctrl = new AbortController();
      const tId = setTimeout(() => ctrl.abort(), 180);
      const res = await fetch(url, { method: 'HEAD', mode: 'no-cors', credentials: 'omit', signal: ctrl.signal });
      clearTimeout(tId);
      return res.type === 'opaque' || res.status === 200;
    } catch (e) {
      return false;
    }
  };

  // Run probing across known extension catalogue
  for (const ext of KNOWN_EXTENSION_IDS) {
    // 1. Chromium runtime handshake
    const runtimeResult = await probeRuntime(ext.id);
    if (runtimeResult.installed) {
      detected.push(`Active extension found: ${ext.name} (${ext.id})`);
      continue;
    }

    // 2. Resource image probe
    const icon1 = await probeResource(`chrome-extension://${ext.id}/data/icons/16.png`, 80);
    const icon2 = !icon1 ? await probeResource(`chrome-extension://${ext.id}/icons/icon16.png`, 80) : true;
    const icon3 = (!icon1 && !icon2) ? await probeResource(`chrome-extension://${ext.id}/icon.png`, 80) : true;
    if (icon1 || icon2 || icon3) {
      detected.push(`Active extension found: ${ext.name} (${ext.id})`);
      continue;
    }

    // 3. Fetch probe
    const fetchProbe = await probeFetch(`chrome-extension://${ext.id}/manifest.json`);
    if (fetchProbe) {
      detected.push(`Active extension found: ${ext.name} (${ext.id})`);
    }
  }

  return {
    passed: detected.length === 0,
    detected
  };
}

/**
 * Run full pre-exam diagnostic security scan.
 * Returns comprehensive report with pass/fail status and actionable remediation advice.
 */
export async function runFullSecurityScan() {
  const apiCheck = checkApiIntegrity();
  const domCheck = checkDomInjections();
  const markerCheck = checkGlobalMarkers();
  const warProbe = await probeKnownExtensions();
  const incognitoCheck = await checkIncognitoMode();

  const allIssues = [];

  if (!apiCheck.passed) {
    allIssues.push({
      category: 'API_HOOKING',
      title: 'Anti-Cheat Bypasser & API Tampering Detected',
      details: `Active browser extension modified core browser functions: ${apiCheck.tamperedApis.join('; ')}`
    });
  }

  if (!domCheck.passed) {
    allIssues.push({
      category: 'DOM_INJECTION',
      title: 'Browser Extension DOM Injections Detected',
      details: `Found extension elements on page: ${domCheck.detectedItems.join('; ')}`
    });
  }

  if (!markerCheck.passed) {
    allIssues.push({
      category: 'GLOBAL_MARKER',
      title: 'Active Extension Artifacts Detected',
      details: `Found extension global objects: ${markerCheck.detectedMarkers.join(', ')}`
    });
  }

  if (!warProbe.passed) {
    allIssues.push({
      category: 'EXTENSION_PROBE',
      title: 'Known Extension Installation Detected',
      details: `${warProbe.detected.join('; ')}`
    });
  }

  const passed = allIssues.length === 0;

  return {
    passed,
    timestamp: new Date().toISOString(),
    issueCount: allIssues.length,
    issues: allIssues,
    incognito: incognitoCheck.isIncognito,
    summary: passed
      ? 'Protected environment verified. Zero browser extensions detected.'
      : 'Active browser extensions detected. Exam cannot start until all extensions are deactivated.'
  };
}

/**
 * Starts continuous runtime observer during active exam.
 * If any extension attempts to inject scripts or elements mid-exam, callbacks are triggered.
 */
export function startRuntimeProtectionObserver(onViolation) {
  let observer = null;

  try {
    observer = new MutationObserver((mutations) => {
      for (const mut of mutations) {
        for (const node of mut.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node;
            if (isBenignElement(el)) continue;

            const tagName = el.tagName.toLowerCase();
            const id = el.id ? el.id.toLowerCase() : '';
            const className = el.className && typeof el.className === 'string' ? el.className.toLowerCase() : '';

            const isSuspect =
              id === 'lwys-ctv-port' ||
              id.includes('lwys-') ||
              tagName.includes('grammarly') ||
              id.includes('monica') ||
              id.includes('sider') ||
              id.includes('chatgpt') ||
              id.includes('dsa-tracker') ||
              id.includes('ai-sidebar') ||
              id.includes('chatgpt-sidebar') ||
              id.includes('copilot-sidebar') ||
              className.includes('extension') ||
              (el.getAttribute('src') &&
                (el.getAttribute('src').startsWith('chrome-extension://') ||
                  el.getAttribute('src').startsWith('moz-extension://')));

            if (isSuspect) {
              if (typeof onViolation === 'function') {
                onViolation({
                  type: 'EXTENSION_INJECTED_MID_EXAM',
                  element: tagName,
                  details: `Unauthorized extension component <${tagName}${el.id ? ` id="${el.id}"` : ''}> was injected into the exam window.`
                });
              }
            }
          }
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  } catch (err) {
    console.warn('Runtime protection observer notice:', err);
  }

  // Also hook into Security Policy Violation
  const cspHandler = (e) => {
    if (e.blockedURI && (e.blockedURI.startsWith('chrome-extension://') || e.blockedURI.startsWith('moz-extension://'))) {
      if (typeof onViolation === 'function') {
        onViolation({
          type: 'CSP_EXTENSION_BLOCK',
          details: `Extension script blocked from executing: ${e.blockedURI}`
        });
      }
    }
  };

  window.addEventListener('securitypolicyviolation', cspHandler);

  // Return teardown function
  return function stopRuntimeProtection() {
    if (observer) {
      observer.disconnect();
    }
    window.removeEventListener('securitypolicyviolation', cspHandler);
  };
}
