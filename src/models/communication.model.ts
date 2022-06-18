export const enum SdkMessageAction {
  Command = 'command',
  Event = 'event',
  Get = 'get',
  Handshake = 'handshake',
  Ready = 'ready',
  Set = 'set',
}

export const enum SdkMessageError {
  GuidInUse = 'GUID_IN_USE',
  Timeout = 'TIME_OUT',
}

export interface SdkMessage {
  action: SdkMessageAction;
  callbackId?: any;
  guid?: string;
  guids?: string[];
  name?: string;
  value?: any;
  version: number;
}

export interface SdkReadyMessage {
  action: SdkMessageAction;
  value: string;
}

export interface SdkHandshakeMessage {
  action: SdkMessageAction;
  code?: SdkMessageError;
  guid: string;
  status: 'success' | 'error';
}

export type SdkEventListener =
  'closedcaptionslanguagechange'
  | 'ended'
  | 'liveState'
  | 'pause'
  | 'play'
  | 'timeupdate'
  | 'volumechange';
