export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, any>;
  userId: string;
  deviceId: string;
}
