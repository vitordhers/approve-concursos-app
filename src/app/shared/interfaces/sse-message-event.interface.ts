export interface SseMessageEvent {
  data: string | Record<string, any>;
  event: string;
  id?: string;
  type?: string;
  retry?: number;
}
