import { PlayerSdk } from '@enghouse-qumu/player-sdk';

const iframe = document.querySelector('iframe');
const sdk = new PlayerSdk(iframe);

document.getElementById('getAudienceReactions').addEventListener('click', () => {
  sdk.getAudienceReactions().then((reactions) => {
    console.log('reactions', reactions);
  });
});

document.getElementById('sendAudienceReactionHeart').addEventListener('click', () => {
  sdk.sendAudienceReaction('2764');
});
