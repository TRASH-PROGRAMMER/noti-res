export interface PushMessage { // interface para representar un mensaje push
  token: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export type PushTicketResult =
  | {
      status: 'ok';
      id: string;
    }
  | {
      status: 'error';
      message: string;
      details?: {
        error?: string;
      };
    };

export interface NotificationSender {
  sendBatch(messages: PushMessage[]): Promise<PushTicketResult[]>;
}
