import { PlayerSdk } from '@enghouse-qumu/player-sdk';

const iframe = document.querySelector('iframe');
const sdk = new PlayerSdk(iframe);

document.getElementById('getChapters').addEventListener('click', () => {
  sdk.getChapters().then((chapters) => {
    console.log('chapters', chapters);
  });
});

document.getElementById('getCurrentChapter').addEventListener('click', () => {
  sdk.getCurrentChapter().then((chapter) => {
    console.log('current chapter', chapter);
  });
});

sdk.addEventListener('chapterchange', (newChapter) => {
  console.log('chapterchange', newChapter);
});
