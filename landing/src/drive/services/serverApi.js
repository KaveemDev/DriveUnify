import { auth } from '../config/firebase';

export async function callOAuth(op, data = {}) {
  const user = auth?.currentUser;
  if (!user) {
    const error = new Error('You must be signed in.');
    error.code = 'unauthenticated';
    throw error;
  }

  const idToken = await user.getIdToken();
  const res = await fetch('/api/oauth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ op, ...data }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(json.message || 'Request failed');
    error.code = json.code || 'internal';
    throw error;
  }
  return json;
}
