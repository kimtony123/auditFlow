export class DataEncoder {
  static encode(data: any): string {
    try {
      return typeof data === 'string' ? data : JSON.stringify(data);
    } catch (error) {
      console.error("Data encoding error:", error);
      throw new Error("Failed to encode data for AO process");
    }
  }

  static decode<T = any>(encodedData: string): T {
    try {
      return JSON.parse(encodedData);
    } catch (error) {
      console.error("Data decoding error:", error);
      throw new Error("Failed to decode data from AO process");
    }
  }

  static createDataPayload(data: any): { Data: string } {
    return {
      Data: this.encode(data)
    };
  }
}