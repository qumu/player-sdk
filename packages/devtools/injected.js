const domains = [
  'qumucloud.com',
  'qumu.dev',
  'qumu.ninja',
];

(() => {
  window.addEventListener('message', (event) => {
    console.log('message', event);

    if (!domains.some((d) => event.origin.endsWith(d))) {
      return;
    }

    // Relay the captured message as a custom DOM event
    // eslint-disable-next-line no-undef
    document.dispatchEvent(new CustomEvent('__QC_SDK_FROM_PLAYER__', {
      detail: event.data,
    }));
  });
})();
