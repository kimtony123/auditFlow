import { AOService } from './aoService';
import { DataEncoder } from '../utils/dataEncoder';
import type { TokenInfo, TokenPriceResponse, TransferAmount } from '../types/tokens';

export class TokenService {
  private static processId = process.env.TOKEN_PROCESS_ID; // Your token/price process

  // Token configurations from your Lua code
  static readonly STABLECOINS: TokenInfo[] = [
    { tokenId: "L4dADRMN9LvSZ6uF7i2TSu1gS3mbRBKuyYiqEN4ak4w", token: "USDA", symbol: "USDA", type: "stablecoin" },
    { tokenId: "L4dADRMN9LvSZ6uF7i2TSu1gS3mbRBKuyYiqEN4ak4w", token: "USDC", symbol: "USDC", type: "stablecoin" }
  ];

  static readonly AOS_TOKEN: TokenInfo = {
    tokenId: "uKnhxgspOG3p1FE5YYae6GrDe_kd7Ou7ZcnlQRoqO4M",
    token: "AOS",
    symbol: "AOS", 
    type: "aos"
  };

  static readonly OTHER_TOKENS: TokenInfo[] = [
    { tokenId: "wETH_TOKEN_ID", token: "wETH", symbol: "wETH", type: "other" },
    { tokenId: "wAR_TOKEN_ID", token: "wAR", symbol: "wAR", type: "other" },
    { tokenId: "APUS_TOKEN_ID", token: "APUS", symbol: "APUS", type: "other" },
    { tokenId: "WNDR_TOKEN_ID", token: "WNDR", symbol: "WNDR", type: "other" },
    { tokenId: "NAB_TOKEN_ID", token: "NAB", symbol: "NAB", type: "other" },
    { tokenId: "AO_TOKEN_ID", token: "AO", symbol: "AO", type: "other" },
    { tokenId: "ARIO_TOKEN_ID", token: "ARIO", symbol: "ARIO", type: "other" }
  ];

  /**
   * Get all available payment tokens
   */
  static getAvailableTokens(): TokenInfo[] {
    return [
      ...this.STABLECOINS,
      this.AOS_TOKEN,
      ...this.OTHER_TOKENS
    ];
  }

  /**
   * Fetch current token price from AO process
   */
  static async fetchTokenPrice(tokenId: string): Promise<number> {
    // For stablecoins, price is always 1
    if (this.isStablecoin(tokenId)) {
      return 1;
    }

    // For AOS token, we might have a fixed price or fetch from oracle
    if (tokenId === this.AOS_TOKEN.tokenId) {
      // You might want to fetch AOS price from an oracle
      return await this.fetchAOSPrice();
    }

    // For other tokens, fetch from pools
    const tags = AOService.createTags("GetTokenPrice", {
      tokenId,
      Data: DataEncoder.encode({ tokenId })
    });

    try {
      const response = await AOService.sendMessage({
        process: this.processId!,
        tags
      });

      if (response.code === 200) {
        return response.data.price;
      } else {
        throw new Error(response.data?.message || "Failed to fetch token price");
      }
    } catch (error) {
      console.error(`Error fetching price for token ${tokenId}:`, error);
      throw new Error(`Unable to get current price for ${this.getTokenSymbol(tokenId)}`);
    }
  }

  /**
   * Fetch AOS price from oracle or use default
   */
  private static async fetchAOSPrice(): Promise<number> {
    // You can implement AOS price fetching from an oracle
    // For now, return a default value
    return 0.05; // Default AOS price
  }

  /**
   * Check if token is stablecoin
   */
  static isStablecoin(tokenId: string): boolean {
    return this.STABLECOINS.some(token => token.tokenId === tokenId);
  }

  /**
   * Check if token is AOS
   */
  static isAOSToken(tokenId: string): boolean {
    return tokenId === this.AOS_TOKEN.tokenId;
  }

  /**
   * Get token type
   */
  static getTokenType(tokenId: string): 'stablecoin' | 'aos' | 'other' {
    if (this.isStablecoin(tokenId)) return 'stablecoin';
    if (this.isAOSToken(tokenId)) return 'aos';
    return 'other';
  }

  /**
   * Get token symbol by ID
   */
  static getTokenSymbol(tokenId: string): string {
    const allTokens = this.getAvailableTokens();
    const token = allTokens.find(t => t.tokenId === tokenId);
    return token?.symbol || 'UNKNOWN';
  }

  /**
   * Calculate transfer amount based on USD price and token price
   */
  static async calculateTransferAmount(usdAmount: number, tokenId: string): Promise<TransferAmount> {
    const tokenPrice = await this.fetchTokenPrice(tokenId);
    const tokenAmount = usdAmount / tokenPrice;
    const tokenType = this.getTokenType(tokenId);
    const symbol = this.getTokenSymbol(tokenId);

    return {
      tokenId,
      symbol,
      amount: tokenAmount,
      usdValue: usdAmount,
      type: tokenType
    };
  }

  /**
   * Calculate fee breakdown based on token type (matching your Lua logic)
   */
  static calculateFeeBreakdown(totalAmount: number, tokenType: 'stablecoin' | 'aos' | 'other', hasReferral: boolean = false) {
    let stakersFee, treasuryFee, marketingFee, rewardsAmount, referrerFee;

    if (tokenType === 'aos' || tokenType === 'stablecoin') {
      // AOS & Stablecoins: 10% to stakers, rest to rewards + marketing (NO treasury)
      stakersFee = totalAmount * 0.10;
      referrerFee = hasReferral ? (totalAmount * 0.02) : 0;
      
      // Default marketing fee (can be overridden by business settings)
      marketingFee = totalAmount * 0.10;
      rewardsAmount = totalAmount - stakersFee - referrerFee - marketingFee;
      treasuryFee = 0;
    } else {
      // Other tokens: 10% to stakers, 20% to treasury, marketing if enabled
      stakersFee = totalAmount * 0.10;
      treasuryFee = totalAmount * 0.20;
      referrerFee = hasReferral ? (totalAmount * 0.02) : 0;
      
      marketingFee = totalAmount * 0.10;
      rewardsAmount = totalAmount - stakersFee - treasuryFee - referrerFee - marketingFee;
    }

    return {
      total_amount: totalAmount,
      stakers_fee: stakersFee,
      treasury_fee: treasuryFee,
      marketing_fee: marketingFee,
      rewards_amount: rewardsAmount,
      referrer_fee: referrerFee,
      token_type: tokenType
    };
  }
}