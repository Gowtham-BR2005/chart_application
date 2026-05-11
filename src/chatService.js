import { API_BASE } from './authConfig';

let socket = null;

export async function registerUser(token, username) {
  const res = await fetch(`${API_BASE}/users/register`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });
  return res.json();
}

export async function findUserById(token) {
  const res = await fetch(`${API_BASE}/users/find-by-id`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.status === 404) return null;
  return res.json();
}

export async function findUser(token, username) {
  const res = await fetch(`${API_BASE}/users/find?username=${username}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user;
}

export async function sendMessage(token, { type, content, toUserId, groupId }) {
  const res = await fetch(`${API_BASE}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, content, toUserId, groupId })
  });
  return res.json();
}

export async function getMessages(token, { type, targetId }) {
  const res = await fetch(`${API_BASE}/messages?type=${type}&targetId=${targetId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

export async function connectWebSocket(token, onMessage) {
  const res = await fetch(`${API_BASE}/negotiate`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const { url } = await res.json();

  socket = new WebSocket(url, 'json.webpubsub.azure.v1');

  socket.onopen = () => console.log('✅ WebSocket connected');

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'message' && data.data) {
      onMessage(data.data);
    }
  };

  socket.onclose = () => {
    console.log('WebSocket closed — reconnecting...');
    setTimeout(() => connectWebSocket(token, onMessage), 3000);
  };

  return socket;
}