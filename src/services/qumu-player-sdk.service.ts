import { generate } from '@qumu/ui-shared-service-guid';

export const enum ClientApiAction {
  Command = 'command',
  Event = 'event',
  Get = 'get',
  Handshake = 'handshake',
  Ready = 'ready',
  Set = 'set',
}

export const enum ClientApiError {
  GuidInUse = 'GUID_IN_USE',
  NoIframe = 'NO_IFRAME',
  Timeout = 'TIME_OUT',
}

export interface ClientApiOptions {
  origin?: string;
  timeout?: number;
}

export interface ClientApiMessage {
  action: ClientApiAction;
  callbackId?: any;
  code?: string;
  guid?: string;
  guids?: string[];
  name?: string;
  status?: string;
  value?: any;
}

export type EventListenerName =
  'play'
  | 'pause'
  | 'ended'
  | 'timeupdate'
  | 'volumechange'
  | 'livestatechange';

export class QumuPlayerSdk {
  private callbackId = 0;
  private callbacks: any = {};
  private readonly guid: string;
  private handshakeInterval: any;
  private iframeWindow: WindowProxy | null = window;
  private isLoaded = false;
  private readonly origin: string;
  private readonly parentIframeName: string | null;
  private readonly timeout: number;
  private timeoutId: any | null = null;

  constructor(
    private readonly iframeName: string,
    options: ClientApiOptions = {},
  ) {
    this.guid = generate();
    this.origin = options.origin || '*';
    this.timeout = options.timeout || 20000;

    const match = new URLSearchParams(window.location.search).get('qcIframeName');

    this.parentIframeName = match || null;

    QumuPlayerSdk.monitorReadyFrames();
  }

