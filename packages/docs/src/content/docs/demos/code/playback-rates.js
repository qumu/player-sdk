import { PlayerSdk } from '@enghouse-qumu/player-sdk';

const iframe = document.querySelector('iframe');
const sdk = new PlayerSdk(iframe);

document.getElementById('getPlaybackRates').addEventListener('click', () => {
  sdk.getPlaybackRates().then((playbackRates) => {
    console.log('Playback rates', playbackRates);
  });
});

document.getElementById('getPlaybackRate').addEventListener('click', () => {
  sdk.getPlaybackRate().then((playbackRate) => {
    console.log('Current playback rate', playbackRate);
  });
});

document.getElementById('setPlaybackRate25').addEventListener('click', () => {
  sdk.setPlaybackRate(0.25);
});

document.getElementById('setPlaybackRate50').addEventListener('click', () => {
  sdk.setPlaybackRate(0.5);
});

document.getElementById('setPlaybackRate75').addEventListener('click', () => {
  sdk.setPlaybackRate(0.75);
});

document.getElementById('setPlaybackRate100').addEventListener('click', () => {
  sdk.setPlaybackRate(1);
});

document.getElementById('setPlaybackRate125').addEventListener('click', () => {
  sdk.setPlaybackRate(1.25);
});

document.getElementById('setPlaybackRate150').addEventListener('click', () => {
  sdk.setPlaybackRate(1.5);
});

document.getElementById('setPlaybackRate200').addEventListener('click', () => {
  sdk.setPlaybackRate(2);
});

sdk.addEventListener('playbackratechange', (newPlaybackRate) => {
  console.log('playbackratechange', newPlaybackRate);
});
