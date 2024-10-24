import { PlayerSdk } from '@enghouse-qumu/player-sdk';

const iframe = document.querySelector('iframe');
const sdk = new PlayerSdk(iframe);

document.getElementById('play').addEventListener('click', () => {
  sdk.play();
});

document.getElementById('pause').addEventListener('click', () => {
  sdk.pause();
});

document.getElementById('getDuration').addEventListener('click', () => {
  sdk.getDuration()
    .then((duration) => console.log('duration', duration));
});

document.getElementById('getCurrentTime').addEventListener('click', () => {
  sdk.getCurrentTime()
    .then((currentTime) => console.log('current time', currentTime));
});

document.getElementById('getIsPaused').addEventListener('click', () => {
  sdk.isPaused()
    .then((isPaused) => console.log('is paused', isPaused));
});

document.getElementById('getPresentation').addEventListener('click', () => {
  sdk.getPresentation()
    .then((presentation) => console.log('presentation', presentation));
});

document.getElementById('seek').addEventListener('click', () => {
  sdk.setCurrentTime(20000);
});

sdk.addEventListener('timeupdate', (newTime) => {
  console.log('timeupdate', newTime);
});

sdk.addEventListener('play', () => {
  console.log('play');
});

sdk.addEventListener('pause', () => {
  console.log('pause');
});

sdk.addEventListener('ended', () => {
  console.log('ended');
});
