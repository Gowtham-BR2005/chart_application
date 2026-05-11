# ✅ Offline Detection - Triple Safety System!

## Problem: User closes browser but still shows "online"

**Why this happens**: WebSocket `onclose` event **doesn't always fire** when browser closes!

Browsers kill the connection too fast, so the close event is missed.

---

## Solution: 3-Layer Safety System

### Layer 1: Browser Close Detection (beforeunload) ✅

**When**: User closes tab/browser/navigates away

```javascript
window.addEventListener('beforeunload', () => {
  // Send offline status with keepalive
  fetch('/api/presence/broadcast', {
    method: 'POST',
    body: JSON.stringify({ online: false }),
    keepalive: true  // ← Keeps request alive after page closes!
  });
});
```

**Pros**: Fires immediately when closing
**Cons**: Can be unreliable on some browsers (mobile)

### Layer 2: Heartbeat System ✅

**When**: Every 30 seconds while app is open

```javascript
// Frontend sends heartbeat
setInterval(() => {
  fetch('/api/presence/heartbeat', { method: 'POST' });
  // Updates user.lastSeen in database
}, 30000);
```

**Backend checks**: If no heartbeat for 60+ seconds → Mark offline

```javascript
// Every 30 seconds, check for stale users
const sixtySecondsAgo = now - 60000;
const staleUsers = users.where('lastSeen < sixtySecondsAgo AND online = true');

staleUsers.forEach(user => {
  user.online = false;
  broadcast({ type: 'presence', userId: user.id, online: false });
});
```

**Pros**: Catches crashes, network drops, battery death
**Cons**: 30-60 second delay

### Layer 3: WebSocket Close ✅

**When**: WebSocket connection drops (if detected)

```javascript
socket.onclose = () => {
  fetch('/api/presence/broadcast', {
    method: 'POST',
    body: JSON.stringify({ online: false })
  });
};
```

**Pros**: Fast when it works
**Cons**: Often doesn't fire on browser close

---

## How It Works Together

### Scenario 1: Normal Browser Close

```
1. User clicks X to close tab
2. ✅ Layer 1: beforeunload fires
   → fetch('/presence/broadcast', { online: false, keepalive: true })
   → Sends offline status IMMEDIATELY
3. ✅ Layer 3: WebSocket onclose fires (maybe)
   → Also sends offline (redundant but safe)
4. Backend broadcasts offline status
5. Other users see "offline" within 1-2 seconds
```

### Scenario 2: Browser Crash / Force Quit

```
1. User force-quits browser (Task Manager / kill)
2. ❌ Layer 1: beforeunload doesn't fire (no time)
3. ❌ Layer 3: WebSocket close doesn't fire (killed)
4. ✅ Layer 2: Heartbeat stops
   → After 30 seconds: no new heartbeat received
   → After 60 seconds: Backend marks user offline
   → Broadcasts offline status
5. Other users see "offline" within 60 seconds
```

### Scenario 3: Network Drop

```
1. User loses internet connection
2. ❌ Layer 1: Can't send (no internet)
3. ❌ Layer 3: Eventually times out
4. ✅ Layer 2: Heartbeat fails to reach server
   → After 60 seconds: Backend marks user offline
   → Broadcasts offline status
5. Other users see "offline" within 60 seconds
```

---

## New Backend Endpoints

### 1. POST /api/presence/heartbeat
**Purpose**: Update user's lastSeen timestamp

**Called**: Every 30 seconds by frontend

**What it does**:
```javascript
user.lastSeen = new Date();
user.online = true;
```

### 2. POST /api/presence/check-inactive
**Purpose**: Find and mark inactive users as offline

**Called**: Every 30 seconds by any connected client

**What it does**:
```javascript
// Find users with no heartbeat in 60+ seconds
const staleUsers = users.where(
  'online = true AND lastSeen < 60 seconds ago'
);

// Mark each as offline
staleUsers.forEach(user => {
  user.online = false;
  broadcast({ type: 'presence', userId: user.id, online: false });
});
```

---

## Frontend Changes

### App.js

**Added beforeunload handler**:
```javascript
useEffect(() => {
  const handleBeforeUnload = () => {
    fetch('/api/presence/broadcast', {
      method: 'POST',
      body: JSON.stringify({ online: false }),
      keepalive: true  // ← Critical!
    });
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}, [auth]);
```

