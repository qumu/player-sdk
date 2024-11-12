import { parseMessageData } from '../lib/functions/functions';
import {
  SdkCommandMessage,
  SdkEventMessage,
  SdkGetSetMessage,
  SdkHandshakeMessage,
  SdkMessage,
} from '../models/internal';
import { CallbackStore, FunctionOrPromise } from '../lib/callbacks/callbacks';
import { SdkCaptionTrack, SdkLayout, SdkPipPosition, SdkPrimaryContent } from '../models/external';

export class PlayerSdk {
  // store used for the callbacks
  private readonly callbackStore: CallbackStore;

  // Random guid used during Cross window communication
  // This is useful to prevent communication bleeding between SDKs if the same presentation is used multiple times in the page
  private readonly guid: string;

  // callback for the message event listener once the handshake is done
  private messageHandler: ((event: MessageEvent) => void) | undefined;

  // origin url of the iframe's src
  // we will use it to compare with the event's origin and filter out messages from unknown origins
  private readonly originUrl: string;

  // origin used to send cross window communication messages
  // this is useful to target a specific origin and not have to broadcast to everybody
  private origin = '*';

  private readonly readyPromise: Promise<void>;

  // Cross window communication format version
  private readonly version = 3;

  constructor(
    private readonly iframe: HTMLIFrameElement,
  ) {
    this.originUrl = new URL(this.iframe.src).origin;
    this.guid = crypto.randomUUID();

    this.callbackStore = new CallbackStore();

    // create the promise that will be used to verify if the messages can be exchanged with the player
    this.readyPromise = new Promise((resolve) => {
      this.messageHandler = (event: MessageEvent) => {
        // ignore messages coming from another iframe
        if (event.origin !== this.originUrl) {
          return;
        }

        const message = parseMessageData<SdkMessage>(event.data);

        // ignore messages from previous SDKs
        if (message?.version !== this.version) {
          return;
        }

        // ignores handshake from other SDKs
        if (message?.action === 'handshake' && message?.guid !== this.guid) {
          return;
        }

        if (message?.action === 'ready') {
          const frame = message.value
            ? window.document.querySelector(`iframe[src="${message.value}"]`) as HTMLIFrameElement
            : this.iframe;

          if (!frame) {
            // eslint-disable-next-line no-console
            console.error(
              '[Qumu Cloud Player SDK]',
              'A Qumu Cloud player is ready but it is impossible to find the corresponding iFrame, the SDK will not work correctly. Incorrect URL is:',
              message.value,
            );
          } else if (frame === this.iframe) {
            // we provide the proper origin
            // this allows us to send the cross window message to the proper origin and not broadcast to everybody
            this.origin = event.origin;
            resolve();
          }

          return;
        }

        if (message?.action === 'handshake') {
          // we provide the proper origin
          // this allows us to send the cross window message to the proper origin and not broadcast to everybody
          this.origin = event.origin;
          resolve();

          return;
        }

        this.processData(message);
      };

      window.addEventListener('message', this.messageHandler);
    });

    // we send a request for a handshake
    // this one is useful in the event when the SDK is initialized after the player
    this.postMessage<SdkHandshakeMessage>({
      action: 'handshake',
      guid: this.guid,
    });
  }

  /**
   * Registers a callback to be run when the event is triggered
   *
   * @param name the event name to listen to
   * @param callback the callback to run when the event is triggered
   */
  addEventListener(name: SdkEventMessage['name'], callback: Function): void {
    if (!name) {
      throw new TypeError('You must pass an event name.');
    }

    if (!callback) {
      throw new TypeError('You must pass a callback function.');
    }

    if (typeof callback !== 'function') {
      throw new TypeError('The callback must be a function.');
    }

    const callbacks = this.callbackStore.getCallbacks(`event:${name}`);

    // This is the first time we subscribe to this event, we need to tell the Player to start a watcher
    if (callbacks.length === 0) {
      this.readyPromise.then(() => {
        this.postMessage<SdkEventMessage>({
          action: 'event',
          guid: this.guid,
          name,
          value: 'add',
        });
      });
    }

    this.callbackStore.storeCallback(`event:${name}`, callback);
  }

