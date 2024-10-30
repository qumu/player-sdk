import { PlayerSdk } from '@enghouse-qumu/player-sdk';

const iframe = document.querySelector('iframe');
const sdk = new PlayerSdk(iframe);

document.getElementById('getLiveState').addEventListener('click', () => {
  sdk.getLiveState().then((liveState) => {
    console.log('live state', liveState);
  });
});

document.getElementById('getLiveStartTime').addEventListener('click', () => {
  sdk.getLiveStartTime().then((startTime) => {
    console.log('start time', startTime);
  });
});

document.getElementById('getLiveEndTime').addEventListener('click', () => {
  sdk.getLiveEndTime().then((endTime) => {
    console.log('end time', endTime);
  });
});

sdk.addEventListener('livestatechange', (newLiveState) => {
  console.log('livestatechange', newLiveState);
});
