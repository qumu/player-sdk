import { PlayerSdk } from '@enghouse-qumu/player-sdk';

const iframe = document.querySelector('iframe');
const sdk = new PlayerSdk(iframe);

document.getElementById('getLayout').addEventListener('click', () => {
  sdk.getLayout().then((layout) => {
    console.log('layout', layout);
  });
});

document.getElementById('getPrimaryContent').addEventListener('click', () => {
  sdk.getPrimaryContent().then((primaryContent) => {
    console.log('primary content', primaryContent);
  });
});

document.getElementById('getPictureInPicturePosition').addEventListener('click', () => {
  sdk.getPictureInPicturePosition().then((pipPosition) => {
    console.log('PiP position', pipPosition);
  });
});

document.getElementById('getSideBySideRatio').addEventListener('click', () => {
  sdk.getSideBySideRatio().then((sbsRatio) => {
    console.log('SbS ratio', sbsRatio);
  });
});

document.getElementById('setLayoutPiP').addEventListener('click', () => {
  sdk.setLayout('pip');
});

document.getElementById('setLayoutSbS').addEventListener('click', () => {
  sdk.setLayout('sbs');
});

document.getElementById('setPrimaryContentMedia').addEventListener('click', () => {
  sdk.setPrimaryContent('media');
});

document.getElementById('setPrimaryContentSlides').addEventListener('click', () => {
  sdk.setPrimaryContent('slides');
});

document.getElementById('setPictureInPicturePositionBL').addEventListener('click', () => {
  sdk.setPictureInPicturePosition('bottom-left');
});

document.getElementById('setPictureInPicturePositionBR').addEventListener('click', () => {
  sdk.setPictureInPicturePosition('bottom-right');
});

document.getElementById('setPictureInPicturePositionTL').addEventListener('click', () => {
  sdk.setPictureInPicturePosition('top-left');
});

document.getElementById('setPictureInPicturePositionTR').addEventListener('click', () => {
  sdk.setPictureInPicturePosition('top-right');
});

document.getElementById('setSideBySideRatio50').addEventListener('click', () => {
  sdk.setSideBySideRatio(50);
});

document.getElementById('setSideBySideRatio80').addEventListener('click', () => {
  sdk.setSideBySideRatio(80);
});

sdk.addEventListener('layoutchange', (newLayout) => {
  console.log('layoutchange', newLayout);
});

sdk.addEventListener('primarycontentchange', (newPrimaryContent) => {
  console.log('primarycontentchange', newPrimaryContent);
});
