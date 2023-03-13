declare type SdkEventListener = 'captiontrackchange' | 'chapterchange' | 'ended' | 'layoutchange' | 'livestatechange' | 'pause' | 'play' | 'playbackratechange' | 'primarycontentchange' | 'timeupdate' | 'volumechange';
declare type SdkGetSetName = 'captionTrack' | 'captionTracks' | 'chapter' | 'chapters' | 'currentTime' | 'duration' | 'layout' | 'liveEndTime' | 'liveStartTime' | 'liveState' | 'paused' | 'pipPosition' | 'playbackRate' | 'playbackRates' | 'presentation' | 'primaryContent' | 'sideBySideRatio' | 'volume';
export interface SdkCommandMessage {
    action: 'command';
    guid: string;
    name: 'destroy' | 'pause' | 'play';
    value?: any;
    version: number;
}
export interface SdkEventMessage {
    action: 'event';
    guid: string;
    name: SdkEventListener;
    value?: any;
    version: number;
}
export interface SdkGetSetMessage {
    action: 'get' | 'set';
    guid: string;
    name: SdkGetSetName;
    value?: any;
    version: number;
}
export interface SdkHandshakeMessage {
    action: 'handshake';
    guid: string;
    version: number;
}
export interface SdkReadyMessage {
    action: 'ready';
    version: number;
}
export declare type SdkMessage = SdkCommandMessage | SdkEventMessage | SdkGetSetMessage | SdkHandshakeMessage | SdkReadyMessage;
export {};
