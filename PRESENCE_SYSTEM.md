# 🟢 Redis-like Presence System in Cosmos DB

## Overview

This chat application uses **Azure Cosmos DB as a Redis-like store** for managing real-time online/offline presence. This is more cost-effective than using Azure Cache for Redis while providing similar functionality.

---

## Data Structure

### Users Collection

Each user document in Cosmos DB contains:

```json
{
  "id": "user-unique-id",
  "userId": "00000000-0000-0000-8419-041d12237f38",
  "username": "ganeshan_1715453890123",
  "displayName": "Ganeshan M",
  "email": "user@example.com",
  "online": true,           // ← Online status (like Redis key)
  "lastSeen": "2026-05-11T17:46:32.000Z",  // ← Last activity timestamp
  "partitionKey": "users",
  "createdAt": "2026-05-11T12:00:00.000Z"
}
```

---

## How It Works (Like Redis)

### 1. User Comes Online

**When**: User logs in and connects to WebSocket

**Backend** (`broadcastPresence.js`):
```javascript
// Update Cosmos DB (like Redis SET command)
userDoc.online = true;
userDoc.lastSeen = new Date().toISOString();
await usersContainer.item(userDoc.id, "users").replace(userDoc);

// Broadcast to all clients
await pubSubClient.sendToAll({
  type: "presence",
  userId: user.oid,
  online: true
});
```

**Redis Equivalent**:
```redis
SET user:12345:online true
SET user:12345:lastSeen 1715453890
PUBLISH presence:channel '{"userId": "12345", "online": true}'
```

---

### 2. Heartbeat (Keep-Alive)

**When**: Every 30 seconds while user is active

**Backend** (`heartbeat.js`):
```javascript
// Update lastSeen timestamp (like Redis SETEX command)
userDoc.lastSeen = new Date().toISOString();
userDoc.online = true;
await usersContainer.item(userDoc.id, "users").replace(userDoc);
```

**Redis Equivalent**:
```redis
SETEX user:12345:lastSeen 60 1715453890
EXPIRE user:12345:online 60
```

---

### 3. Inactive User Detection

**When**: Every 30 seconds, backend checks for stale users

**Backend** (`checkInactiveUsers.js`):
```javascript
// Find users with no heartbeat in 60+ seconds (like Redis TTL check)
const sixtySecondsAgo = new Date(now - 60000);
const staleUsers = await usersContainer.items.query({
  query: `
    SELECT * FROM c
    WHERE c.online = true
    AND c.lastSeen < @threshold
  `,
  parameters: [{ name: "@threshold", value: sixtySecondsAgo.toISOString() }]
}).fetchAll();

// Mark them offline
for (const userDoc of staleUsers) {
  userDoc.online = false;
  await usersContainer.item(userDoc.id, "users").replace(userDoc);
  
  // Broadcast offline status
  await pubSubClient.sendToAll({
    type: "presence",
    userId: userDoc.userId,
    online: false
  });
}
```

**Redis Equivalent**:
```redis
# Redis would automatically expire keys with TTL
# But we manually check:
SCAN 0 MATCH user:*:lastSeen
# For each key, check if TTL expired
TTL user:12345:lastSeen
# If expired, mark offline
SET user:12345:online false
```

---

### 4. User Goes Offline

**When**: User closes browser/tab/logs out

**Frontend** (`App.js`):
```javascript
// beforeunload event with keepalive
window.addEventListener('beforeunload', () => {
  fetch('/api/presence/broadcast', {
    method: 'POST',
    body: JSON.stringify({ online: false }),
    keepalive: true  // Ensures delivery even as page closes
  });
});
```

**Backend**: Same as #1 but with `online: false`

**Redis Equivalent**:
```redis
SET user:12345:online false
PUBLISH presence:channel '{"userId": "12345", "online": false}'
```

---

### 5. Get Online Users

**Backend** (`getOnlineUsers.js`):
```javascript
// Query all online users (like Redis SMEMBERS)
const onlineUsers = await usersContainer.items.query({
  query: "SELECT c.userId, c.username, c.displayName FROM c WHERE c.online = true"
}).fetchAll();
```

**Redis Equivalent**:
```redis
SMEMBERS online_users
# Or scan all user keys
SCAN 0 MATCH user:*:online COUNT 100
```

