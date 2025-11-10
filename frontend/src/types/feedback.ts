// Feedback types
export type FeedbackStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED';

export interface Feedback {
  id: number;
  parentName: string;
  contactInfo: string;
  type: string;
  message: string;
  response: string | null;
  status: FeedbackStatus;
  createdAt: string;
  resolvedAt: string | null;
}
