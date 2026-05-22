export interface DonationInfo {
  stripe?: {
    available: number;
    pending: number;
    publishableKey: string;
    buyButtonId: string;
    sandboxMode: boolean;
  };
}