  /**
   * A piece of code marking an iframe as loaded on receiving a ready message.
   * This is needed for the API initialization to cater for the case where an iframe is already loaded and we can't use the load event.
   * This is fairly optimistic and will likely not work with redirects, though.
   */
  static monitorReadyFrames(): void {
    window.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message && message.action === ClientApiAction.Ready) {
          const frame = window.document.querySelector(`iframe[src="${message.value}"]`) as HTMLIFrameElement;

          // no frame could mean it was redirected
          if (frame) {
            // set data-loaded to 1 so the client API can identify such an iframe as a ready one and immediately start the handshake
            frame.dataset.loaded = '1';
          }
        }
      } catch (e) {
        throw e;
      }
    });
  }

  /**
   * Listens to a player event
   *
   * @param name the name of the event to listen to
   * @param callback the callback to run when the event is triggered
   */
  addEventListener(name: EventListenerName, callback: Function): void {
    this.callbacks[name] = this.callbacks[name] || [];
    this.callbacks[name].push(callback);
  }

  /**
   * Destroys the whole SDK
   */
  destroy(): void {
    this.callbacks = {};
    this.callbackId = 0;
    window.removeEventListener('message', this.messageHandler);

    this.sendSetMessage('destroy');
  }

  /**
   * Gets the active closed captions' guid
   */
  async getActiveClosedCaptionsGuid(): Promise<string> {
    return this.sendGetMessage('ccGuid');
  }

  /**
   * Gets the available closed captions
   */
  async getClosedCaptions(): Promise<any[]> {
    return this.sendGetMessage('ccTracks');
  }

  /**
   * Gets the current time in milliseconds
   */
  async getCurrentTime(): Promise<number> {
    return this.sendGetMessage('currentTime');
  }

  /**
   * Gets the presentation's duration in milliseconds
   */
  async getDuration(): Promise<number> {
    return this.sendGetMessage('duration');
  }

  /**
   * Gets the presentation
   */
  async getPresentation(): Promise<any> {
    return this.sendGetMessage('presentation');
  }

  /**
   * Gets the player's volume between 0 and 100
   */
  async getVolume(): Promise<number> {
    return this.sendGetMessage('volume');
  }

  /**
   * Initializes the API.
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.iframeName) {
        this.iframeWindow = window.parent;

        this.onLoad();
      } else {
        const frameEl = document.querySelector(`[name="${this.iframeName}"]`) as HTMLIFrameElement;

        if (!frameEl) {
          reject(new Error(ClientApiError.NoIframe));

          return;
        }

        this.iframeWindow = frameEl.contentWindow;

        if (frameEl.dataset.loaded === '1') {
          this.onLoad();
        } else {
          frameEl.addEventListener('load', () => this.onLoad());
        }
      }

      this.messageHandler = (event) => this.onMessage(event, resolve, reject);

      window.addEventListener('message', this.messageHandler);

      this.timeoutId = setTimeout(() => {
        window.removeEventListener('message', this.messageHandler);
        clearInterval(this.handshakeInterval);
        reject(new Error(ClientApiError.Timeout));
      }, this.timeout);
    });
  }

  /**
   * Checks whether the player is paused or playing
   */
  async isPaused(): Promise<boolean> {
    return this.sendGetMessage('paused');
  }

  /**
   * Pauses the player
   */
  async pause(): Promise<void> {
    return new Promise((resolve) => {
      this.sendSetMessage('pause', resolve);
    });
  }

  /**
   * Plays the player
   */
  async play(): Promise<void> {
    return new Promise((resolve) => {
      this.sendSetMessage('play', resolve);
    });
  }

  /**
   * Stops listening to a player event
   */
  removeEventListener(name: string, callback?: Function): void {
    if (!this.callbacks[name]) {
      return;
    }

    this.callbacks[name] = callback
      ? this.callbacks[name].filter((cb: Function) => cb !== callback)
      : [];
  }

  /**
   * Sets the active closed captions' guid
   *
   * @param guid the guid of the new active closed captions
   */
  setActiveClosedCaptionsGuid(guid: string): void {
    this.sendToIframe({
      action: ClientApiAction.Set,
      name: 'ccGuid',
      value: guid,
    });
  }

  /**
   * Sets the current time in the player
   *
   * @param time new current time in milliseconds
   */
  setCurrentTime(time: number): void {
    this.sendToIframe({
      action: ClientApiAction.Set,
      name: 'currentTime',
      value: time,
    });
  }

  /**
   * Sets the volume in the player
   *
   * @param volume new volume. The range is 0-100.
   */
  setVolume(volume: number): void {
    this.sendToIframe({
      action: ClientApiAction.Set,
      name: 'volume',
      value: volume,
    });
  }

  private messageHandler: (event: MessageEvent) => void = () => {};

  private onLoad(): void {
    // don't send the handshake on subsequent loads e.g. caused by disclaimer redirects
    if (this.isLoaded) {
      return;
    }

    this.isLoaded = true;

    const message = {
      action: ClientApiAction.Handshake,
    } as ClientApiMessage;

    // notify the player that we are inside an iframe with the given name
    if (this.parentIframeName) {
      message.name = this.parentIframeName;
    }

    this.sendToIframe(message);
    this.handshakeInterval = setInterval(() => this.sendToIframe(message), 1000);
  }

  private onMessage(event: MessageEvent, successCallback: Function, rejectCallback: Function): void {
    // console.log('message', event, this.isLoaded);

    // ignore message coming from unknown origins when the origin is defined
    if (this.origin !== '*' && event.origin !== this.origin) {
      return;
    }

    let message: ClientApiMessage;

    try {
      message = JSON.parse(event.data);
    } catch (e) {
      message = {} as any;
    }

    // console.log('message', message, this.isLoaded);

    // ignore invalid messages and messages for other users
    if (
      !message.action
      || (message.action === ClientApiAction.Event && message.guids?.indexOf(this.guid) === -1)
      || (message.action === ClientApiAction.Ready && this.isLoaded)
      || ((message.action !== ClientApiAction.Event && message.action !== ClientApiAction.Ready) && message.guid !== this.guid)
    ) {
      return;
    }

    switch (message.action) {
      case ClientApiAction.Command:
        this.callbacks[message.callbackId]();
        delete this.callbacks[message.callbackId];
        break;

      case ClientApiAction.Event: {
        const callbacks = this.callbacks[message.name as string];

        if (callbacks) {
          callbacks.forEach((callback: Function) => callback(message.value));
        }

        break;
      }

      case ClientApiAction.Get:
        this.callbacks[message.callbackId](message.value);
        delete this.callbacks[message.callbackId];
        break;

      case ClientApiAction.Handshake:
        // complete the handshake
        if (message.status === 'error') {
          rejectCallback(new Error(message.code));
        } else {
          successCallback();
        }

        if (this.handshakeInterval) {
          clearInterval(this.handshakeInterval);
        }

        if (this.timeoutId) {
          clearTimeout(this.timeoutId);
        }

        break;

      case ClientApiAction.Ready: {
        const readyFrameEl = document.querySelector(`iframe[src="${message.value}"]`) as HTMLIFrameElement;
        const currentFrameEl = document.querySelector(`[name="${this.iframeName}"]`) as HTMLIFrameElement;

        // receiving a Ready action from the target frame means we still haven't properly completed the handshake
        if (readyFrameEl === currentFrameEl && readyFrameEl?.dataset.loaded === '1') {
          this.onLoad();
        }

        break;
      }
    }
  }

  private sendGetMessage(name: string): Promise<any> {
    return new Promise((resolve) => {
      const callbackId = this.callbackId + 1;

      this.callbacks[callbackId] = resolve;

      this.sendToIframe({
        action: ClientApiAction.Get,
        callbackId,
        name,
      });
    });
  }

  private sendSetMessage(name: string, value?: any, callback?: Function): void {
    const message: ClientApiMessage = {
      action: ClientApiAction.Command,
      name,
    };

    let func = callback;

    if (!callback && typeof value === 'function') {
      func = value;
    }

    if (typeof value !== 'undefined' && typeof value !== 'function') {
      message.value = value;
    }

    if (func) {
      const callbackId = this.callbackId + 1;

      message.callbackId = callbackId;
      this.callbacks[callbackId] = func;
    }

    this.sendToIframe(message);
  }

  private sendToIframe(message: ClientApiMessage): void {
    const postMessage = {
      ...message,
      guid: this.guid,
    };

    this.iframeWindow?.postMessage(JSON.stringify(postMessage), this.origin);
  }
}
