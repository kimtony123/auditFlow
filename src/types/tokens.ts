export interface TokenInfo {
  tokenId: string;
  token: string;
  symbol: string;
  type: 'stablecoin' | 'aos' | 'other';
  denomination?: number;
  price?: number;
}

export interface TokenPriceResponse {
  price: number;
  tokenId: string;
  timestamp: number;
}

export interface TransferAmount {
  tokenId: string;
  symbol: string;
  amount: number;
  usdValue: number;
  type: 'stablecoin' | 'aos' | 'other';
}