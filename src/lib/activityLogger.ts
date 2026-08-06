import { addDoc, collection } from 'firebase/firestore';
import { db } from './firebase';

export async function logUserActivity(
  userId: string,
  userEmail: string,
  actionType: string,
  description: string,
  details?: Record<string, any>
) {
  if (!userId) return;
  try {
    await addDoc(collection(db, 'activityLogs'), {
      userId,
      userEmail: userEmail || '',
      actionType,
      description,
      details: details || {},
      timestamp: Date.now()
    });
  } catch (err) {
    console.error('Error logging activity:', err);
  }
}
