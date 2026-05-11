import { API_BASE } from './authConfig';

let socket = null;
let heartbeatInterval = null;

export async function registerUser(token, username) {
  try {
    console.log('📝 Registering user with username:', username);

    const res = await fetch(`${API_BASE}/users/register`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('Registration failed:', res.status, errorData);

      // If username taken, return the error
      if (res.status === 409) {
        throw new Error('Username already taken');
      }

      throw new Error(`Registration failed: ${res.status}`);
    }

    const data = await res.json();
    console.log('✅ Registration successful:', data);
    return data.user; // Return the user object
  } catch (error) {
    console.error('registerUser error:', error);
    throw error;
  }
}

export async function findUserById(token) {
  try {
    const res = await fetch(`${API_BASE}/users/find-by-id`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status === 404) {
      console.log('User not found in database (needs registration)');
      return null;
    }

    if (!res.ok) {
      console.warn('findUserById failed:', res.status);
      return null;
    }

    const data = await res.json();
    return data; // Returns the user object directly
  } catch (error) {
    console.error('findUserById error:', error);
    return null;
  }
}

export async function findUser(token, username) {
  try {
    const res = await fetch(`${API_BASE}/users/find?username=${username}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      console.warn('findUser failed:', res.status);
      return null;
    }

    const data = await res.json();
    return data.user;
  } catch (error) {
    console.error('findUser error:', error);
    return null;
  }
}

export async function sendMessage(token, { type, content, toUserId, groupId }) {
  try {
    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, content, toUserId, groupId })
    });

    if (!res.ok) {
      console.warn('sendMessage failed:', res.status);
      return { error: true, status: res.status };
    }

    return await res.json();
  } catch (error) {
    console.error('sendMessage error:', error);
    return { error: true, message: error.message };
  }
}

export async function getMessages(token, { type, targetId }) {
  try {
    const res = await fetch(`${API_BASE}/messages?type=${type}&targetId=${targetId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      console.warn('getMessages failed:', res.status);
      return { messages: [] };
    }

    return await res.json();
  } catch (error) {
    console.error('getMessages error:', error);
    return { messages: [] };
  }
}

export async function connectWebSocket(token, onMessage, autoReconnect = false) {
  try {
    const res = await fetch(`${API_BASE}/negotiate`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error(`WebSocket negotiate failed: ${res.status}`);
    }

    const { url } = await res.json();

    socket = new WebSocket(url, 'json.webpubsub.azure.v1');

    socket.onopen = async () => {
      console.log('✅ WebSocket connected - You are now ONLINE');

      // Notify backend that user is online
      try {
        await fetch(`${API_BASE}/presence/broadcast`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ online: true })
        });
        console.log('📢 Broadcasted: You are ONLINE');
      } catch (error) {
        console.error('Failed to broadcast online status:', error);
      }

      // Send heartbeat every 15 seconds to keep connection alive
      // This proves the user is still active (tab open)
      heartbeatInterval = setInterval(async () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          // Send WebSocket heartbeat
          socket.send(JSON.stringify({ type: 'heartbeat' }));

          // Also update lastSeen in backend
          try {
            await fetch(`${API_BASE}/presence/heartbeat`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            console.log('💓 Heartbeat sent - You are still ONLINE');
          } catch (error) {
            console.log('💓 WebSocket heartbeat sent');
          }
        } else {
          console.log('⚠️ WebSocket not open, stopping heartbeat');
          clearInterval(heartbeatInterval);
        }
      }, 15000);
    };

    socket.onmessage = (event) => {
      try {
        const envelope = JSON.parse(event.data);
        console.log('📬 WebSocket envelope received:', envelope);

        // Azure Web PubSub wraps messages in an envelope
        if (envelope.type === 'message' && envelope.data) {
          // envelope.data might be a string or object
          const messageData = typeof envelope.data === 'string'
            ? JSON.parse(envelope.data)
            : envelope.data;

          console.log('📨 Message data:', messageData);
          onMessage(messageData);
        } else if (envelope.type === 'system') {
          console.log('🔔 System message:', envelope.event);

          // Handle connected/disconnected events
          if (envelope.event === 'connected') {
            console.log('✅ You are now online');
          } else if (envelope.event === 'disconnected') {
            console.log('📴 You are now offline');
          }
        }
      } catch (error) {
        console.error('WebSocket message parse error:', error);
        console.error('Raw event data:', event.data);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = async () => {
      console.log('📴 WebSocket closed - You are now OFFLINE');

      // Clear heartbeat
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }

      // Notify backend that user is offline
      try {
        await fetch(`${API_BASE}/presence/broadcast`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ online: false })
        });
        console.log('📢 Broadcasted: You are OFFLINE');
      } catch (error) {
        console.error('Failed to broadcast offline status:', error);
      }

      // Only auto-reconnect if explicitly enabled
      if (autoReconnect) {
        console.log('WebSocket closed — reconnecting in 5s...');
        setTimeout(() => {
          connectWebSocket(token, onMessage, autoReconnect).catch(err => {
            console.error('WebSocket reconnect failed:', err);
          });
        }, 5000);
      }
    };

    return socket;
  } catch (error) {
    // Silent failure - just return null without logging
    console.log('Backend not available - continuing in demo mode');
    return null;
  }
}

// Disconnect WebSocket when needed
export function disconnectWebSocket() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  if (socket) {
    socket.close();
    socket = null;
  }
}

// Get recent conversations/contacts
export async function getRecentContacts(token) {
  try {
    const res = await fetch(`${API_BASE}/users/contacts`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      console.warn('getRecentContacts failed:', res.status);
      return [];
    }

    const data = await res.json();
    return data.contacts || [];
  } catch (error) {
    console.error('getRecentContacts error:', error);
    return [];
  }
}

// Get currently online users
export async function getOnlineUsers(token) {
  try {
    const res = await fetch(`${API_BASE}/users/online`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      console.warn('getOnlineUsers failed:', res.status);
      return [];
    }

    const data = await res.json();
    return data.users || [];
  } catch (error) {
    console.error('getOnlineUsers error:', error);
    return [];
  }
}
