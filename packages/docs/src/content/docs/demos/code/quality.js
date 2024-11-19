import { PlayerSdk } from '@enghouse-qumu/player-sdk';

const iframe = document.querySelector('iframe');
const sdk = new PlayerSdk(iframe);

document.getElementById('getLevels').addEventListener('click', () => {
  sdk.getLevels().then((levels) => {
    console.log('levels', levels);
  });
});

document.getElementById('getLevel').addEventListener('click', () => {
  sdk.getLevel().then((level) => {
    console.log('level', level);
  });
});

document.getElementById('getPlaybackLevel').addEventListener('click', () => {
  sdk.getPlaybackLevel().then((playbackLevel) => {
    console.log('playbackLevel', playbackLevel);
  });
});

document.getElementById('setLevelAuto').addEventListener('click', () => {
  sdk.setLevel(-1);
});

document.getElementById('setLevel1080p').addEventListener('click', () => {
  sdk.setLevel(4);
});

document.getElementById('setLevel720p').addEventListener('click', () => {
  sdk.setLevel(3);
});

document.getElementById('setLevel480p').addEventListener('click', () => {
  sdk.setLevel(2);
});

document.getElementById('setLevel240p').addEventListener('click', () => {
  sdk.setLevel(1);
});

sdk.addEventListener('levelchange', (newLevel) => {
  console.log('levelchange', newLevel);
});

sdk.addEventListener('playbacklevelchange', (newPlaybackLevel) => {
  console.log('playbacklevelchange', newPlaybackLevel);
});
