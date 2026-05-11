// chatService.js — add this to your frontend

let socket = null;

export async function connectToChat(token) {
  // 1. Get WebSocket URL from backend
  const res = await fetch("/api/negotiate", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const { url, userId, channels } = await res.json();

  // 2. Open WebSocket connection to PubSub
  socket = new WebSocket(url, "json.webpubsub.azure.v1");

  socket.onopen = () => {
    console.log("✅ Connected to chat — channels:", channels);
  };

  // 3. Handle incoming messages
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    // PubSub wraps your message in a data field
    if (data.type === "message") {
      const message = data.data;
      handleIncomingMessage(message); // ← your UI update function
    }
  };

  socket.onclose = () => {
    console.log("Disconnected — reconnecting in 3s...");
    setTimeout(() => connectToChat(token), 3000); // auto-reconnect
  };
}

// Send a DM by username
export async function sendDirectMessage(token, toUsername, content) {
  // 1. Look up user by username
  const res = await fetch(`/api/users/find?username=${toUsername}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("User not found");
  const { user } = await res.json();

  // 2. Send message using their userId
  await fetch("/api/messages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "direct",
      content,
      toUserId: user.userId,
    }),
  });
}

// Join a group's PubSub channel after creating/joining
export function joinGroupChannel(groupId) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify({
    type: "joinGroup",
    group: `group_${groupId}`,
  }));
}
