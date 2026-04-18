export interface Screenshot {
  id: number;
  playerName: string;
  playerUuid: string;
  caption: string | null;
  uploadedAt: string;
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
