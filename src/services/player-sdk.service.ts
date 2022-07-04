import { parseMessageData } from '../lib/functions/functions';
import {
  SdkEventListener,
  SdkMessageAction,
  SdkHandshakeMessage,
  SdkLayout,
  SdkMessageError,
  SdkMessage,
  SdkReadyMessage,
} from '../models/communication.model';
import { CallbackStore, FunctionOrPromise } from '../lib/callbacks/callbacks';

export interface PlayerSdkOptions {
  timeout: number;
}

export class PlayerSdk {
  // store used for the callbacks
  private readonly callbackStore: CallbackStore;

  // callback for the handshake process
  private handshakeHandler: ((event: MessageEvent) => void) | undefined;

  // interval id for the handshake process
  // the interval is used to send the handshake message every second until we either have a response from the iframe
  // or the handshake times out
  private handshakeInterval: NodeJS.Timer | undefined;

  // timeout for the handshake process
  // this is used to time out the handshake process after the timeout passed in the options
  private handshakeTimeout: NodeJS.Timeout | undefined;

  // Random guid used during Cross window communication
  // This is useful to prevent communication bleeding between SDKs if the same presentation is used multiple times in the page
  private readonly guid: string;

  // Boolean to check if the SDK is loaded
  private isLoaded = false;

  // Boolean to check if the SDK is ready
  private isReady = false;

  // callback for the message event listener once the handshake is done
  private messageHandler: ((event: MessageEvent) => void) | undefined;

  // origin url of the iframe's src
  // we will use it to compare with the event's origin and filter out messages from unknown origins
  private readonly originUrl: string;

  // SDK options
  private readonly options: PlayerSdkOptions;

  // origin used to send cross window communication messages
  // this is useful to target a specific origin and not have to broadcast to everybody
  private origin = '*';

  // callback for the ready process
  private readyHandler: ((event: MessageEvent) => void) | undefined;

  // Cross window communication format version
  private readonly version = 3;

  constructor(
    private readonly iframe: HTMLIFrameElement,
    options?: Partial<PlayerSdkOptions>,
  ) {
    this.options = {
      timeout: 20000,
      ...options,
    };
    this.guid = crypto.randomUUID();
    this.originUrl = new URL(this.iframe.src).origin;

    this.callbackStore = new CallbackStore();

    this.ready();
  }

  /**
   * Registers a callback to be run when the event is triggered
   *
   * @param name the event name to listen to
   * @param callback the callback to run when the event is triggered
   */
  addEventListener(name: SdkEventListener, callback: Function): void {
    if (!name) {
      throw new TypeError('You must pass an event name.');
    }

    if (!callback) {
      throw new TypeError('You must pass a callback function.');
    }

    if (typeof callback !== 'function') {
      throw new TypeError('The callback must be a function.');
    }

    this.callbackStore.storeCallback(`${SdkMessageAction.Event}:${name}`, callback);
  }

  /**
   * Destroys the whole SDK
   */
  destroy(): void {
    if (this.handshakeInterval) {
      clearInterval(this.handshakeInterval);
    }

    if (this.handshakeHandler) {
      window.removeEventListener('message', this.handshakeHandler);
    }

    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
    }

    if (this.readyHandler) {
      window.removeEventListener('message', this.readyHandler);
    }