  /**
   * Destroys the whole SDK
   */
  destroy(): void {
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
    }

    this.postMessage<SdkCommandMessage>({
      action: 'command',
      guid: this.guid,
      name: 'destroy',
    });
  }

  /**
   * Disables any caption track
   */
  disableCaptionTrack(): void {
    this.enableCaptionTrack(null);
  }

  /**
   * Sets the current caption track
   *
   * @param lang the language of the active track. Use null to disable captions.
   */
  enableCaptionTrack(lang: string | null): void {
    this.set('captionTrack', lang);
  }

  /**
   * Gets the available audience reactions
   */
  async getAudienceReactions(): Promise<string[]> {
    return this.get('audienceReactions');
  }

  /**
   * Gets the available caption tracks
   */
  async getCaptionTracks(): Promise<SdkCaptionTrack[]> {
    return this.get('captionTracks');
  }

  /**
   * Gets the list of chapters for the presentation
   */
  async getChapters(): Promise<any[]> {
    return this.get('chapters');
  }

  /**
   * Gets the current chapter
   */
  async getCurrentChapter(): Promise<any> {
    return this.get('chapter');
  }

  /**
   * Gets the current caption track
   */
  async getCurrentCaptionTrack(): Promise<SdkCaptionTrack | null> {
    return this.get('captionTrack');
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
   * Gets the requested level by the user
   *
   * The values can differ from `.getPlaybackLevel()` for automatic level switching
   */
  async getLevel(): Promise<number> {
    return this.get('level');
  }

  /**
   * Gets the available levels
   */
  async getLevels(): Promise<Array<{key: string; value: number}>> {
    return this.get('levels');
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
   * Gets the state of a live event
   */
  async getLiveState(): Promise<string | null> {
    return this.get('liveState');
  }

  /**
   * Gets the position of the PiP box
   */
  async getPictureInPicturePosition(): Promise<number> {
    return this.get('pipPosition');
  }

  /**
   * Gets the actual playback level
   *
   * The values can differ from `.getLevel()` for automatic level switching
   */
  async getPlaybackLevel(): Promise<number> {
    return this.get('playbackLevel');
  }

  /**
   * Gets the playback rate
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
   * Gets the primary content
   */
  async getPrimaryContent(): Promise<SdkPrimaryContent> {
    return this.get('primaryContent');
  }

  /**
   * Gets the side by side ratio between 50% and 80%
   */
  async getSideBySideRatio(): Promise<number> {
    return this.get('sideBySideRatio');
  }

  /**
   * Gets the player's volume between 0 and 100
   */
  async getVolume(): Promise<number> {
    return this.get('volume');
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
  pause(): void {
    this.command('pause');
  }

  /**
   * Plays the player
   */
  play(): void {
    this.command('play');
  }

  /**
   * Sends the Audience Reaction
   *
   * @param reaction the reaction
   */
  sendAudienceReaction(reaction: 'string'): void {
    this.set('audienceReaction', reaction);
  }

  /**
   * Stops listening to a player event
   *
   * @param name the event name to listen to
   * @param callback the callback to remove. If no callback is provided, all callbacks will be removed for the event name
   */
  removeEventListener(name: SdkEventMessage['name'], callback?: Function): void {
    if (!name) {
      throw new TypeError('You must pass an event name.');
    }

    this.callbackStore.removeCallback(`event:${name}`, callback);

    const callbacks = this.callbackStore.getCallbacks(`event:${name}`);

    // Remove the watcher on the player's side if there are no subscribers for this event
    if (callbacks.length === 0) {
      this.postMessage<SdkEventMessage>({
        action: 'event',
        guid: this.guid,
        name,
        value: 'remove',
      });
    }
  }

  /**
   * Sets the current time in the player
   *
   * @param time the new current time in milliseconds
   */
  setCurrentTime(time: number): void {
    if (time < 0) {
      throw new Error('The current time must be superior or equal to 0');
    }

    this.set('currentTime', time);
  }

  /**
   * Sets the layout
   *
   * @param layout the new layout, either 'pip' or 'sbs'
   */
  setLayout(layout: SdkLayout): void {
    this.set('layout', layout);
  }

  /**
   * Sets the level
   *
   * @param level the new level, use -1 for automatic level switching
   */
  setLevel(level: number): void {
    if (level < -1 || level === 0) {
      throw new Error('The level must set to -1 for automatic switching or be superior to 0');
    }

    this.set('level', level);
  }

  /**
   * Sets the position of the PiP box
   *
   * @param position the PiP position
   */
  setPictureInPicturePosition(position: SdkPipPosition): void {
    this.set('pipPosition', position);
  }

  /**
   * Sets the playback rate in the player. The value must be between 0 and 2.
   *
   * @param playbackRate the new playback rate
   */
  setPlaybackRate(playbackRate: number): void {
    if (playbackRate < 0) {
      throw new Error('The playback rate must be superior or equal to 0');
    }

    if (playbackRate > 2) {
      throw new Error('The playback rate must be inferior or equal to 2');
    }

    this.set('playbackRate', playbackRate);
  }

  /**
   * Sets the primary content
   *
   * @param primaryContent the primary content
   */
  setPrimaryContent(primaryContent: SdkPrimaryContent): void {
    this.set('primaryContent', primaryContent);
  }

  /**
   * Sets the ratio for the Side by Side mode
   *
   * @param ratio the new ratio. The range is 50-80.
   */
  setSideBySideRatio(ratio: number): void {
    if (ratio < 50 || ratio > 80) {
      throw new Error('The ratio must be between 50 and 80');
    }

    this.set('sideBySideRatio', ratio);
  }

  /**
   * Sets the volume in the player
   *
   * @param volume the new volume. The range is 0-100.
   */
  setVolume(volume: number): void {
    if (volume < 0 || volume > 100) {
      throw new Error('The volume must be between 0 and 100');
    }

    this.set('volume', volume);
  }

  /**
   * Sends a COMMAND message to the iframe
   *
   * @param name the event name to send
   * @param args optional arguments to send
   * @private
   */
  private command(name: SdkCommandMessage['name'], args?: any): void {
    const message: Omit<SdkCommandMessage, 'version'> = {
      action: 'command',
      guid: this.guid,
      name,
    };

    if (args) {
      message.value = args;
    }

    this.postMessage(message);
  }

  /**
   * Sends a GET message to the iframe
   *
   * @param name the event name to send
   * @private
   */
  private async get<T>(name: SdkGetSetMessage['name']): Promise<T> {
    await this.readyPromise;

    return new Promise((resolve, reject) => {
      try {
        this.callbackStore.storeCallback(`get:${name}`, {
          reject,
          resolve,
        });

        this.postMessage<SdkGetSetMessage>({
          action: 'get',
          guid: this.guid,
          name,
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Sends a message to the iframe
   *
   * @param message the message to send
   * @private
   */
  private postMessage<T extends SdkMessage>(message: Omit<T, 'version'>): void {
    const messageString = JSON.stringify({
      ...message,
      version: this.version,
    });

    this.iframe.contentWindow?.postMessage(messageString, this.origin);
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
    if (message?.version !== this.version || (message as any)?.guid !== this.guid) {
      return;
    }

    if (message.action === 'event') {
      // TODO  Update the receiver on the player's side to find a way to provide error
      callbacks = this.callbackStore.getCallbacks(`${message.action}:${message.name}`);
    } else if (message.action === 'get' || message.action === 'set') {
      const callback = this.callbackStore.shiftCallback(`${message.action}:${message.name}`);

      if (callback) {
        callbacks.push(callback);
      }
    }

    callbacks.forEach((cb) => {
      if (typeof cb === 'function') {
        cb((message as SdkGetSetMessage).value);
      } else {
        // TODO find a way to use the cb.reject() function;
        cb.resolve((message as SdkGetSetMessage).value);
      }
    });
  }

  /**
   * Sends a SET message to the iframe
   *
   * @param name the event name to send
   * @param value the value to send
   * @private
   */
  private set(name: SdkGetSetMessage['name'], value: any): void {
    if (value === undefined) {
      throw new TypeError('A value must be set.');
    }

    this.readyPromise
      .then(() => {
        this.postMessage<SdkGetSetMessage>({
          action: 'set',
          guid: this.guid,
          name,
          value,
        });
      });
  }
}
