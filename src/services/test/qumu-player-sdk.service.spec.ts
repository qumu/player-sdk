import { randomUUID } from 'crypto';
import { generate } from '@qumu/ui-shared-service-guid';
import { ClientApiError, QumuPlayerSdk, ClientApiAction } from '../qumu-player-sdk.service';

jest.mock('@qumu/ui-shared-service-guid', () => ({
  generate: jest.fn(),
}));

jest.useFakeTimers();

function createIFrame(name = `iframe${randomUUID()}`): HTMLIFrameElement {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const iframe = document.createElement('iframe')!;

  iframe.name = name;

  return iframe;
}

describe('Service', () => {
  let windowSpy: jest.SpyInstance;
  let guid: string;


  beforeEach(() => {
    windowSpy = jest.spyOn(window, 'window', 'get');

    guid = randomUUID();

    (generate as jest.Mock).mockReturnValue(guid);
  });

  afterEach(() => {
    windowSpy.mockRestore();
  });

  describe('init', () => {
    it('should return an error when it is unable to find an iframe with the given name', async () => {
      const sdk = new QumuPlayerSdk('not-present');

      await expect(sdk.init()).rejects.toThrow(ClientApiError.NoIframe);
    });

    it('should talk to the parent window when the supplied iframe name is null', () => {
      const spy = jest.spyOn(window.parent, 'postMessage');

      new QumuPlayerSdk('')
        .init();

      expect(spy).toHaveBeenCalled();
    });

    it('should include the parent iframe name in the handshake when the supplied iframe name is null', () => {
      const name = 'foobar';

      const windowMock = {
        addEventListener: jest.fn(),
        location: {
          search: `?qcIframeName=${name}`,
        },
        parent: {
          postMessage: jest.fn(),
        },
        removeEventListener: jest.fn(),
      };

      windowSpy.mockImplementation(() => windowMock);

      new QumuPlayerSdk('')
        .init();

      const message = JSON.parse((windowMock.parent.postMessage as jest.Mock).mock.calls[0][0]);

      expect(message.name).toBe(name);
    });

    it('should return an error when the handshake takes too long', (done) => {
      const iframe = createIFrame();

      document.body.appendChild(iframe);

      new QumuPlayerSdk(iframe.name, {
        timeout: 2000,
      })
        .init()
        .catch((error) => {
          expect(error).toStrictEqual(new Error(ClientApiError.Timeout));

          done();
        });

      jest.advanceTimersByTime(2000);
    });

    it('should remove the message event listener when the handshake takes too long', (done) => {
      const iframe = createIFrame();

      document.body.appendChild(iframe);

      const spy = jest.spyOn(window, 'removeEventListener');

      new QumuPlayerSdk(iframe.name, {
        timeout: 2000,
      })
        .init()
        .catch(() => {
          expect(spy).toHaveBeenCalledWith('message', expect.any(Function));
          done();
        });

      jest.advanceTimersByTime(2000);
    });

    it('should immediately send a handshake message to the iframe that is already loaded', () => {
      const iframe = createIFrame();

      iframe.dataset.loaded = '1';

      document.body.appendChild(iframe);

      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      new QumuPlayerSdk(iframe.name)
        .init();

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'handshake',
          guid,
        }),
        '*',
      );
    });

    it('should send a handshake message to the iframe once it is loaded', () => {
      const iframe = createIFrame();

      iframe.dataset.loaded = '0';

      document.body.appendChild(iframe);

      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      new QumuPlayerSdk(iframe.name)
        .init();

      expect(spy).not.toHaveBeenCalled();

      // simulates the iframe being loaded
      iframe.dispatchEvent(new Event('load'));

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'handshake',
          guid,
        }),
        '*',
      );
    });

    it('should not send another handshake message to the iframe on subsequent load events', () => {
      const iframe = createIFrame();

      iframe.dataset.loaded = '0';

      document.body.appendChild(iframe);

      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      new QumuPlayerSdk(iframe.name)
        .init();

      expect(spy).not.toHaveBeenCalled();

      // simulates the iframe being loaded
      iframe.dispatchEvent(new Event('load'));

      expect(spy).toHaveBeenCalledWith(
        JSON.stringify({
          action: 'handshake',
          guid,
        }),
        '*',
      );

      spy.mockReset();

      // simulates the iframe being loaded a second time
      iframe.dispatchEvent(new Event('load'));

      expect(spy).not.toHaveBeenCalled();
    });

    it('should rejects with an error on failed handshake', (done) => {
      const iframe = createIFrame();

      iframe.dataset.loaded = '1';

      document.body.appendChild(iframe);

      new QumuPlayerSdk(iframe.name)
        .init()
        .catch((error) => {
          expect(error).toStrictEqual(new Error(ClientApiError.GuidInUse));

          done();
        });

      // Simulates a failed handshake from the player
      window.postMessage(JSON.stringify({
        action: ClientApiAction.Handshake,
        code: ClientApiError.GuidInUse,
        guid,
        status: 'error',
      }), '*');
    });

    it('should resolves with no parameters on successful handshake', (done) => {
      const iframe = createIFrame();

      iframe.dataset.loaded = '1';

      document.body.appendChild(iframe);

      new QumuPlayerSdk(iframe.name)
        .init()
        .then(() => {
          // Stupid test, we just need to check that we go in the `.then`. Jest would throw a timeout issue if that is not the case
          expect(true).toBeTruthy();
          done();
        });

      // Simulates a successful handshake from the player
      window.postMessage(JSON.stringify({
        action: ClientApiAction.Handshake,
        guid,
        status: 'success',
      }), '*');
    });

    it('should retry the handshake every second and stop retrying after a successful handshake', () => {
      const iframe = createIFrame();

      iframe.dataset.loaded = '1';

      document.body.appendChild(iframe);

      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      new QumuPlayerSdk(iframe.name, {
        timeout: 5000,
      })
        .init();

      jest.advanceTimersByTime(3000);

      // 1 initial attempt + 3 intervals
      expect(spy).toHaveBeenCalledTimes(4);
    });

    it('should stop retrying after a failed handshake', (done) => {
      const iframe = createIFrame();

      iframe.dataset.loaded = '1';

      document.body.appendChild(iframe);

      const postMessageSpy = jest.spyOn(iframe.contentWindow as any, 'postMessage');
      const clearIntervalSpy = jest.spyOn(window, 'clearInterval');

      new QumuPlayerSdk(iframe.name, {
        timeout: 2000,
      })
        .init()
        .catch((error) => {
          // TODO figure out why this one breaks the next ones.
          console.log(error);

          // 1 initial attempt + 2 intervals before the timeout
          expect(postMessageSpy).toHaveBeenCalledTimes(3);
          expect(clearIntervalSpy).toHaveBeenCalled();

          done();
        });

      jest.advanceTimersByTime(3000);
    });

    it('should clear the handshake timeout after a successful handshake', (done) => {
      const iframe = createIFrame();

      iframe.dataset.loaded = '1';

      document.body.appendChild(iframe);

      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      new QumuPlayerSdk(iframe.name)
        .init()
        .then(() => {
          expect(clearIntervalSpy).toHaveBeenCalled();

          done();
        });

      // Simulates a successful handshake from the player
      window.postMessage(JSON.stringify({
        action: ClientApiAction.Handshake,
        guid,
        status: 'success',
      }), '*');
    });

    it('should perform a handshake when receiving a ready message from allegedly unloaded target frame', () => {
      const src = 'http://foo.bar.baz/qux.html';
      const iframe = createIFrame();

      iframe.dataset.loaded = '0';
      iframe.src = src;

      document.body.appendChild(iframe);
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      new QumuPlayerSdk(iframe.name)
        .init();

      // Simulates a successful ready event from the player
      window.postMessage(JSON.stringify({
        action: ClientApiAction.Ready,
        origin: 'http://foo.bar.baz',
        value: src,
      }), '*');

      // we just need to wait for a tick
      setTimeout(() => {
        expect(spy).toHaveBeenCalledWith(
          JSON.stringify({
            action: 'handshake',
            guid,
          }),
          '*',
        );
      });
    });

    it('should ignore ready messages from unknown unloaded frames', () => {
      const src = 'http://foo.bar.baz/qux.html';
      const iframe = createIFrame();

      iframe.dataset.loaded = '0';
      // we purposely set another src here
      iframe.src = 'https://www.example.com';

      document.body.appendChild(iframe);
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      new QumuPlayerSdk(iframe.name)
        .init();

      // Simulates a successful ready event from the player
      window.postMessage(JSON.stringify({
        action: ClientApiAction.Ready,
        origin: 'http://foo.bar.baz',
        value: src,
      }), '*');

      // we just need to wait for a tick
      setTimeout(() => {
        expect(spy).not.toHaveBeenCalledWith(
          JSON.stringify({
            action: 'handshake',
            guid,
          }),
          '*',
        );
      });
    });

    it('should ignore ready messages from unknown unloaded frames', () => {
      const src = 'http://foo.bar.baz/qux.html';
      const iframe = createIFrame();

      // we purposely mark the iframe as already loaded
      iframe.dataset.loaded = '1';
      iframe.src = src;

      document.body.appendChild(iframe);
      const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

      new QumuPlayerSdk(iframe.name)
        .init();

      // Simulates a successful ready event from the player
      window.postMessage(JSON.stringify({
        action: ClientApiAction.Ready,
        origin: 'http://foo.bar.baz',
        value: src,
      }), '*');

      // we just need to wait for a tick
      setTimeout(() => {
        expect(spy).not.toHaveBeenCalledWith(
          JSON.stringify({
            action: 'handshake',
            guid,
          }),
          '*',
        );
      });
    });

    it('should ignore ready messages from unknown unloaded frames', (done) => {
      const src = 'http://foo.bar.baz/qux.html';
      const iframe = createIFrame();

      // we purposely mark the iframe as already loaded
      iframe.dataset.loaded = '1';
      iframe.src = src;

      document.body.appendChild(iframe);

      new QumuPlayerSdk(iframe.name)
        .init()
        .then(() => {
          const spy = jest.spyOn(iframe.contentWindow as any, 'postMessage');

          // Simulates a successful ready event from the player
          window.postMessage(JSON.stringify({
            action: ClientApiAction.Ready,
            origin: 'http://foo.bar.baz',
            value: src,
          }), '*');

          // we just need to wait for a tick
          setTimeout(() => {
            expect(spy).not.toHaveBeenCalledWith(
              JSON.stringify({
                action: 'handshake',
                guid,
              }),
              '*',
            );
          });

          done();
        });
      // Simulates a successful handshake from the player
      window.postMessage(JSON.stringify({
        action: ClientApiAction.Handshake,
        guid,
        status: 'success',
      }), '*');
    });
  });
});
