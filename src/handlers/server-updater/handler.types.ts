export type Server = {
  id: number;
  ip: string;
};

export enum UpdateType {
  SERVER_INFO = "SERVER_INFO",
  SERVER_IMAGE = "SERVER_IMAGE",
}

export type ServerInfoUpdate = {
  id: number;
  successful: boolean;
  playerCount?: number;
  maxPlayers?: number;
  versionName?: string;
  versionProtocol?: number;
};

export type ServerIconUpdate = {
  id: number;
  successful: boolean;
};

export type ScheduledEvent = {
  updateType: UpdateType;
};
