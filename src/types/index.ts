import type { Timestamp } from 'firebase/firestore';

export interface Entry {
  id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: Timestamp;
}