    this.postMessage({
      action: SdkMessageAction.Command,
      name: 'destroy',
    });
  }

  /**
   * Gets the available closed captions
   */
  async getClosedCaptions(): Promise<any[]> {
    return this.get('closedCaptions');
  }

  /**
   * Gets the active closed captions' language
   */
  async getClosedCaptionsLanguage(): Promise<string> {
    return this.get('closedCaptionsLanguage');
  }

  /**
   * Gets the chapter
   */
  async getChapter(): Promise<any> {
    return this.get('chapter');
  }

  /**
   * Gets the list of chapters for the presentation
   */
  async getChapters(): Promise<any[]> {
    return this.get('chapters');
  }

  /**
   * Gets the current time in milliseconds
   */
  async getCurrentTime(): Promise<number> {
    return this.get('currentTime');
  }

  /**
   * Gets the presentation's duration in milliseconds
   */
  async getDuration(): Promise<number> {
    return this.get('duration');
  }

  /**
   * Gets the layout
   */
  async getLayout(): Promise<SdkLayout> {
    return this.get('layout');
  }

  /**
   * Gets the presentation's duration in milliseconds
   */
  async getLiveEndTime(): Promise<string | null> {
    return this.get('liveEndTime');
  }

  /**
   * Gets the presentation's duration in milliseconds
   */
  async getLiveStartTime(): Promise<string | null> {
    return this.get('liveStartTime');
  }

  /**
   * Gets the current playback rate
   */
  async getPlaybackRate(): Promise<number> {
    return this.get('playbackRate');
  }

  /**
   * Gets the list of playback rates
   */
  async getPlaybackRates(): Promise<number[]> {
    return this.get('playbackRates');
  }

  /**
   * Gets the presentation
   */
  async getPresentation(): Promise<any> {
    return this.get('presentation');
  }

  /**
   * Gets the player's volume between 0 and 100
   */
  async getVolume(): Promise<number> {
    return this.get('volume');
  }

  /**
   * Initializes the SDK
   */
  async init(): Promise<void> {
    return this.initSdk()
      .then(() => {
        this.messageHandler = (event) => {
          // ignore messages coming from another iframe
          if (event.origin !== this.originUrl) {
            return;
          }

          this.processData(event.data);
        };

        window.addEventListener('message', this.messageHandler);
      });
  }

  /**
   * Checks whether the player is paused or playing
   */
  async isPaused(): Promise<boolean> {
    return this.get('paused');
  }

  /**
   * Pauses the player
   */
  async pause(): Promise<void> {
    return this.command('pause');
  }

  /**
   * Plays the player
   */
  async play(): Promise<void> {
    return this.command('play');
  }

  /**
   * Stops listening to a player event
   *
   * @param name the event name to listen to
   * @param callback the callback to remove. If no callback is provided, all callbacks will be removed for the event name
   */
  removeEventListener(name: string, callback?: Function): void {
    if (!name) {
      throw new TypeError('You must pass an event name.');
    }

    this.callbackStore.removeCallback(`${SdkMessageAction.Event}:${name}`, callback);
  }

  /**
   * Sets the active closed captions' language
   *
   * @param guid the guid of the new active closed captions
   */
  setClosedCaptionsLanguage(guid: string): Promise<void> {
    return this.set('closedCaptionsLanguage', guid);
  }

  /**
   * Sets the current time in the player
   *
   * @param time the new current time in milliseconds
   */
  setCurrentTime(time: number): Promise<void> {
    if (time < 0) {
      throw new Error('The current time must be superior or equal to 0');
    }

    return this.set('currentTime', time);
  }

  /**
   * Sets the layout
   *
   * @param layout the new layout, either 'pip' or 'sbs'
   */
  setLayout(layout: SdkLayout): Promise<void> {
    return this.set('layout', layout);
  }

  /**
   * Sets the playback rate in the player. The value must be between 0 and 2.
   *
   * @param playbackRate the new playback rate
   */
  setPlaybackRate(playbackRate: number): Promise<void> {
    if (playbackRate < 0) {
      throw new Error('The playback rate must be superior or equal to 0');
    }

    if (playbackRate > 2) {
      throw new Error('The playback rate must be inferior or equal to 2');
    }

    return this.set('playbackRate', playbackRate);
  }

  /**
   * Sets the volume in the player
   *
   * @param volume the new volume. The range is 0-100.
   */
  setVolume(volume: number): Promise<void> {
    if (volume < 0 || volume > 100) {
      throw new Error('The volume must be between 0 and 100');
    }

    return this.set('volume', volume);
  }

  /**
   * Sends a COMMAND message to the iframe
   *
   * @param name the event name to send
   * @param args optional arguments to send
   * @private
   */
  private command<T>(name: string, args?: any): Promise<T> {
    return new Promise((resolve, reject) => {
      this.callbackStore.storeCallback(name, {
        reject,
        resolve,
      });

      const message: Partial<SdkMessage> = {
        action: SdkMessageAction.Command,
        guid: this.guid,
        name,
      };

      if (args) {
        message.value = args;
      }

      this.postMessage(message);
    });
  }

  /**
   * Sends a GET message to the iframe
   *
   * @param name the event name to send
   * @private
   */
  private get<T>(name: string): Promise<T> {
    return new Promise((resolve, reject) => {
      this.callbackStore.storeCallback(`${SdkMessageAction.Get}:${name}`, {
        reject,
        resolve,
      });

      this.postMessage({
        action: SdkMessageAction.Get,
        // TODO find a way to get rid of this
        callbackId: 0,
        name,
      });
    });
  }

  /**
   * Starts the handshake process
   *
   * @private
   */
  private handshake(): Promise<void> {
    return new Promise((resolve, reject) => {
      // do not send the handshake on subsequent loads e.g. caused by disclaimer redirects
      if (this.isLoaded) {
        return;
      }

      this.isLoaded = true;

      this.handshakeHandler = (event: MessageEvent) => {
        // ignore messages coming from another iframe
        if (event.origin !== this.originUrl) {
          return;
        }

        const message = parseMessageData<SdkHandshakeMessage>(event.data);

        if (
          message?.action === SdkMessageAction.Handshake
          && message?.guid === this.guid
        ) {
          // remove the interval and timeout as we finally got an answer from the player
          if (this.handshakeInterval) {
            clearInterval(this.handshakeInterval);
          }

          if (this.handshakeTimeout) {
            clearTimeout(this.handshakeTimeout);
          }

          // remove the listener as we only need it once
          window.removeEventListener('message', this.handshakeHandler!);

          // complete the handshake
          if (message?.status === 'error') {
            reject(new Error(message.code));
          } else {
            resolve();
          }
        }
      };

      window.addEventListener('message', this.handshakeHandler);

      const handler = () => this.postMessage({
        action: SdkMessageAction.Handshake,
      });

      // start sending the handshake and send it every second until either the player answers or the handshake times out
      handler();
      this.handshakeInterval = setInterval(() => handler(), 1000);

      // Start the handshake timeout
      if (this.options.timeout > 0) {
        this.handshakeTimeout = setTimeout(() => {
          reject(new Error(SdkMessageError.Timeout));
        }, this.options.timeout);
      }
    });
  }

  /**
   * Initialises the SDK once the iframe is successfully loaded into the DOM
   *
   * @private
   */
  private initSdk(): Promise<void> {
    return new Promise((resolve, reject) => {
      const handler = () => this.handshake()
        .then(resolve)
        .catch((e) => {
          this.destroy();
          reject(e);
        });

      if (this.isReady) {
        return handler();
      }

      // we wait for the iframe to load before starting the handshake
      this.iframe.addEventListener('load', () => handler());
    });
  }

  /**
   * Sends a message to the iframe
   *
   * @param message the message to send
   * @private
   */
  private postMessage(message: Partial<SdkMessage>): void {
    this.iframe.contentWindow?.postMessage(JSON.stringify({
      ...message,
      guid: this.guid,
      version: this.version,
    }), this.origin);
  }

  /**
   * Processes the data from the message handler once the handshake is successful
   *
   * @param data the data to process
   * @private
   */
  private processData(data: any): void {
    const message = parseMessageData<SdkMessage>(data);

    let callbacks: FunctionOrPromise[] = [];

    // ignore messages that should not be for us
    if (
      message?.version !== this.version
      || (message?.action === SdkMessageAction.Event && !message?.guids?.includes(this.guid))
      || (message?.action !== SdkMessageAction.Event && message?.guid !== this.guid)
    ) {
      return;
    }

    if (message.action === SdkMessageAction.Event) {
      // TODO  Update the receiver on the player's side to find a way to provide error
      callbacks = this.callbackStore.getCallbacks(`${message.action}:${message.name}`);
    } else {
      const callback = this.callbackStore.shiftCallback(`${message.action}:${message.name}`);

      if (callback) {
        callbacks.push(callback);
      }
    }

    callbacks.forEach((cb) => {
      if (typeof cb === 'function') {
        cb(message.value);
      } else {
        // TODO find a way to use the cb.reject() function;
        cb.resolve(message.value);
      }
    });
  }

  /**
   * A piece of code marking an iframe as loaded on receiving a ready message.
   * This is needed for the API initialization to cater for the case where an iframe is already loaded, and we cannot use the load event.
   * This is fairly optimistic and will likely not work with redirects, though.
   */
  private ready(): void {
    this.readyHandler = (event: MessageEvent) => {
      // ignores messages coming from other origins
      if (event.origin !== this.originUrl) {
        return;
      }

      const message = parseMessageData<SdkReadyMessage>(event.data);

      if (
        message?.action === SdkMessageAction.Ready
        && message?.value === this.iframe.src
      ) {
        this.isReady = true;

        // we provide the proper origin
        // this allows us to send the cross window message to the proper origin and not broadcast to everybody
        this.origin = event.origin;

        // removes the listener as we only need it once
        window.removeEventListener('message', this.readyHandler!);
      }
    };

    window.addEventListener('message', this.readyHandler);
  }

  /**
   * Sends a SET message to the iframe
   *
   * @param name the event name to send
   * @param value the value to send
   * @private
   */
  private set(name: string, value: any): Promise<void> {
    if (value === undefined || value === null) {
      throw new TypeError('A value must be set.');
    }

    return new Promise((resolve, reject) => {
      this.callbackStore.storeCallback(`${SdkMessageAction.Set}:${name}`, {
        reject,
        resolve,
      });

      this.postMessage({
        action: SdkMessageAction.Set,
        name,
        value,
      });
    });
  }
}
