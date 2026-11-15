export interface PushReceipt {
  id: string;

  status: 'ok' | 'error';

  message?: string;

  details?: {
    error?: string;
    expoPushToken?: string;
  };
}

export interface PushReceiptGateway {

  getReceipts(
    receiptIds: string[]
  ): Promise<Record<string, PushReceipt>>;
}