export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: number;
  variant: ToastVariant;
  title: string;
  description: string;
  createdAt: number;
}

export interface ToastPayload {
  variant: ToastVariant;
  title: string;
  description?: string;
  durationMs?: number;
}
