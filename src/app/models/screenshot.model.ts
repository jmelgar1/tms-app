export interface Screenshot {
  id: number;
  playerName: string;
  playerUuid: string;
  caption: string | null;
  takenAt: string;
  imageUrl: string | null;
}

export interface ScreenshotListResponse {
  screenshots: Screenshot[];
  total: number;
}

export interface TokenRequestResponse {
  token: string;
  message: string;
}

export interface TokenStatusResponse {
  verified: boolean;
}
