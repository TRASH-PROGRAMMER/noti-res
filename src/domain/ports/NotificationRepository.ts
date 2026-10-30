export interface NotificationRepository {
  create(data: {
    userId: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<{ id: string }>;

  updateStatus(
    id: string,
    status: string,
    ticketId?: string
  ): Promise<void>;

  markAsRead(id: string, userId: string): Promise<void>;
}