---

## Comparison: Cosmos DB vs Redis

| Feature | Redis | Our Cosmos DB Solution |
|---------|-------|------------------------|
| **Online Status** | `SET user:id:online true` | `userDoc.online = true` |
| **Heartbeat** | `SETEX user:id:lastSeen 60 timestamp` | `userDoc.lastSeen = timestamp` |
| **Expiration** | Automatic with TTL | Manual check every 30s |
| **Get Online Users** | `SMEMBERS online_users` | SQL query `WHERE online = true` |
| **Pub/Sub** | Redis Pub/Sub | Azure Web PubSub |
| **Persistence** | Optional (RDB/AOF) | Always persistent |
| **Cost** | ~$100/month (Azure Cache) | ~$25/month (Cosmos DB) |
| **Speed** | ~1ms latency | ~10ms latency |

---

## Advantages Over Redis

✅ **Cost-Effective**: Cosmos DB already used for messages, no extra service needed  
✅ **Persistent**: All presence data survives restarts automatically  
✅ **Scalable**: Auto-scales with Cosmos DB throughput  
✅ **Query-Friendly**: Can run complex SQL queries on presence data  
✅ **No Expiration Issues**: Manual control over when users go offline  

## Trade-offs

⚠️ **Latency**: 10ms vs Redis 1ms (acceptable for presence)  
⚠️ **Manual TTL**: Need to run periodic cleanup vs Redis automatic expiration  
⚠️ **Write Cost**: Each heartbeat = 1 write operation (but cheap with low throughput)  

---

## Timeline of Events

```
User Opens App:
├─ 0ms: User logs in with Microsoft
├─ 500ms: WebSocket connected
├─ 600ms: POST /presence/broadcast { online: true }
├─ 650ms: Cosmos DB: userDoc.online = true
└─ 700ms: Broadcast to all clients: "User is online"

While Active:
├─ 30s: Heartbeat sent
├─ 60s: Heartbeat sent
├─ 90s: Heartbeat sent
└─ (continues every 30s)

Backend Cleanup (runs every 30s):
├─ Check: lastSeen < 60 seconds ago?
├─ If yes: Mark offline
└─ Broadcast: "User is offline"

User Closes Browser:
├─ 0ms: beforeunload fires
├─ 10ms: fetch /presence/broadcast { online: false, keepalive: true }
├─ 50ms: Cosmos DB: userDoc.online = false
└─ 100ms: Broadcast to all clients: "User is offline"
```

---

## Monitoring Queries

### Get all online users
```sql
SELECT c.userId, c.displayName, c.lastSeen 
FROM c 
WHERE c.online = true
```

### Get users who recently went offline
```sql
SELECT c.userId, c.displayName, c.lastSeen 
FROM c 
WHERE c.online = false 
  AND c.lastSeen > '2026-05-11T00:00:00Z'
ORDER BY c.lastSeen DESC
```

### Find stale connections (online but no heartbeat in 2+ minutes)
```sql
SELECT c.userId, c.displayName, c.lastSeen 
FROM c 
WHERE c.online = true 
  AND c.lastSeen < '2026-05-11T17:44:00Z'
```

---

## Configuration

**Heartbeat Interval**: 30 seconds  
**Inactive Threshold**: 60 seconds  
**Cleanup Check Interval**: 30 seconds  

Adjust in:
- Frontend: `src/chatService.js` (line 169)
- Backend: `src/functions/checkInactiveUsers.js` (line 19)

---

## Future Enhancements

🔄 **Presence History**: Store last 10 online/offline events  
📊 **Analytics**: Track daily active users, peak hours  
🌍 **Timezone**: Show "last seen" in user's timezone  
💤 **Away Status**: Detect idle vs active (mouse/keyboard events)  
📱 **Multi-Device**: Track which devices user is online from  

---

## Summary

✅ **We already have a Redis-like presence system using Cosmos DB!**

All online/offline status is:
- ✅ Stored persistently in Cosmos DB
- ✅ Updated in real-time via WebSocket broadcasts
- ✅ Synced across all connected clients
- ✅ Automatically cleaned up after inactivity
- ✅ Survives server restarts

**No additional setup needed - the system is already working!**
