import { message, result } from "@permaweb/aoconnect";
import { createDataItemSigner } from "@permaweb/aoconnect";

export interface AOMessageResponse {
  code: number;
  data?: any;
  message?: string;
}

export interface AOMessageConfig {
  process: string;
  tags: { name: string; value: string }[];
  signer?: any;
}

export class AOService {
  static async sendMessage({
    process,
    tags,
    signer = createDataItemSigner(window.arweaveWallet)
  }: AOMessageConfig): Promise<AOMessageResponse> {
    const messageResponse = await message({
      process,
      tags,
      signer,
    });

    const resultResponse = await result({
      message: messageResponse,
      process,
    });

    const { Messages, Error: errorMessage } = resultResponse;

    if (errorMessage) {
      throw new Error(`AO Process Error: ${errorMessage}`);
    }

    if (!Messages || Messages.length === 0) {
      throw new Error("No messages returned from AO process");
    }

    const lastMessage = Messages[Messages.length - 1];
    
    let messageData;
    try {
      messageData = JSON.parse(lastMessage.Data);
    } catch (parseError) {
      console.error("Failed to parse message data:", parseError);
      throw new Error("Invalid response format from AO process");
    }

    return messageData;
  }

  static createTags(action: string, data: Record<string, any> = {}) {
    const tags = [{ name: "Action", value: action }];
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        tags.push({ 
          name: key, 
          value: typeof value === 'object' ? JSON.stringify(value) : String(value) 
        });
      }
    });
    
    return tags;
  }
}