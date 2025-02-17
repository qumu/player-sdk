import { randomUUID } from 'crypto';
import { PlayerSdk } from '../player-sdk.service';
import { SdkEventMessage, SdkGetSetMessage, SdkMessage, SdkReadyMessage } from '../../models/internal';

const url = new URL('https://knowledge.qumucloud.com/view/abcd1234');

function createIFrame(name = `iframe${randomUUID()}`, src = url.toString()): HTMLIFrameElement {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const iframe = document.createElement('iframe')!;

  iframe.name = name;
  iframe.src = src;

  return iframe;
}

async function nextTick(): Promise<void> {
  return new Promise((resolve) => process.nextTick(resolve));
}

function postMessageFromPlayer<T extends SdkMessage>(message: Omit<T, 'version'>) {
  // Simulates a successful handshake event from the player
  window.dispatchEvent(new MessageEvent('message', {
    data: JSON.stringify({
      ...message,
      version: 3,
    }),
    origin: url.origin,
  }));
}

describe('Service', () => {
  let guid: string;
  let iframe: HTMLIFrameElement;

  function initSdk(frame = iframe): PlayerSdk {
    const sdk = new PlayerSdk(frame);

    postMessageFromPlayer<SdkReadyMessage>({
      action: 'ready',
      value: url.toString(),
    });

    return sdk;
  }

  beforeEach(() => {
    guid = randomUUID();

    Object.defineProperty(globalThis, 'crypto', {
      value: {
        randomUUID: () => guid,
      },
    });

    iframe = createIFrame();

    document.body.appendChild(iframe);
  });

  afterEach(() => {
    document.body.removeChild(iframe);
  });

  describe('constructor', () => {
    it('should send handshake message', () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      // eslint-disable-next-line no-new
      new PlayerSdk(iframe);

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'handshake',
          guid,
          version: 3,
        }),
        '*',
      );
    });

    it('should save the origin for the next communications', async () => {
      const sdk = new PlayerSdk(iframe);

      expect((sdk as any).origin).toEqual('*');

      postMessageFromPlayer<SdkReadyMessage>({
        action: 'ready',
        value: url.toString(),
      });

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      expect((sdk as any).origin).toEqual(url.origin);
    });

    it('should show an error message when the URL does not exist in the DOM', async () => {
      const spy = jest.spyOn(console, 'error')
        // we mock it so that it does not show in the logs when running the tests
        .mockImplementation(() => {});

      const sdk = new PlayerSdk(iframe);

      expect((sdk as any).origin).toEqual('*');

      postMessageFromPlayer<SdkReadyMessage>({
        action: 'ready',
        value: 'https://knowledge.qumucloud.com/view/efgh5678',
      });

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      expect(spy).toHaveBeenCalledWith(
        '[Qumu Cloud Player SDK]',
        'A Qumu Cloud player is ready but it is impossible to find the corresponding iFrame, the SDK will not work correctly. Incorrect URL is:',
        'https://knowledge.qumucloud.com/view/efgh5678',
      );
    });
  });

  describe('addEventListener', () => {
    it('should throw an error if no event name is passed', async () => {
      const sdk = initSdk();

      expect(() => sdk.addEventListener((undefined as any), () => {
      })).toThrow('You must pass an event name.');
    });

    it('should throw an error if no callback is passed', async () => {
      const sdk = initSdk();

      expect(() => sdk.addEventListener('volumechange', (undefined as any))).toThrow('You must pass a callback function.');
    });

    it('should throw an error if the callback is not a function', async () => {
      const sdk = initSdk();

      expect(() => sdk.addEventListener('volumechange', ('foo' as any))).toThrow('The callback must be a function.');
    });

    it('should send a message to the player for the first subscribe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      const sdk = initSdk();

      sdk.addEventListener('chapterchange', () => {
      });

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'event',
          guid,
          name: 'chapterchange',
          value: 'add',
          version: 3,
        }),
        url.origin,
      );
    });

    it('should only send a message to the player for the first subscribe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      const sdk = initSdk();

      spy.mockReset();

      sdk.addEventListener('chapterchange', () => {
      });

      sdk.addEventListener('chapterchange', () => {
      });

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'event',
          guid,
          name: 'chapterchange',
          value: 'add',
          version: 3,
        }),
        url.origin,
      );

      expect(spy).toHaveBeenCalledTimes(1);
    });

    describe('captiontrackchange', () => {
      it('should listen to the event', async () => {
        expect.assertions(1);
        const sdk = initSdk();

        sdk.addEventListener('captiontrackchange', (captionTrack: string) => {
          expect(captionTrack).toEqual({
            guid: 'caption1',
            languageCode: 'en',
            source: 'AUTOGENERATED',
            title: 'English',
          });
        });

        // we need to wait for a tick to get the code inside the promise to be executed
        await nextTick();

        postMessageFromPlayer<SdkEventMessage>({
          action: 'event',
          guid,
          name: 'captiontrackchange',
          value: {
            guid: 'caption1',
            languageCode: 'en',
            source: 'AUTOGENERATED',
            title: 'English',
          },
        });
      });
    });

    describe('chapterchange', () => {
      it('should listen to the event', async () => {
        expect.assertions(1);

        const chapter = {
          guid: 'chapter1',
          hidden: false,
          image: {
            guid: 'image1',
            url: 'http://example.com/image1.jpg',
          },
          time: 1000,
          title: 'foo',
        };

        const sdk = initSdk();

        sdk.addEventListener('chapterchange', (c: any) => {
          expect(c).toEqual(chapter);
        });

        // we need to wait for a tick to get the code inside the promise to be executed
        await nextTick();

        postMessageFromPlayer<SdkEventMessage>({
          action: 'event',
          guid,
          name: 'chapterchange',
          value: chapter,
        });
      });
    });

    describe('ended', () => {
      it('should listen to events', async () => {
        expect.assertions(1);

        const sdk = initSdk();

        sdk.addEventListener('ended', () => {
          expect(true).toBeTruthy();
        });

        // we need to wait for a tick to get the code inside the promise to be executed
        await nextTick();

        postMessageFromPlayer<SdkEventMessage>({
          action: 'event',
          guid,
          name: 'ended',
        });
      });
    });

    describe('layoutchange', () => {
      it('should listen to the event', async () => {
        expect.assertions(1);

        const sdk = initSdk();

        sdk.addEventListener('layoutchange', (layout: 'pip' | 'sbs') => {
          expect(layout).toEqual('sbs');
        });

        // we need to wait for a tick to get the code inside the promise to be executed
        await nextTick();

        postMessageFromPlayer<SdkEventMessage>({
          action: 'event',
          guid,
          name: 'layoutchange',
          value: 'sbs',
        });
      });
    });

    describe('livestatechange', () => {
      it('should listen to events', async () => {
        expect.assertions(1);

        const sdk = initSdk();

        sdk.addEventListener('livestatechange', (state: number) => {
          expect(state).toEqual('LIVE');
        });

        // we need to wait for a tick to get the code inside the promise to be executed
        await nextTick();

        postMessageFromPlayer<SdkEventMessage>({
          action: 'event',
          guid,
          name: 'livestatechange',
          value: 'LIVE',
        });
      });
    });

    describe('pause', () => {
      it('should listen to events', async () => {
        expect.assertions(1);

        const sdk = initSdk();

        sdk.addEventListener('pause', () => {
          expect(true).toBeTruthy();
        });

        // we need to wait for a tick to get the code inside the promise to be executed
        await nextTick();

        postMessageFromPlayer<SdkEventMessage>({
          action: 'event',
          guid,
          name: 'pause',
        });
      });
    });

    describe('play', () => {
      it('should listen to events', async () => {
        expect.assertions(1);

        const sdk = initSdk();

        sdk.addEventListener('play', () => {
          expect(true).toBeTruthy();
        });

        // we need to wait for a tick to get the code inside the promise to be executed
        await nextTick();

        postMessageFromPlayer<SdkEventMessage>({
          action: 'event',
          guid,
          name: 'play',
        });
      });
    });

    describe('playbackratechange', () => {
      it('should listen to the event', async () => {
        expect.assertions(1);

        const sdk = initSdk();

        sdk.addEventListener('playbackratechange', (rate: number) => {
          expect(rate).toEqual(1.5);
        });

        postMessageFromPlayer<SdkEventMessage>({
          action: 'event',
          guid,
          name: 'playbackratechange',
          value: 1.5,
        });
      });
    });

    describe('primarycontentchange', () => {
      it('should listen to the event', async () => {
        expect.assertions(1);

        const sdk = initSdk();

        sdk.addEventListener('primarycontentchange', (primarycontent: 'media' | 'slides') => {
          expect(primarycontent).toEqual('slides');
        });

        postMessageFromPlayer<SdkEventMessage>({
          action: 'event',
          guid,
          name: 'primarycontentchange',
          value: 'slides',
        });
      });
    });

    describe('ready', () => {
      it('should execute when sdk is ready', async () => {
        expect.assertions(1);

        const sdk = new PlayerSdk(iframe);

        sdk.addEventListener('ready', () => {
          expect(true).toBeTruthy();
        });

        postMessageFromPlayer<SdkReadyMessage>({
          action: 'ready',
          value: url.toString(),
        });
      });
    });

    describe('timeupdate', () => {
      it('should listen to events', async () => {
        expect.assertions(1);

        const sdk = initSdk();

        sdk.addEventListener('timeupdate', (time: number) => {
          expect(time).toEqual(1000);
        });

        // we need to wait for a tick to get the code inside the promise to be executed
        await nextTick();

        postMessageFromPlayer<SdkEventMessage>({
          action: 'event',
          guid,
          name: 'timeupdate',
          value: 1000,
        });
      });
    });

    describe('volumechange', () => {
      it('should listen to events', async () => {
        expect.assertions(1);

        const sdk = initSdk();

        sdk.addEventListener('volumechange', (volume: number) => {
          expect(volume).toEqual(100);
        });

        // we need to wait for a tick to get the code inside the promise to be executed
        await nextTick();

        postMessageFromPlayer<SdkEventMessage>({
          action: 'event',
          guid,
          name: 'volumechange',
          value: 100,
        });
      });
    });
  });

  describe('destroy', () => {
    it('should remove the message event listener', async () => {
      const spy = jest.spyOn(window, 'removeEventListener');
      const sdk = initSdk();

      sdk.destroy();

      expect(spy).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should send a destroy message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = initSdk();

      sdk.destroy();

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'command',
          guid,
          name: 'destroy',
          version: 3,
        }),
        url.origin,
      );
    });
  });

  describe('disableCaptionTrack', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      const sdk = initSdk();

      await sdk.disableCaptionTrack();

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'set',
          guid,
          name: 'captionTrack',
          value: null,
          version: 3,
        }),
        url.origin,
      );
    });
  });

  describe('enableCaptionTrack', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      const sdk = initSdk();

      await sdk.enableCaptionTrack('en');

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'set',
          guid,
          name: 'captionTrack',
          value: 'en',
          version: 3,
        }),
        url.origin,
      );
    });

    it('should send the appropriate message to the iframe #2', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      const sdk = initSdk();

      await sdk.enableCaptionTrack(null);

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'set',
          guid,
          name: 'captionTrack',
          value: null,
          version: 3,
        }),
        url.origin,
      );
    });
  });

  describe('getCaptionTracks', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = initSdk();

      sdk.getCaptionTracks();

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'get',
          guid,
          name: 'captionTracks',
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', async () => {
      expect.assertions(1);

      const sdk = initSdk();

      sdk.getCaptionTracks()
        .then((captionTracks) => {
          expect(captionTracks).toEqual([
            {
              guid: 'caption1',
              languageCode: 'en',
              source: 'AUTOGENERATED',
              title: 'English',
            },
            {
              guid: 'caption2',
              languageCode: 'fr',
              source: 'UPLOADED',
              title: 'French',
            },
          ]);
        });

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      postMessageFromPlayer<SdkGetSetMessage>({
        action: 'get',
        guid,
        name: 'captionTracks',
        value: [
          {
            guid: 'caption1',
            languageCode: 'en',
            source: 'AUTOGENERATED',
            title: 'English',
          },
          {
            guid: 'caption2',
            languageCode: 'fr',
            source: 'UPLOADED',
            title: 'French',
          },
        ],
      });
    });
  });

  describe('getChapters', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = initSdk();

      sdk.getChapters();

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'get',
          guid,
          name: 'chapters',
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', async () => {
      expect.assertions(1);

      const chapters = [
        {
          guid: 'chapter1',
          hidden: false,
          image: {
            guid: 'image1',
            url: 'http://example.com/image1.jpg',
          },
          time: 1000,
          title: 'foo',
        },
        {
          guid: 'chapter2',
          hidden: false,
          image: {
            guid: 'image2',
            url: 'http://example.com/image2.jpg',
          },
          time: 2000,
          title: 'bar',
        },
      ];

      const sdk = initSdk();

      sdk.getChapters()
        .then((c) => {
          expect(c).toEqual(chapters);
        });

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      postMessageFromPlayer<SdkGetSetMessage>({
        action: 'get',
        guid,
        name: 'chapters',
        value: chapters,
      });
    });
  });

  describe('getCurrentChapter', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = initSdk();

      sdk.getCurrentChapter();

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'get',
          guid,
          name: 'chapter',
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', async () => {
      expect.assertions(1);

      const chapter = {
        guid: 'chapter1',
        hidden: false,
        image: {
          guid: 'image1',
          url: 'http://example.com/image1.jpg',
        },
        time: 1000,
        title: 'foo',
      };

      const sdk = initSdk();

      sdk.getCurrentChapter()
        .then((c) => {
          expect(c).toEqual(chapter);
        });

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      postMessageFromPlayer<SdkGetSetMessage>({
        action: 'get',
        guid,
        name: 'chapter',
        value: chapter,
      });
    });
  });

  describe('getCurrentCaptionTrack', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = initSdk();

      sdk.getCurrentCaptionTrack();

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'get',
          guid,
          name: 'captionTrack',
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', async () => {
      expect.assertions(1);

      const sdk = initSdk();

      sdk.getCurrentCaptionTrack()
        .then((captionTrack) => {
          expect(captionTrack).toEqual({
            guid: 'caption1',
            languageCode: 'en',
            source: 'AUTOGENERATED',
            title: 'English',
          });
        });

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      postMessageFromPlayer<SdkGetSetMessage>({
        action: 'get',
        guid,
        name: 'captionTrack',
        value: {
          guid: 'caption1',
          languageCode: 'en',
          source: 'AUTOGENERATED',
          title: 'English',
        },
      });
    });
  });

  describe('getCurrentTime', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = initSdk();

      sdk.getCurrentTime();

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'get',
          guid,
          name: 'currentTime',
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', async () => {
      expect.assertions(1);

      const sdk = initSdk();

      sdk.getCurrentTime()
        .then((currentTime) => {
          expect(currentTime).toEqual(1000);
        });

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      postMessageFromPlayer<SdkGetSetMessage>({
        action: 'get',
        guid,
        name: 'currentTime',
        value: 1000,
      });
    });
  });

  describe('getDuration', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = initSdk();

      sdk.getDuration();

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'get',
          guid,
          name: 'duration',
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', async () => {
      expect.assertions(1);

      const sdk = initSdk();

      sdk.getDuration()
        .then((duration) => {
          expect(duration).toEqual(1000);
        });

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      postMessageFromPlayer<SdkGetSetMessage>({
        action: 'get',
        guid,
        name: 'duration',
        value: 1000,
      });
    });
  });

  describe('getLiveEndTime', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = initSdk();

      sdk.getLiveEndTime();

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'get',
          guid,
          name: 'liveEndTime',
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', async () => {
      expect.assertions(1);

      const sdk = initSdk();

      sdk.getLiveEndTime()
        .then((time) => {
          expect(time).toEqual('2022-01-01T01:00:00.000Z');
        });

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      postMessageFromPlayer<SdkGetSetMessage>({
        action: 'get',
        guid,
        name: 'liveEndTime',
        value: new Date('2022-01-01 01:00'),
      });
    });
  });

  describe('getLiveStartTime', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = initSdk();

      sdk.getLiveStartTime();

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'get',
          guid,
          name: 'liveStartTime',
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', async () => {
      expect.assertions(1);

      const sdk = initSdk();

      sdk.getLiveStartTime()
        .then((time) => {
          expect(time).toEqual('2022-01-01T01:00:00.000Z');
        });

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      postMessageFromPlayer<SdkGetSetMessage>({
        action: 'get',
        guid,
        name: 'liveStartTime',
        value: new Date('2022-01-01 01:00'),
      });
    });
  });

  describe('getLiveState', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = initSdk();

      sdk.getLiveState();

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'get',
          guid,
          name: 'liveState',
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', async () => {
      expect.assertions(1);

      const sdk = initSdk();

      sdk.getLiveState()
        .then((state) => {
          expect(state).toEqual('LIVE');
        });

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      postMessageFromPlayer<SdkGetSetMessage>({
        action: 'get',
        guid,
        name: 'liveState',
        value: 'LIVE',
      });
    });
  });

  describe('getLayout', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = initSdk();

      sdk.getLayout();

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'get',
          guid,
          name: 'layout',
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', async () => {
      expect.assertions(1);

      const sdk = initSdk();

      sdk.getLayout()
        .then((layout) => {
          expect(layout).toEqual('pip');
        });

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      postMessageFromPlayer<SdkGetSetMessage>({
        action: 'get',
        guid,
        name: 'layout',
        value: 'pip',
      });
    });
  });

  describe('getLevel', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = initSdk();

      sdk.getLevel();

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'get',
          guid,
          name: 'level',
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', async () => {
      expect.assertions(1);

      const sdk = initSdk();

      sdk.getLevel()
        .then((level) => {
          expect(level).toEqual(1);
        });

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      postMessageFromPlayer<SdkGetSetMessage>({
        action: 'get',
        guid,
        name: 'level',
        value: 1,
      });
    });
  });

  describe('getLevels', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = initSdk();

      sdk.getLevels();

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'get',
          guid,
          name: 'levels',
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', async () => {
      expect.assertions(1);

      const sdk = initSdk();

      sdk.getLevels()
        .then((levels) => {
          expect(levels).toEqual([
            {
              key: '240p',
              value: 1,
            },
            {
              key: '480p',
              value: 2,
            },
            {
              key: '720p',
              value: 3,
            },
          ]);
        });

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      postMessageFromPlayer<SdkGetSetMessage>({
        action: 'get',
        guid,
        name: 'levels',
        value: [
          {
            key: '240p',
            value: 1,
          },
          {
            key: '480p',
            value: 2,
          },
          {
            key: '720p',
            value: 3,
          },
        ],
      });
    });
  });

  describe('getPictureInPicturePosition', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = initSdk();

      sdk.getPictureInPicturePosition();

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'get',
          guid,
          name: 'pipPosition',
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', async () => {
      expect.assertions(1);

      const sdk = initSdk();

      sdk.getPictureInPicturePosition()
        .then((value) => {
          expect(value).toEqual('top-left');
        });

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      postMessageFromPlayer<SdkGetSetMessage>({
        action: 'get',
        guid,
        name: 'pipPosition',
        value: 'top-left',
      });
    });
  });

  describe('getPlaybackLevel', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = initSdk();

      sdk.getPlaybackLevel();

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'get',
          guid,
          name: 'playbackLevel',
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', async () => {
      expect.assertions(1);

      const sdk = initSdk();

      sdk.getPlaybackLevel()
        .then((level) => {
          expect(level).toEqual(1);
        });

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      postMessageFromPlayer<SdkGetSetMessage>({
        action: 'get',
        guid,
        name: 'playbackLevel',
        value: 1,
      });
    });
  });

  describe('getPlaybackRate', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = initSdk();

      sdk.getPlaybackRate();

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'get',
          guid,
          name: 'playbackRate',
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', async () => {
      expect.assertions(1);

      const sdk = initSdk();

      sdk.getPlaybackRate()
        .then((playbackRate) => {
          expect(playbackRate).toEqual(2);
        });

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      postMessageFromPlayer<SdkGetSetMessage>({
        action: 'get',
        guid,
        name: 'playbackRate',
        value: 2,
      });
    });
  });

  describe('getPlaybackRates', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = initSdk();

      sdk.getPlaybackRates();

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'get',
          guid,
          name: 'playbackRates',
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', async () => {
      expect.assertions(1);

      const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

      const sdk = initSdk();

      sdk.getPlaybackRates()
        .then((rates) => {
          expect(rates).toEqual(playbackRates);
        });

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      postMessageFromPlayer<SdkGetSetMessage>({
        action: 'get',
        guid,
        name: 'playbackRates',
        value: playbackRates,
      });
    });
  });

  describe('getPresentation', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = initSdk();

      sdk.getPresentation();

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'get',
          guid,
          name: 'presentation',
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', async () => {
      expect.assertions(1);

      const presentation = {
        guid: 'foobar1234',
      };

      const sdk = initSdk();

      sdk.getPresentation()
        .then((pres) => {
          expect(pres).toEqual(presentation);
        });

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      postMessageFromPlayer<SdkGetSetMessage>({
        action: 'get',
        guid,
        name: 'presentation',
        value: presentation,
      });
    });
  });

  describe('getPrimaryContent', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = initSdk();

      sdk.getPrimaryContent();

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'get',
          guid,
          name: 'primaryContent',
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', async () => {
      expect.assertions(1);

      const sdk = initSdk();

      sdk.getPrimaryContent()
        .then((primaryContent) => {
          expect(primaryContent).toEqual('slides');
        });

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      postMessageFromPlayer<SdkGetSetMessage>({
        action: 'get',
        guid,
        name: 'primaryContent',
        value: 'slides',
      });
    });
  });

  describe('getSideBySideRatio', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = initSdk();

      sdk.getSideBySideRatio();

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'get',
          guid,
          name: 'sideBySideRatio',
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', async () => {
      expect.assertions(1);

      const sdk = initSdk();

      sdk.getSideBySideRatio()
        .then((value) => {
          expect(value).toEqual(60);
        });

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      postMessageFromPlayer<SdkGetSetMessage>({
        action: 'get',
        guid,
        name: 'sideBySideRatio',
        value: 60,
      });
    });
  });

  describe('getVolume', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = initSdk();

      sdk.getVolume();

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'get',
          guid,
          name: 'volume',
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', async () => {
      expect.assertions(1);

      const sdk = initSdk();

      sdk.getVolume()
        .then((volume) => {
          expect(volume).toEqual(80);
        });

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      postMessageFromPlayer<SdkGetSetMessage>({
        action: 'get',
        guid,
        name: 'volume',
        value: 80,
      });
    });
  });

  describe('isPaused', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      const sdk = initSdk();

      sdk.isPaused();

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'get',
          guid,
          name: 'paused',
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', async () => {
      expect.assertions(1);

      const sdk = initSdk();

      sdk.isPaused()
        .then((isPaused) => {
          expect(isPaused).toEqual(false);
        });

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      postMessageFromPlayer<SdkGetSetMessage>({
        action: 'get',
        guid,
        name: 'paused',
        value: false,
      });
    });
  });

  describe('pause', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      const sdk = initSdk();

      sdk.pause();

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'command',
          guid,
          name: 'pause',
          version: 3,
        }),
        url.origin,
      );
    });
  });

  describe('play', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      const sdk = initSdk();

      sdk.play();

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'command',
          guid,
          name: 'play',
          version: 3,
        }),
        url.origin,
      );
    });
  });

  describe('removeEventListener', () => {
    it('should remove the event ', () => {
      const sdk = initSdk();
      const callback = jest.fn();

      sdk.addEventListener('volumechange', callback);
      sdk.removeEventListener('volumechange', callback);

      postMessageFromPlayer<SdkEventMessage>({
        action: 'event',
        guid,
        name: 'volumechange',
        value: 100,
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it('should send a message to the player ', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      const sdk = initSdk();
      const callback = jest.fn();

      sdk.addEventListener('volumechange', callback);
      sdk.removeEventListener('volumechange', callback);

      // we need to wait for a tick to get the code inside the promise to be executed
      await nextTick();

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'event',
          guid,
          name: 'volumechange',
          value: 'remove',
          version: 3,
        }),
        url.origin,
      );
    });

    it('should throw an error if no event name is passed', async () => {
      const sdk = initSdk();

      expect(() => sdk.removeEventListener((undefined as any), () => {
      })).toThrow('You must pass an event name.');
    });
  });

  describe('setCurrentTime', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      const sdk = initSdk();

      await sdk.setCurrentTime(2000);

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'set',
          guid,
          name: 'currentTime',
          value: 2000,
          version: 3,
        }),
        url.origin,
      );
    });

    it('should send an error if the time is below 0', async () => {
      const sdk = initSdk();

      expect(() => sdk.setCurrentTime(-1)).toThrow('The current time must be superior or equal to 0');
    });

    it('should throw an error if no value is provided', async () => {
      const sdk = initSdk();

      expect(() => sdk.setCurrentTime((undefined as any))).toThrow('A value must be set.');
    });
  });

  describe('setLayout', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      const sdk = initSdk();

      await sdk.setLayout('sbs');

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'set',
          guid,
          name: 'layout',
          value: 'sbs',
          version: 3,
        }),
        url.origin,
      );
    });

    it('should throw an error if no value is provided', async () => {
      const sdk = initSdk();

      expect(() => sdk.setLayout((undefined as any))).toThrow('A value must be set.');
    });
  });

  describe('setLevel', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      const sdk = initSdk();

      await sdk.setLevel(2);

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'set',
          guid,
          name: 'level',
          value: 2,
          version: 3,
        }),
        url.origin,
      );
    });

    it('should send an error if the value is below -1', async () => {
      const sdk = initSdk();

      expect(() => sdk.setLevel(-2)).toThrow('The level must set to -1 for automatic switching or be superior to 0');
    });

    it('should send an error if the value is 0', async () => {
      const sdk = initSdk();

      expect(() => sdk.setLevel(0)).toThrow('The level must set to -1 for automatic switching or be superior to 0');
    });

    it('should throw an error if no value is provided', async () => {
      const sdk = initSdk();

      expect(() => sdk.setLevel((undefined as any))).toThrow('A value must be set.');
    });
  });

  describe('setPictureInPicturePosition', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      const sdk = initSdk();

      await sdk.setPictureInPicturePosition('top-right');

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'set',
          guid,
          name: 'pipPosition',
          value: 'top-right',
          version: 3,
        }),
        url.origin,
      );
    });

    it('should throw an error if no value is provided', async () => {
      const sdk = initSdk();

      expect(() => sdk.setPictureInPicturePosition((undefined as any))).toThrow('A value must be set.');
    });
  });

  describe('setPlaybackRate', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      const sdk = initSdk();

      await sdk.setPlaybackRate(2);

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'set',
          guid,
          name: 'playbackRate',
          value: 2,
          version: 3,
        }),
        url.origin,
      );
    });

    it('should send an error if the value is below 0', async () => {
      const sdk = initSdk();

      expect(() => sdk.setPlaybackRate(-1)).toThrow('The playback rate must be superior or equal to 0');
    });

    it('should send an error if the value is above 2', async () => {
      const sdk = initSdk();

      expect(() => sdk.setPlaybackRate(3)).toThrow('The playback rate must be inferior or equal to 2');
    });

    it('should throw an error if no value is provided', async () => {
      const sdk = initSdk();

      expect(() => sdk.setCurrentTime((undefined as any))).toThrow('A value must be set.');
    });
  });

  describe('setPrimaryContent', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      const sdk = initSdk();

      await sdk.setPrimaryContent('slides');

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'set',
          guid,
          name: 'primaryContent',
          value: 'slides',
          version: 3,
        }),
        url.origin,
      );
    });

    it('should throw an error if no value is provided', async () => {
      const sdk = initSdk();

      expect(() => sdk.setPrimaryContent((undefined as any))).toThrow('A value must be set.');
    });
  });

  describe('setSideBySideRatio', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      const sdk = initSdk();

      await sdk.setSideBySideRatio(50);

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'set',
          guid,
          name: 'sideBySideRatio',
          value: 50,
          version: 3,
        }),
        url.origin,
      );
    });

    it('should send an error if the ratio is below 50', async () => {
      const sdk = initSdk();

      expect(() => sdk.setSideBySideRatio(40)).toThrow('The ratio must be between 50 and 80');
    });

    it('should send an error if the ratio is above 80', async () => {
      const sdk = initSdk();

      expect(() => sdk.setSideBySideRatio(90)).toThrow('The ratio must be between 50 and 80');
    });
  });

  describe('setVolume', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      const sdk = initSdk();

      await sdk.setVolume(100);

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'set',
          guid,
          name: 'volume',
          value: 100,
          version: 3,
        }),
        url.origin,
      );
    });

    it('should send an error if the volume is below 0', async () => {
      const sdk = initSdk();

      expect(() => sdk.setVolume(-1)).toThrow('The volume must be between 0 and 100');
    });

    it('should send an error if the volume is above 100', async () => {
      const sdk = initSdk();

      expect(() => sdk.setVolume(101)).toThrow('The volume must be between 0 and 100');
    });

    it('should throw an error if no value is provided', async () => {
      const sdk = initSdk();

      expect(() => sdk.setVolume((undefined as any))).toThrow('A value must be set.');
    });
  });
});
