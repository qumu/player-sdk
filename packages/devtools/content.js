// Inject our script into the page context
const s = document.createElement('script');

s.src = chrome.runtime.getURL('injected.js');
(document.head || document.documentElement).appendChild(s);

s.remove();

// Listen to the custom event and forward to background.js
document.addEventListener('__QC_SDK_FROM_PLAYER__', (e) => {
  chrome.runtime.sendMessage({
    from: 'player',
    payload: e.detail,
    type: 'captured',
  });
});

// Listen to the custom event and forward to background.js
document.addEventListener('__QC_SDK_FROM_SDK__', (e) => {
  chrome.runtime.sendMessage({
    from: 'sdk',
    payload: e.detail,
    type: 'captured',
  });
});
