type SdkEventListener = 'captiontrackchange'
  | 'chapterchange'
  | 'ended'
  | 'layoutchange'
  | 'livestatechange'
  | 'pause'
  | 'play'
  | 'playbackratechange'
  | 'primarycontentchange'
  | 'ready'
  | 'timeupdate'
  | 'volumechange';

type SdkGetSetName = 'audienceReaction'
  | 'audienceReactions'
  | 'captionTrack'
  | 'captionTracks'
  | 'chapter'
  | 'chapters'
  | 'currentTime'
  | 'duration'
  | 'layout'
  | 'level'
  | 'levels'
  | 'liveEndTime'
  | 'liveStartTime'
  | 'liveState'
  | 'paused'
  | 'pipPosition'
  | 'playbackLevel'
  | 'playbackRate'
  | 'playbackRates'
  | 'presentation'
  | 'primaryContent'
  | 'sideBySideRatio'
  | 'volume';

export interface SdkCommandMessage {
  action: 'command';
  guid: string;
  name: 'destroy' | 'pause' | 'play';
  value?: unknown;
  version: number;
}

export interface SdkEventMessage {
  action: 'event';
  guid: string;
  name: SdkEventListener;
  value?: unknown;
  version: number;
}

export interface SdkGetSetMessage {
  action: 'get' | 'set';
  guid: string;
  name: SdkGetSetName;
  value?: unknown;
  version: number;
}

export interface SdkHandshakeMessage {
  action: 'handshake';
  guid: string;
  version: number;
}

export interface SdkReadyMessage {
  action: 'ready';
  value: string;
  version: number;
}

export type SdkMessage = SdkCommandMessage
  | SdkEventMessage
  | SdkGetSetMessage
  | SdkHandshakeMessage
  | SdkReadyMessage;
