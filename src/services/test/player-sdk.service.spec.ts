import { randomUUID } from 'crypto';
import { PlayerSdk, PlayerSdkOptions } from '../player-sdk.service';
import { SdkMessageAction, SdkMessageError } from '../../models/communication.model';

const url = new URL('https://knowledge.qumucloud.com/view/abcd1234');

function createIFrame(name = `iframe${randomUUID()}`, src = url.toString()): HTMLIFrameElement {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const iframe = document.createElement('iframe')!;

  iframe.name = name;
  iframe.src = src;

  return iframe;
}

describe('Service', () => {
  let guid: string;
  let iframe: HTMLIFrameElement;
  let windowSpy: jest.SpyInstance;

  function readySdk(frame = iframe, options?: PlayerSdkOptions) {
    const sdk = new PlayerSdk(frame, options);

    // Simulates a successful ready event from the player
    window.dispatchEvent(new MessageEvent('message', {
      data: JSON.stringify({
        action: SdkMessageAction.Ready,
        value: url.toString(),
        version: 3,
      }),
      origin: url.origin,
    }));

    return sdk;
  }

  function initSdk(frame = iframe): Promise<PlayerSdk> {
    return new Promise((resolve) => {
      const sdk = readySdk(frame);

      sdk.init().then(() => resolve(sdk));

      // Simulates a successful handshake from the player
      window.dispatchEvent(new MessageEvent('message', {
        data: JSON.stringify({
          action: SdkMessageAction.Handshake,
          guid,
          status: 'success',
          version: 3,
        }),
        origin: url.origin,
      }));
    });
  }

  beforeEach(() => {
    windowSpy = jest.spyOn(window, 'window', 'get');

    guid = randomUUID();

    Object.assign(window, {
      crypto: {
        randomUUID: jest.fn().mockReturnValue(guid),
      },
    });

    iframe = createIFrame();

    document.body.appendChild(iframe);
  });

  afterEach(() => {
    windowSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should mark the SDK as ready', () => {
      const sdk = new PlayerSdk(iframe);

      expect((sdk as any).isReady).toBeFalsy();

      // Simulates a successful ready event from the player
      window.dispatchEvent(new MessageEvent('message', {
        data: JSON.stringify({
          action: SdkMessageAction.Ready,
          value: url.toString(),
          version: 3,
        }),
        origin: url.origin,
      }));

      expect((sdk as any).isReady).toBeTruthy();
    });

    it('should save the origin for the next communications', () => {
      const sdk = new PlayerSdk(iframe);

      expect((sdk as any).origin).toEqual('*');

      // Simulates a successful ready event from the player
      window.dispatchEvent(new MessageEvent('message', {
        data: JSON.stringify({
          action: SdkMessageAction.Ready,
          value: url.toString(),
          version: 3,
        }),
        origin: url.origin,
      }));

      expect((sdk as any).origin).toEqual(url.origin);
    });

    it('should ignore ready messages from unknown origins', () => {
      // eslint-disable-next-line no-new
      new PlayerSdk(iframe);

      // Simulates a successful ready event from the player
      window.dispatchEvent(new MessageEvent('message', {
        data: JSON.stringify({
          action: SdkMessageAction.Ready,
          value: url.toString(),
          version: 3,
        }),
        origin: 'https://foo.bar',
      }));

      expect(iframe.dataset.loaded).toBeUndefined();
    });

    it('should ignore ready messages from correct origins but wrong iframes', () => {
      // eslint-disable-next-line no-new
      new PlayerSdk(iframe);

      // Simulates a successful ready event from the player
      window.dispatchEvent(new MessageEvent('message', {
        data: JSON.stringify({
          action: SdkMessageAction.Ready,
          value: 'https://foo.bar/view/abcd',
          version: 3,
        }),
        origin: url.origin,
      }));

      expect(iframe.dataset.loaded).toBeUndefined();
    });
  });

  describe('addEventListener', () => {
    it('should throw an error if no event name is passed', async () => {
      const sdk = await initSdk();

      expect(() => sdk.addEventListener((null as any), () => {})).toThrow('You must pass an event name.');
    });

    it('should throw an error if no callback is passed', async () => {
      const sdk = await initSdk();

      expect(() => sdk.addEventListener('volumechange', (null as any))).toThrow('You must pass a callback function.');
    });

    it('should throw an error if the callback is not a function', async () => {
      const sdk = await initSdk();

      expect(() => sdk.addEventListener('volumechange', ('foo' as any))).toThrow('The callback must be a function.');
    });

    describe('ended', () => {
      it('should listen to events', (done) => {
        initSdk()
          .then((sdk) => {
            sdk.addEventListener('ended', done);

            // Simulates an event sent from the player
            window.dispatchEvent(new MessageEvent('message', {
              data: JSON.stringify({
                action: SdkMessageAction.Event,
                guids: [guid],
                name: 'ended',
                version: 3,
              }),
              origin: url.origin,
            }));
          });
      });
    });

    describe('liveState', () => {
      it('should listen to events', (done) => {
        initSdk()
          .then((sdk) => {
            sdk.addEventListener('liveState', (state: number) => {
              expect(state).toEqual('LIVE');

              done();
            });

            // Simulates an event sent from the player
            window.dispatchEvent(new MessageEvent('message', {
              data: JSON.stringify({
                action: SdkMessageAction.Event,
                guids: [guid],
                name: 'liveState',
                value: 'LIVE',
                version: 3,
              }),
              origin: url.origin,
            }));
          });
      });
    });

    describe('pause', () => {
      it('should listen to events', (done) => {
        initSdk()
          .then((sdk) => {
            sdk.addEventListener('pause', done);

            // Simulates an event sent from the player
            window.dispatchEvent(new MessageEvent('message', {
              data: JSON.stringify({
                action: SdkMessageAction.Event,
                guids: [guid],
                name: 'pause',
                version: 3,
              }),
              origin: url.origin,
            }));
          });
      });
    });

    describe('play', () => {
      it('should listen to events', (done) => {
        initSdk()
          .then((sdk) => {
            sdk.addEventListener('play', done);

            // Simulates an event sent from the player
            window.dispatchEvent(new MessageEvent('message', {
              data: JSON.stringify({
                action: SdkMessageAction.Event,
                guids: [guid],
                name: 'play',
                version: 3,
              }),
              origin: url.origin,
            }));
          });
      });
    });

    describe('timeupdate', () => {
      it('should listen to events', (done) => {
        initSdk()
          .then((sdk) => {
            sdk.addEventListener('timeupdate', (time: number) => {
              expect(time).toEqual(1000);

              done();
            });

            // Simulates an event sent from the player
            window.dispatchEvent(new MessageEvent('message', {
              data: JSON.stringify({
                action: SdkMessageAction.Event,
                guids: [guid],
                name: 'timeupdate',
                value: 1000,
                version: 3,
              }),
              origin: url.origin,
            }));
          });
      });
    });

    describe('volumechange', () => {
      it('should listen to events', (done) => {
        initSdk()
          .then((sdk) => {
            sdk.addEventListener('volumechange', (volume: number) => {
              expect(volume).toEqual(100);

              done();
            });

            // Simulates an event sent from the player
            window.dispatchEvent(new MessageEvent('message', {
              data: JSON.stringify({
                action: SdkMessageAction.Event,
                guids: [guid],
                name: 'volumechange',
                value: 100,
                version: 3,
              }),
              origin: url.origin,
            }));
          });
      });
    });
  });

  describe('destroy', () => {
    it('should remove the message event listener', async () => {
      const spy = jest.spyOn(window, 'removeEventListener');
      const sdk = await initSdk();

      sdk.destroy();

      expect(spy).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should send a destroy message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = await initSdk();

      sdk.destroy();

      expect(spy).toHaveBeenCalledWith(
        // The order of the keys is important because we stringify the object
        JSON.stringify({
          action: SdkMessageAction.Command,
          name: 'destroy',
          // eslint-disable-next-line sort-keys
          guid,
          version: 3,
        }),
        url.origin,
      );
    });
  });

  describe('getClosedCaptions', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = await initSdk();

      sdk.getClosedCaptions();

      expect(spy).toHaveBeenCalledWith(
        // The order of the keys is important because we stringify the object
        JSON.stringify({
          action: SdkMessageAction.Get,
          callbackId: 0,
          name: 'closedCaptions',
          // eslint-disable-next-line sort-keys
          guid,
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', (done) => {
      initSdk()
        .then((sdk) => {
          sdk.getClosedCaptions()
            .then((captionTracks) => {
              expect(captionTracks).toEqual([
                {
                  captions: [],
                  guid: 'caption1',
                  languageCode: 'en',
                  source: 'AUTOGENERATED',
                  title: 'English',
                },
                {
                  captions: [],
                  guid: 'caption2',
                  languageCode: 'fr',
                  source: 'UPLOADED',
                  title: 'French',
                },
              ]);

              done();
            });

          // Simulates an event sent from the player
          window.dispatchEvent(new MessageEvent('message', {
            data: JSON.stringify({
              action: SdkMessageAction.Get,
              guid,
              name: 'closedCaptions',
              value: [
                {
                  captions: [],
                  guid: 'caption1',
                  languageCode: 'en',
                  source: 'AUTOGENERATED',
                  title: 'English',
                },
                {
                  captions: [],
                  guid: 'caption2',
                  languageCode: 'fr',
                  source: 'UPLOADED',
                  title: 'French',
                },
              ],
              version: 3,
            }),
            origin: url.origin,
          }));
        });
    });
  });

  describe('getClosedCaptionsLanguage', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = await initSdk();

      sdk.getClosedCaptionsLanguage();

      expect(spy).toHaveBeenCalledWith(
        // The order of the keys is important because we stringify the object
        JSON.stringify({
          action: SdkMessageAction.Get,
          callbackId: 0,
          name: 'closedCaptionsLanguage',
          // eslint-disable-next-line sort-keys
          guid,
          version: 3,
        }),
        url.origin,
      );
    });

    it('should returns the value from the iframe', (done) => {
      initSdk()
        .then((sdk) => {
          sdk.getClosedCaptionsLanguage()
            .then((language) => {
              expect(language).toEqual('en');

              done();
            });

          // Simulates an event sent from the player
          window.dispatchEvent(new MessageEvent('message', {
            data: JSON.stringify({
              action: SdkMessageAction.Get,
              guid,
              name: 'closedCaptionsLanguage',
              value: 'en',
              version: 3,
            }),
            origin: url.origin,
          }));
        });
    });
  });

  describe('getChapter', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = await initSdk();

      sdk.getChapter();

      expect(spy).toHaveBeenCalledWith(
        // The order of the keys is important because we stringify the object
        JSON.stringify({
          action: SdkMessageAction.Get,
          callbackId: 0,
          name: 'chapter',
          // eslint-disable-next-line sort-keys
          guid,
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', (done) => {
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

      initSdk()
        .then((sdk) => {
          sdk.getChapter()
            .then((c) => {
              expect(c).toEqual(chapter);

              done();
            });

          // Simulates an event sent from the player
          window.dispatchEvent(new MessageEvent('message', {
            data: JSON.stringify({
              action: SdkMessageAction.Get,
              guid,
              name: 'chapter',
              value: chapter,
              version: 3,
            }),
            origin: url.origin,
          }));
        });
    });
  });

  describe('getChapters', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = await initSdk();

      sdk.getChapters();

      expect(spy).toHaveBeenCalledWith(
        // The order of the keys is important because we stringify the object
        JSON.stringify({
          action: SdkMessageAction.Get,
          callbackId: 0,
          name: 'chapters',
          // eslint-disable-next-line sort-keys
          guid,
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', (done) => {
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

      initSdk()
        .then((sdk) => {
          sdk.getChapters()
            .then((c) => {
              expect(c).toEqual(chapters);

              done();
            });

          // Simulates an event sent from the player
          window.dispatchEvent(new MessageEvent('message', {
            data: JSON.stringify({
              action: SdkMessageAction.Get,
              guid,
              name: 'chapters',
              value: chapters,
              version: 3,
            }),
            origin: url.origin,
          }));
        });
    });
  });

  describe('getCurrentTime', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = await initSdk();

      sdk.getCurrentTime();

      expect(spy).toHaveBeenCalledWith(
        // The order of the keys is important because we stringify the object
        JSON.stringify({
          action: SdkMessageAction.Get,
          callbackId: 0,
          name: 'currentTime',
          // eslint-disable-next-line sort-keys
          guid,
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', (done) => {
      initSdk()
        .then((sdk) => {
          sdk.getCurrentTime()
            .then((currentTime) => {
              expect(currentTime).toEqual(1000);

              done();
            });

          // Simulates an event sent from the player
          window.dispatchEvent(new MessageEvent('message', {
            data: JSON.stringify({
              action: SdkMessageAction.Get,
              guid,
              name: 'currentTime',
              value: 1000,
              version: 3,
            }),
            origin: url.origin,
          }));
        });
    });
  });

  describe('getLiveEndTime', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = await initSdk();

      sdk.getLiveEndTime();

      expect(spy).toHaveBeenCalledWith(
        // The order of the keys is important because we stringify the object
        JSON.stringify({
          action: SdkMessageAction.Get,
          callbackId: 0,
          name: 'liveEndTime',
          // eslint-disable-next-line sort-keys
          guid,
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', (done) => {
      initSdk()
        .then((sdk) => {
          sdk.getLiveEndTime()
            .then((time) => {
              expect(time).toEqual('2022-01-01T01:00:00.000Z');

              done();
            });

          // Simulates an event sent from the player
          window.dispatchEvent(new MessageEvent('message', {
            data: JSON.stringify({
              action: SdkMessageAction.Get,
              guid,
              name: 'liveEndTime',
              value: new Date('2022-01-01 01:00'),
              version: 3,
            }),
            origin: url.origin,
          }));
        });
    });
  });

  describe('getLiveStartTime', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = await initSdk();

      sdk.getLiveStartTime();

      expect(spy).toHaveBeenCalledWith(
        // The order of the keys is important because we stringify the object
        JSON.stringify({
          action: SdkMessageAction.Get,
          callbackId: 0,
          name: 'liveStartTime',
          // eslint-disable-next-line sort-keys
          guid,
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', (done) => {
      initSdk()
        .then((sdk) => {
          sdk.getLiveStartTime()
            .then((time) => {
              expect(time).toEqual('2022-01-01T01:00:00.000Z');

              done();
            });

          // Simulates an event sent from the player
          window.dispatchEvent(new MessageEvent('message', {
            data: JSON.stringify({
              action: SdkMessageAction.Get,
              guid,
              name: 'liveStartTime',
              value: new Date('2022-01-01 01:00'),
              version: 3,
            }),
            origin: url.origin,
          }));
        });
    });
  });

  describe('getDuration', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = await initSdk();

      sdk.getDuration();

      expect(spy).toHaveBeenCalledWith(
        // The order of the keys is important because we stringify the object
        JSON.stringify({
          action: SdkMessageAction.Get,
          callbackId: 0,
          name: 'duration',
          // eslint-disable-next-line sort-keys
          guid,
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', (done) => {
      initSdk()
        .then((sdk) => {
          sdk.getDuration()
            .then((duration) => {
              expect(duration).toEqual(1000);

              done();
            });

          // Simulates an event sent from the player
          window.dispatchEvent(new MessageEvent('message', {
            data: JSON.stringify({
              action: SdkMessageAction.Get,
              guid,
              name: 'duration',
              value: 1000,
              version: 3,
            }),
            origin: url.origin,
          }));
        });
    });
  });

  describe('getLayout', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = await initSdk();

      sdk.getLayout();

      expect(spy).toHaveBeenCalledWith(
        // The order of the keys is important because we stringify the object
        JSON.stringify({
          action: SdkMessageAction.Get,
          callbackId: 0,
          name: 'layout',
          // eslint-disable-next-line sort-keys
          guid,
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', (done) => {
      initSdk()
        .then((sdk) => {
          sdk.getLayout()
            .then((layout) => {
              expect(layout).toEqual('pip');

              done();
            });

          // Simulates an event sent from the player
          window.dispatchEvent(new MessageEvent('message', {
            data: JSON.stringify({
              action: SdkMessageAction.Get,
              guid,
              name: 'layout',
              value: 'pip',
              version: 3,
            }),
            origin: url.origin,
          }));
        });
    });
  });

  describe('getPlaybackRate', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = await initSdk();

      sdk.getPlaybackRate();

      expect(spy).toHaveBeenCalledWith(
        // The order of the keys is important because we stringify the object
        JSON.stringify({
          action: SdkMessageAction.Get,
          callbackId: 0,
          name: 'playbackRate',
          // eslint-disable-next-line sort-keys
          guid,
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', (done) => {
      initSdk()
        .then((sdk) => {
          sdk.getPlaybackRate()
            .then((playbackRate) => {
              expect(playbackRate).toEqual(2);

              done();
            });

          // Simulates an event sent from the player
          window.dispatchEvent(new MessageEvent('message', {
            data: JSON.stringify({
              action: SdkMessageAction.Get,
              guid,
              name: 'playbackRate',
              value: 2,
              version: 3,
            }),
            origin: url.origin,
          }));
        });
    });
  });

  describe('getPlaybackRates', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = await initSdk();

      sdk.getPlaybackRates();

      expect(spy).toHaveBeenCalledWith(
        // The order of the keys is important because we stringify the object
        JSON.stringify({
          action: SdkMessageAction.Get,
          callbackId: 0,
          name: 'playbackRates',
          // eslint-disable-next-line sort-keys
          guid,
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', (done) => {
      const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

      initSdk()
        .then((sdk) => {
          sdk.getPlaybackRates()
            .then((rates) => {
              expect(rates).toEqual(playbackRates);

              done();
            });

          // Simulates an event sent from the player
          window.dispatchEvent(new MessageEvent('message', {
            data: JSON.stringify({
              action: SdkMessageAction.Get,
              guid,
              name: 'playbackRates',
              value: playbackRates,
              version: 3,
            }),
            origin: url.origin,
          }));
        });
    });
  });

  describe('getPresentation', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = await initSdk();

      sdk.getPresentation();

      expect(spy).toHaveBeenCalledWith(
        // The order of the keys is important because we stringify the object
        JSON.stringify({
          action: SdkMessageAction.Get,
          callbackId: 0,
          name: 'presentation',
          // eslint-disable-next-line sort-keys
          guid,
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', (done) => {
      const presentation = {
        guid: 'foobar1234',
      };

      initSdk()
        .then((sdk) => {
          sdk.getPresentation()
            .then((pres) => {
              expect(pres).toEqual(presentation);

              done();
            });

          // Simulates an event sent from the player
          window.dispatchEvent(new MessageEvent('message', {
            data: JSON.stringify({
              action: SdkMessageAction.Get,
              guid,
              name: 'presentation',
              value: presentation,
              version: 3,
            }),
            origin: url.origin,
          }));
        });
    });
  });

  describe('getVolume', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = await initSdk();

      sdk.getVolume();

      expect(spy).toHaveBeenCalledWith(
        // The order of the keys is important because we stringify the object
        JSON.stringify({
          action: SdkMessageAction.Get,
          callbackId: 0,
          name: 'volume',
          // eslint-disable-next-line sort-keys
          guid,
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', (done) => {
      initSdk()
        .then((sdk) => {
          sdk.getVolume()
            .then((volume) => {
              expect(volume).toEqual(80);

              done();
            });

          // Simulates an event sent from the player
          window.dispatchEvent(new MessageEvent('message', {
            data: JSON.stringify({
              action: SdkMessageAction.Get,
              guid,
              name: 'volume',
              value: 80,
              version: 3,
            }),
            origin: url.origin,
          }));
        });
    });
  });

  describe('init', () => {
    it('should return an error when the handshake takes too long', (done) => {
      jest.useFakeTimers();

      const sdk = readySdk(iframe, {
        timeout: 2000,
      });

      sdk
        .init()
        .catch((error) => {
          expect(error).toStrictEqual(new Error(SdkMessageError.Timeout));

          done();
        });

      jest.advanceTimersByTime(2001);
    });

    it('should remove the message event listener when the handshake takes too long', (done) => {
      jest.useFakeTimers();

      const spy = jest.spyOn(window, 'removeEventListener');

      const sdk = readySdk(iframe, {
        timeout: 2000,
      });

      sdk.init()
        .catch(() => {
          expect(spy).toHaveBeenCalledWith('message', expect.any(Function));
          done();
        });

      jest.advanceTimersByTime(2001);
    });

    it('should immediately send a handshake message to the iframe that is already loaded', () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      const sdk = readySdk();

      sdk.init();

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: SdkMessageAction.Handshake,
          guid,
          version: 3,
        }),
        url.origin,
      );
    });

    it('should send a handshake message to the iframe once it is loaded', () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      const sdk = new PlayerSdk(iframe);

      // at this point, we start the init while the iframe is not loaded
      sdk.init();

      expect(spy).not.toHaveBeenCalled();

      // simulates the iframe being loaded
      iframe.dispatchEvent(new Event('load'));

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: SdkMessageAction.Handshake,
          guid,
          version: 3,
        }),
        // because we have not received the ready message, we do not know who to send the message too
        // so we broadcast it with `*'
        '*',
      );
    });

    it('should not send another handshake message to the iframe on subsequent load events', () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      const sdk = new PlayerSdk(iframe);

      // at this point, we start the init while the iframe is not loaded
      sdk.init();

      expect(spy).not.toHaveBeenCalled();

      // simulates the iframe being loaded
      iframe.dispatchEvent(new Event('load'));

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: SdkMessageAction.Handshake,
          guid,
          version: 3,
        }),
        '*',
      );

      spy.mockReset();

      // simulates the iframe being loaded a second time
      iframe.dispatchEvent(new Event('load'));

      expect(spy).not.toHaveBeenCalled();
    });

    it('should rejects with an error on failed handshake', (done) => {
      const sdk = readySdk();

      sdk
        .init()
        .catch((error) => {
          expect(error).toStrictEqual(new Error(SdkMessageError.GuidInUse));

          done();
        });

      // Simulates a failed handshake from the player
      window.dispatchEvent(new MessageEvent('message', {
        data: JSON.stringify({
          action: SdkMessageAction.Handshake,
          code: SdkMessageError.GuidInUse,
          guid,
          status: 'error',
          version: 3,
        }),
        origin: url.origin,
      }));
    });

    it('should resolves with no parameters on successful handshake', async () => {
      await expect(initSdk()).resolves.not.toThrow();
    });

    it('should ignore handshakes from unknown origins', (done) => {
      jest.useFakeTimers();

      const sdk = readySdk(iframe, {
        timeout: 2000,
      });

      sdk
        .init()
        .catch((error) => {
          expect(error).toStrictEqual(new Error(SdkMessageError.Timeout));

          done();
        });

      // Simulates a failed handshake from the player
      window.dispatchEvent(new MessageEvent('message', {
        data: JSON.stringify({
          action: SdkMessageAction.Handshake,
          guid,
          status: 'success',
          version: 3,
        }),
        origin: 'https://foo.bar',
      }));

      jest.advanceTimersByTime(2001);
    });

    it('should ignore handshakes from correct origins but wrong iframes', (done) => {
      jest.useFakeTimers();

      const sdk = readySdk(iframe, {
        timeout: 2000,
      });

      sdk
        .init()
        .catch((error) => {
          expect(error).toStrictEqual(new Error(SdkMessageError.Timeout));

          done();
        });

      // Simulates a failed handshake from the player
      window.dispatchEvent(new MessageEvent('message', {
        data: JSON.stringify({
          action: SdkMessageAction.Handshake,
          guid: 'does-not-exist',
          status: 'success',
          version: 3,
        }),
        origin: url.origin,
      }));

      jest.advanceTimersByTime(2001);
    });

    it('should retry the handshake every second and stop retrying after a successful handshake', () => {
      jest.useFakeTimers();

      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      const sdk = readySdk(iframe, {
        timeout: 5000,
      });

      sdk.init();

      jest.advanceTimersByTime(3000);

      // 1 initial attempt + 3 intervals
      expect(spy).toHaveBeenCalledTimes(4);
    });

    it('should stop retrying after a failed handshake', (done) => {
      jest.useFakeTimers();

      const postMessageSpy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const clearIntervalSpy = jest.spyOn(window, 'clearInterval');

      const sdk = readySdk(iframe, {
        timeout: 2000,
      });

      // we reset the mock to not have the ready message
      postMessageSpy.mockReset();

      sdk.init()
        .catch(() => {
          // 1 initial attempt + 3 intervals before the timeout + 1 destroy message
          expect(postMessageSpy).toHaveBeenCalledTimes(4);
          expect(clearIntervalSpy).toHaveBeenCalled();

          done();
        });

      jest.advanceTimersByTime(2001);
    });

    it('should clear the handshake timeout after a successful handshake', (done) => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      const sdk = readySdk();

      sdk.init()
        .then(() => {
          expect(clearIntervalSpy).toHaveBeenCalled();

          done();
        });

      // Simulates a successful handshake from the player
      window.dispatchEvent(new MessageEvent('message', {
        data: JSON.stringify({
          action: SdkMessageAction.Handshake,
          guid,
          status: 'success',
          version: 3,
        }),
        origin: url.origin,
      }));
    });
  });

  describe('isPaused', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const sdk = await initSdk();

      sdk.isPaused();

      expect(spy).toHaveBeenCalledWith(
        // The order of the keys is important because we stringify the object
        JSON.stringify({
          action: SdkMessageAction.Get,
          callbackId: 0,
          name: 'paused',
          // eslint-disable-next-line sort-keys
          guid,
          version: 3,
        }),
        url.origin,
      );
    });

    it('should return the value from the iframe', (done) => {
      initSdk()
        .then((sdk) => {
          sdk.isPaused()
            .then((isPaused) => {
              expect(isPaused).toEqual(true);

              done();
            });

          // Simulates an event sent from the player
          window.dispatchEvent(new MessageEvent('message', {
            data: JSON.stringify({
              action: SdkMessageAction.Get,
              guid,
              name: 'paused',
              value: true,
              version: 3,
            }),
            origin: url.origin,
          }));
        });
    });
  });

  describe('pause', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      const sdk = await initSdk();

      sdk.pause();

      expect(spy).toHaveBeenCalledWith(
        // The order of the keys is important because we stringify the object
        JSON.stringify({
          action: SdkMessageAction.Command,
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

      const sdk = await initSdk();

      sdk.play();

      expect(spy).toHaveBeenCalledWith(
        // The order of the keys is important because we stringify the object
        JSON.stringify({
          action: SdkMessageAction.Command,
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
      initSdk()
        .then((sdk) => {
          const callback = jest.fn();

          sdk.addEventListener('volumechange', callback);
          sdk.removeEventListener('volumechange', callback);

          // Simulates an event sent from the player
          window.dispatchEvent(new MessageEvent('message', {
            data: JSON.stringify({
              action: SdkMessageAction.Event,
              guids: [guid],
              name: 'volumechange',
              value: 100,
              version: 3,
            }),
            origin: url.origin,
          }));


          expect(callback).not.toHaveBeenCalled();
        });
    });

    it('should throw an error if no event name is passed', async () => {
      const sdk = await initSdk();

      expect(() => sdk.removeEventListener((null as any), () => {})).toThrow('You must pass an event name.');
    });
  });

  describe('setClosedCaptionsLanguage', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      const sdk = await initSdk();

      sdk.setClosedCaptionsLanguage('en');

      expect(spy).toHaveBeenCalledWith(
        // The order of the keys is important because we stringify the object
        JSON.stringify({
          action: SdkMessageAction.Set,
          name: 'closedCaptionsLanguage',
          value: 'en',
          // eslint-disable-next-line sort-keys
          guid,
          version: 3,
        }),
        url.origin,
      );
    });

    it('should throw an error if no value is provided', async () => {
      const sdk = await initSdk();

      expect(() => sdk.setClosedCaptionsLanguage((null as any))).toThrow('A value must be set.');
    });
  });

  describe('setCurrentTime', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      const sdk = await initSdk();

      sdk.setCurrentTime(2000);

      expect(spy).toHaveBeenCalledWith(
        // The order of the keys is important because we stringify the object
        JSON.stringify({
          action: SdkMessageAction.Set,
          name: 'currentTime',
          value: 2000,
          // eslint-disable-next-line sort-keys
          guid,
          version: 3,
        }),
        url.origin,
      );
    });

    it('should send an error if the time is below 0', async () => {
      const sdk = await initSdk();

      expect(() => sdk.setCurrentTime(-1)).toThrow('The current time must be superior or equal to 0');
    });

    it('should throw an error if no value is provided', async () => {
      const sdk = await initSdk();

      expect(() => sdk.setCurrentTime((null as any))).toThrow('A value must be set.');
    });
  });

  describe('setPlaybackRate', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      const sdk = await initSdk();

      sdk.setPlaybackRate(2);

      expect(spy).toHaveBeenCalledWith(
        // The order of the keys is important because we stringify the object
        JSON.stringify({
          action: SdkMessageAction.Set,
          name: 'playbackRate',
          value: 2,
          // eslint-disable-next-line sort-keys
          guid,
          version: 3,
        }),
        url.origin,
      );
    });

    it('should send an error if the value is below 0', async () => {
      const sdk = await initSdk();

      expect(() => sdk.setPlaybackRate(-1)).toThrow('The playback rate must be superior or equal to 0');
    });

    it('should send an error if the value is above 2', async () => {
      const sdk = await initSdk();

      expect(() => sdk.setPlaybackRate(3)).toThrow('The playback rate must be inferior or equal to 2');
    });

    it('should throw an error if no value is provided', async () => {
      const sdk = await initSdk();

      expect(() => sdk.setCurrentTime((null as any))).toThrow('A value must be set.');
    });
  });

  describe('setLayout', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      const sdk = await initSdk();

      sdk.setLayout('sbs');

      expect(spy).toHaveBeenCalledWith(
        // The order of the keys is important because we stringify the object
        JSON.stringify({
          action: SdkMessageAction.Set,
          name: 'layout',
          value: 'sbs',
          // eslint-disable-next-line sort-keys
          guid,
          version: 3,
        }),
        url.origin,
      );
    });

    it('should throw an error if no value is provided', async () => {
      const sdk = await initSdk();

      expect(() => sdk.setLayout((null as any))).toThrow('A value must be set.');
    });
  });

  describe('setVolume', () => {
    it('should send the appropriate message to the iframe', async () => {
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      const sdk = await initSdk();

      sdk.setVolume(100);

      expect(spy).toHaveBeenCalledWith(
        // The order of the keys is important because we stringify the object
        JSON.stringify({
          action: SdkMessageAction.Set,
          name: 'volume',
          value: 100,
          // eslint-disable-next-line sort-keys
          guid,
          version: 3,
        }),
        url.origin,
      );
    });

    it('should send an error if the volume is below 0', async () => {
      const sdk = await initSdk();

      expect(() => sdk.setVolume(-1)).toThrow('The volume must be between 0 and 100');
    });

    it('should send an error if the volume is above 100', async () => {
      const sdk = await initSdk();

      expect(() => sdk.setVolume(101)).toThrow('The volume must be between 0 and 100');
    });

    it('should throw an error if no value is provided', async () => {
      const sdk = await initSdk();

      expect(() => sdk.setVolume((null as any))).toThrow('A value must be set.');
    });
  });
});
