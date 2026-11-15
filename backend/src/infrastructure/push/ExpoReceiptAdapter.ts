import { Expo } from 'expo-server-sdk';

import {
  PushReceipt,
  PushReceiptGateway
} from '../../domain/ports/PushReceiptGateway';

export class ExpoReceiptAdapter implements PushReceiptGateway {

  private expo: Expo;

  constructor(accessToken?: string) {
    this.expo = new Expo({ accessToken });
  }

  async getReceipts(
    receiptIds: string[]
  ): Promise<Record<string, PushReceipt>> {

    if (receiptIds.length === 0) {
      return {};
    }

    const chunks =
      this.expo.chunkPushNotificationReceiptIds(receiptIds);

    const results: Record<string, PushReceipt> = {};

    for (const chunk of chunks) {

      const receipts =
        await this.expo.getPushNotificationReceiptsAsync(chunk);

      for (const [id, receipt] of Object.entries(receipts)) {

        results[id] = {
          id,
          status: receipt.status,
          message:
            receipt.status === 'error'
              ? receipt.message
              : undefined,
          details: receipt.details
        };
      }
    }

    return results;
  }
}