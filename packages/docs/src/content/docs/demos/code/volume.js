import { PlayerSdk } from '@enghouse-qumu/player-sdk';

const iframe = document.querySelector('iframe');
const sdk = new PlayerSdk(iframe);

document.getElementById('getVolume').addEventListener('click', () => {
  sdk.getVolume().then((volume) => {
    console.log('volume', volume);
  });
});

document.getElementById('setVolume0').addEventListener('click', () => {
  sdk.setVolume(0);
});

document.getElementById('setVolume50').addEventListener('click', () => {
  sdk.setVolume(50);
});

document.getElementById('setVolume100').addEventListener('click', () => {
  sdk.setVolume(100);
});

sdk.addEventListener('volumechange', (newVolume) => {
  console.log('volumechange', newVolume);
});