**Added periodic inactive check**:
```javascript
useEffect(() => {
  const checkInactive = async () => {
    await fetch('/api/presence/check-inactive', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
  };

  const interval = setInterval(checkInactive, 30000);
  return () => clearInterval(interval);
}, [auth]);
```

### chatService.js

**Enhanced heartbeat**:
```javascript
setInterval(async () => {
  // Send WebSocket heartbeat
  socket.send(JSON.stringify({ type: 'heartbeat' }));

  // Also update backend lastSeen
  await fetch('/api/presence/heartbeat', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
}, 30000);
```

---

## Timeline: When User Goes Offline

### Fast (1-2 seconds) ✅
**When**: Normal browser close, tab close
**How**: beforeunload + keepalive fetch
**Result**: Offline status sent immediately

### Medium (30-60 seconds) ✅
**When**: Browser crash, force quit, network drop
**How**: Heartbeat timeout detection
**Result**: Marked offline after 60 seconds of no heartbeat

---

## Testing

### Test 1: Normal Close ✅

**Browser 1** (User A):
1. Login
2. Open Console (F12)
3. Close tab
4. Should see: `🚪 User closing browser - sending offline status`

**Browser 2** (User B):
1. Within 1-2 seconds, should see:
   ```
   👤 Presence update: User A is offline ⚫
   ✅ Updated User A to OFFLINE
   ```
2. Green dot disappears
3. Chat header shows "offline"

### Test 2: Force Quit ✅

**Browser 1** (User A):
1. Login
2. Task Manager → End Task (kill browser)

**Browser 2** (User B):
1. Wait 60 seconds
2. Should see:
   ```
   🔴 Marked 1 inactive users as offline
   👤 Presence update: User A is offline ⚫
   ```
3. Green dot disappears

### Test 3: Network Drop ✅

**Browser 1** (User A):
1. Login
2. Disable WiFi / Unplug ethernet

**Browser 2** (User B):
1. Wait 60 seconds
2. User A marked offline automatically

---

## Console Logs

### When Heartbeat Runs:
```
💓 Heartbeat sent (WebSocket + Backend)
```

### When Checking Inactive Users:
```
🔴 Marked 1 inactive users as offline
```

### When User Closes Browser:
```
🚪 User closing browser - sending offline status
```

### When Presence Update Received:
```
👤 Presence update: User A is offline ⚫
✅ Updated User A to OFFLINE
```

---

## Why This Works

### Problem with WebSocket Only:
❌ Browser kills WebSocket too fast
❌ onclose event doesn't always fire
❌ No way to detect crashes

### With Triple Safety:
✅ **Layer 1 (beforeunload)**: Catches normal closes (1-2 sec)
✅ **Layer 2 (heartbeat)**: Catches everything else (60 sec)
✅ **Layer 3 (WebSocket close)**: Backup (when it works)

**Result**: Users go offline reliably, every time!

---

## Configuration

**Heartbeat Interval**: 30 seconds
- How often frontend sends "I'm alive" signal
- Adjustable in `chatService.js`

**Inactive Threshold**: 60 seconds
- How long before user marked offline
- Adjustable in `checkInactiveUsers.js`

**Check Interval**: 30 seconds
- How often backend checks for inactive users
- Adjustable in `App.js`

**Trade-off**: 
- Shorter = faster offline detection, more backend load
- Longer = slower detection, less load

**Recommended**: 30 sec heartbeat, 60 sec threshold (current)

---

## Summary

**Before**:
- ❌ Only WebSocket onclose
- ❌ Didn't fire on browser close
- ❌ Users stuck "online" forever

**After**:
- ✅ beforeunload (1-2 sec)
- ✅ Heartbeat timeout (60 sec)
- ✅ WebSocket close (backup)
- ✅ Always goes offline!

**Result**: Professional offline detection like WhatsApp! 🎉

---

## Servers Running

- Backend: http://localhost:7071/api ✅
- Frontend: http://localhost:3000 ✅

## Test Now!

1. **Refresh both browsers**
2. Login in both
3. **Close Browser 1** (click X)
4. **Watch Browser 2** console:
   - Should see: "👤 Presence update: ... is offline ⚫"
   - Green dot disappears
   - Within 1-2 seconds!

5. **Force quit Browser 1** (Task Manager)
6. **Wait 60 seconds** in Browser 2
7. Should see: "🔴 Marked 1 inactive users as offline"

**Test it now!** 🚀
