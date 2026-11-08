export interface PushMessage { // interface para representar un mensaje push
  token: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}
