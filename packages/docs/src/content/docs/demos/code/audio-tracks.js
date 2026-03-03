import { PlayerSdk } from '@enghouse-qumu/player-sdk';

const iframe = document.querySelector('iframe');
const sdk = new PlayerSdk(iframe);

document.getElementById('getAudioTracks').addEventListener('click', () => {
  sdk.getAudioTracks().then((audioTracks) => {
    console.log('audio tracks', audioTracks);
  });
});

document.getElementById('getCurrentAudioTrack').addEventListener('click', () => {
  sdk.getCurrentAudioTrack().then((audioTrack) => {
    console.log('current audioTrack', audioTrack);
  });
});

document.getElementById('setFr').addEventListener('click', () => {
  sdk.setAudioTrack('fr');
});

sdk.addEventListener('audiotrackchange', (newTrack) => {
  console.log('audiotrackchange', newTrack);
});
