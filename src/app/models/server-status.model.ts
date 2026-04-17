export interface ServerStatus {
  online: boolean;
  host?: string;
  port?: number;
  ip_address?: string;
  version?: string;
  protocol?: {
    version: number;
    name: string;
  };
  players?: {
    online: number;
    max: number;
    list?: PlayerInfo[];
  };
  motd?: {
    raw: string[];
    clean: string[];
    html: string[];
  };
  icon?: string;
  software?: string;
}

export interface PlayerInfo {
  uuid: string;
  name_raw?: string;
  name_clean?: string;
  name_html?: string;
  name?: string;
}
