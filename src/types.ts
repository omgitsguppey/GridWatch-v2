export interface UserReport {
  id: string;
  type: 'OUTAGE' | 'RESTORED' | 'WARMING_NEEDED';
  timestamp: number;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  description?: string;
  verified: boolean;
}

export interface WarmingCenter {
  name: string;
  address: string;
  status: 'OPEN' | 'FULL' | 'CLOSED';
  capacity?: string;
  sourceUrl?: string;
  latitude: number;
  longitude: number;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
    placeAnswerSources?: {
      reviewSnippets?: {
        text: string;
      }[];
    };
  };
}

export enum AppView {
  FEED = 'FEED',
  MAP = 'MAP',
  MEDIA = 'MEDIA',
  ASSISTANT = 'ASSISTANT',
}
