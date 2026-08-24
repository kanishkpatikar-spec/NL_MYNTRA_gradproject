const SESSION_KEY = 'myntra_aura_session_id';

const getSessionId = () => {
  if (typeof window === 'undefined') return null;
  
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
};

export const logEvent = async (eventType, data = {}) => {
  try {
    const sessionId = getSessionId();
    // Assuming the backend is hosted on the same origin or configured via proxy
    // If different origin, we might need to use a NEXT_PUBLIC env variable.
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    
    fetch(`${baseUrl}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: eventType,
        data: data,
        session_id: sessionId
      })
    }).catch(err => console.error('Failed to log event passively', err));
  } catch (error) {
    console.error('Failed to log event:', error);
  }
};
