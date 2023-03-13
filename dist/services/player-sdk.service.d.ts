import { SdkEventMessage } from '../models/internal';
import { SdkCaptionTrack, SdkLayout, SdkPipPosition, SdkPrimaryContent } from '../models/external';
export declare class PlayerSdk {
    private readonly iframe;
    private readonly callbackStore;
    private readonly guid;
    private messageHandler;
    private readonly originUrl;
    private origin;
    private readonly readyPromise;
    private readonly version;
    constructor(iframe: HTMLIFrameElement);
    /**
     * Registers a callback to be run when the event is triggered
     *
     * @param name the event name to listen to
     * @param callback the callback to run when the event is triggered
     */
    addEventListener(name: SdkEventMessage['name'], callback: Function): void;
    /**
     * Destroys the whole SDK
     */
    destroy(): void;
    /**
     * Disables any caption track
     */
    disableCaptionTrack(): void;
    /**
     * Sets the current caption track
     *
     * @param lang the language of the active track. Use null to disable captions.
     */
    enableCaptionTrack(lang: string | null): void;
    /**
     * Gets the available caption tracks
     */
    getCaptionTracks(): Promise<SdkCaptionTrack[]>;
    /**
     * Gets the list of chapters for the presentation
     */
    getChapters(): Promise<any[]>;
    /**
     * Gets the current chapter
     */
    getCurrentChapter(): Promise<any>;
    /**
     * Gets the current caption track
     */
    getCurrentCaptionTrack(): Promise<SdkCaptionTrack | null>;
    /**
     * Gets the current time in milliseconds
     */
    getCurrentTime(): Promise<number>;
    /**
     * Gets the presentation's duration in milliseconds
     */
    getDuration(): Promise<number>;
    /**
     * Gets the layout
     */
    getLayout(): Promise<SdkLayout>;
    /**
     * Gets the presentation's duration in milliseconds
     */
    getLiveEndTime(): Promise<string | null>;
    /**
     * Gets the presentation's duration in milliseconds
     */
    getLiveStartTime(): Promise<string | null>;
    /**
     * Gets the state of a live event
     */
    getLiveState(): Promise<string | null>;
    /**
     * Gets the position of the PiP box
     */
    getPictureInPicturePosition(): Promise<number>;
    /**
     * Gets the playback rate
     */
    getPlaybackRate(): Promise<number>;
    /**
     * Gets the list of playback rates
     */
    getPlaybackRates(): Promise<number[]>;
    /**
     * Gets the presentation
     */
    getPresentation(): Promise<any>;
    /**
     * Gets the primary content
     */
    getPrimaryContent(): Promise<SdkPrimaryContent>;
    /**
     * Gets the side by side ratio between 50% and 80%
     */
    getSideBySideRatio(): Promise<number>;
    /**
     * Gets the player's volume between 0 and 100
     */
    getVolume(): Promise<number>;
    /**
     * Checks whether the player is paused or playing
     */
    isPaused(): Promise<boolean>;
    /**
     * Pauses the player
     */
    pause(): void;
    /**
     * Plays the player
     */
    play(): void;
    /**
     * Stops listening to a player event
     *
     * @param name the event name to listen to
     * @param callback the callback to remove. If no callback is provided, all callbacks will be removed for the event name
     */
    removeEventListener(name: string, callback?: Function): void;
    /**
     * Sets the current time in the player
     *
     * @param time the new current time in milliseconds
     */
    setCurrentTime(time: number): void;
    /**
     * Sets the layout
     *
     * @param layout the new layout, either 'pip' or 'sbs'
     */
    setLayout(layout: SdkLayout): void;
    /**
     * Sets the position of the PiP box
     *
     * @param position the PiP position
     */
    setPictureInPicturePosition(position: SdkPipPosition): void;
    /**
     * Sets the playback rate in the player. The value must be between 0 and 2.
     *
     * @param playbackRate the new playback rate
     */
    setPlaybackRate(playbackRate: number): void;
    /**
     * Sets the primary content
     *
     * @param primaryContent the primary content
     */
    setPrimaryContent(primaryContent: SdkPrimaryContent): void;
    /**
     * Sets the ratio for the Side by Side mode
     *
     * @param ratio the new ratio. The range is 50-80.
     */
    setSideBySideRatio(ratio: number): void;
    /**
     * Sets the volume in the player
     *
     * @param volume the new volume. The range is 0-100.
     */
    setVolume(volume: number): void;
    /**
     * Sends a COMMAND message to the iframe
     *
     * @param name the event name to send
     * @param args optional arguments to send
     * @private
     */
    private command;
    /**
     * Sends a GET message to the iframe
     *
     * @param name the event name to send
     * @private
     */
    private get;
    /**
     * Sends a message to the iframe
     *
     * @param message the message to send
     * @private
     */
    private postMessage;
    /**
     * Processes the data from the message handler once the handshake is successful
     *
     * @param data the data to process
     * @private
     */
    private processData;
    /**
     * Sends a SET message to the iframe
     *
     * @param name the event name to send
     * @param value the value to send
     * @private
     */
    private set;
}
