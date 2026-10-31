export interface PushMessage {
  token: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}
