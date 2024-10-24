import { PlayerSdk } from '@enghouse-qumu/player-sdk';

const iframe = document.querySelector('iframe');
const sdk = new PlayerSdk(iframe);

document.getElementById('getCaptionTracks').addEventListener('click', () => {
  sdk.getCaptionTracks().then((captionTracks) => {
    console.log('caption tracks', captionTracks);
  });
});

document.getElementById('getCurrentCaptionTrack').addEventListener('click', () => {
  sdk.getCurrentCaptionTrack().then((captionTrack) => {
    console.log('current captionTrack', captionTrack);
  });
});

document.getElementById('disableTextTracks').addEventListener('click', () => {
  sdk.disableTextTracks();
});

document.getElementById('setEn').addEventListener('click', () => {
  sdk.enableCaptionTrack('en');
});

document.getElementById('setFr').addEventListener('click', () => {
  sdk.enableCaptionTrack('fr');
});

document.getElementById('setIt').addEventListener('click', () => {
  sdk.enableCaptionTrack('it');
});

document.getElementById('setEs').addEventListener('click', () => {
  sdk.enableCaptionTrack('es');
});

sdk.addEventListener('captiontrackchange', (newLanguage) => {
  console.log('captiontrackchange', newLanguage);
});
