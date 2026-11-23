export type NotificationType =
  | 'workflow_completed'
  | 'workflow_failed'
  | 'workflow_cancelled'
  | 'credits_added'
  | 'credits_low'
  | 'credits_exhausted'
  | 'system';

export interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: NotificationType;
  is_read: boolean;
  redirect_url: string | null;
  created_at: string;
  read_at: string | null;
}

export interface UnreadCount {
  unread_count: number;
}