import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { connectWebSocket, findUser, sendMessage, getMessages, registerUser, findUserById, getRecentContacts, getOnlineUsers } from './chatService';
import { API_BASE } from './authConfig';
import './App.css';

// Feature flag: Set to true to enable backend connection
const ENABLE_BACKEND = false;

// Demo contacts for testing (used when backend is disabled)
const demoContacts = [
  {
    id: 1,
    userId: 'demo-user-1',
    name: 'Alice Johnson',
    avatar: 'AJ',
    avatarColor: '#00a884',
    lastMessage: 'Hey! How are you doing?',
    time: '10:30 AM',
    unread: 2,
    online: true,
  },
  {
    id: 2,
    userId: 'demo-user-2',
    name: 'Bob Smith',
    avatar: 'BS',
    avatarColor: '#5b5ea6',
    lastMessage: 'Check out this link!',
    time: '9:15 AM',
    unread: 0,
    online: false,
  },
  {
    id: 3,
    userId: 'demo-user-3',
    name: 'Team Project 🚀',
    avatar: 'TP',
    avatarColor: '#e91e63',
    lastMessage: 'Meeting at 3 PM today',
    time: 'Yesterday',
    unread: 5,
    online: false,
    isGroup: true,
  },
];

function App() {
  const [auth, setAuth] = useState(null); // { token, user }
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [backendError, setBackendError] = useState(!ENABLE_BACKEND);
  const [registering, setRegistering] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [userProfile, setUserProfile] = useState(null); // Full user profile from DB

  // Use ref to track selected contact for WebSocket handler (avoids stale closure)
  const selectedContactRef = React.useRef(selectedContact);
  React.useEffect(() => {
    selectedContactRef.current = selectedContact;
  }, [selectedContact]);

  // Send offline status when user closes browser/tab
  useEffect(() => {
    if (!auth || !ENABLE_BACKEND) return;

    const handleBeforeUnload = (e) => {
      console.log('🚪 User closing browser - sending offline status');

      // Use fetch with keepalive for reliable delivery even as page closes
      try {
        fetch(`${API_BASE}/presence/broadcast`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${auth.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ online: false }),
          keepalive: true // Important: keeps request alive after page closes
        }).catch(() => {
          // Silent fail - browser is closing
        });
      } catch (error) {
        console.error('Failed to send offline status:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [auth]);

  // Periodically check for inactive users AND refresh online status (every 10 seconds)
  // This catches users who close the app and marks them offline within 30-40 seconds
  useEffect(() => {
    if (!auth || !ENABLE_BACKEND || !registrationComplete) return;

    const checkInactiveAndRefreshOnline = async () => {
      try {
        // Check for inactive users (users who haven't sent heartbeat in 30s)
        const res = await fetch(`${API_BASE}/presence/check-inactive`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${auth.token}` }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.marked > 0) {
            console.log(`🔴 Marked ${data.marked} users offline (closed app or lost connection)`);
          }
        }

        // Refresh online users list to update UI
        const onlineUsersList = await getOnlineUsers(auth.token);
        if (onlineUsersList) {
          setContacts(prevContacts => {
            return prevContacts.map(c => {
              const wasOnline = c.online;
              const isOnline = onlineUsersList.some(u => u.userId === c.userId);

              if (wasOnline !== isOnline) {
                console.log(`🔄 ${c.name} is now ${isOnline ? '🟢 ONLINE' : '⚫ OFFLINE'} (${isOnline ? 'app open' : 'app closed'})`);
              }

              return {
                ...c,
                online: isOnline,
              };
            });
          });

          // Also update selected contact's status in chat header
          setSelectedContact(prev => {
            if (!prev) return prev;
            const isOnline = onlineUsersList.some(u => u.userId === prev.userId);
            if (prev.online !== isOnline) {
              console.log(`🔄 Chat header: ${prev.name} is ${isOnline ? '🟢 online' : '⚫ offline'}`);
              return { ...prev, online: isOnline };
            }
            return prev;
          });
        }
      } catch (error) {
        // Silent fail - not critical
      }
    };

    // Check immediately on mount
    checkInactiveAndRefreshOnline();

    // Then check every 10 seconds
    const interval = setInterval(checkInactiveAndRefreshOnline, 10000);

    return () => clearInterval(interval);
  }, [auth, registrationComplete]);

  // Step 1: After Microsoft login, check if user is registered in our backend
  useEffect(() => {
    if (!auth || !ENABLE_BACKEND) return;

    async function checkUserRegistration() {
      setRegistering(true);
      console.log('🔍 Checking if user is registered in backend...');

      try {
        // Check if user exists in our database
        const existingUser = await findUserById(auth.token);

        if (existingUser) {
          console.log('✅ User already registered:', existingUser);
          setUserProfile(existingUser); // Store full profile
          setRegistrationComplete(true);
          setBackendError(false);
        } else {
          // User not registered yet, auto-register with their Microsoft name
          console.log('📝 Auto-registering new user...');

          // Generate username from email or name with random suffix to avoid conflicts
          const baseUsername = auth.user.email?.split('@')[0] ||
                               auth.user.name?.replace(/\s+/g, '_').toLowerCase() ||
                               'user';

          // Add timestamp to make it unique
          const username = `${baseUsername}_${Date.now()}`;

          const registeredUser = await registerUser(auth.token, username);

          if (registeredUser) {
            console.log('✅ User registered successfully:', registeredUser);
            setUserProfile(registeredUser); // Store full profile
            setRegistrationComplete(true);
            setBackendError(false);
          } else {
            console.error('❌ Failed to register user');
            setBackendError(true);
          }
        }
      } catch (error) {
        console.error('❌ Error checking user registration:', error);
        setBackendError(true);
      } finally {
        setRegistering(false);
      }
    }

    checkUserRegistration();
  }, [auth]);

  // Step 2: After registration complete, load contacts and connect WebSocket (ONCE)
  useEffect(() => {
    if (!auth || !ENABLE_BACKEND || !registrationComplete) {
      return;
    }

    let isMounted = true;
    let socketInstance = null;

    const attemptConnection = async () => {
      // First, load recent contacts
      console.log('📋 Loading recent contacts...');
      try {
        const recentContacts = await getRecentContacts(auth.token);
        if (recentContacts && recentContacts.length > 0) {
          console.log(`✅ Loaded ${recentContacts.length} recent contacts`);

          const formattedContacts = recentContacts.map(c => {
            const displayName = c.displayName || c.username || 'Unknown';
            return {
              id: c.userId,
              userId: c.userId,
              name: displayName,
              avatar: displayName.slice(0, 2).toUpperCase(),
              avatarColor: '#00a884',
              lastMessage: c.lastMessage || 'Start a conversation',
              time: c.timestamp ? new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
              unread: 0,
              online: c.online || false,
            };
          });

          // DON'T set contacts yet - wait for online status sync first

          // Immediately sync online status before setting contacts
          try {
            console.log('🔄 Syncing online status from database...');
            const onlineUsersList = await getOnlineUsers(auth.token);

            if (onlineUsersList && onlineUsersList.length > 0) {
              console.log(`🟢 ${onlineUsersList.length} users currently online:`, onlineUsersList.map(u => u.username || u.userId));

              // Update formatted contacts with current online status
              const contactsWithOnlineStatus = formattedContacts.map(c => {
                const isOnline = onlineUsersList.some(u => u.userId === c.userId);
                if (isOnline) {
                  console.log(`✅ ${c.name} is ONLINE`);
                }
                return {
                  ...c,
                  online: isOnline,
                };
              });

              // Set contacts with correct online status
              setContacts(contactsWithOnlineStatus);
              console.log('📋 Contacts set with online status');
            } else {
              console.log('ℹ️ No users currently online');
              setContacts(formattedContacts);
            }
          } catch (error) {
            console.error('❌ Error syncing online status:', error);
            // Fallback: set contacts with DB status
            setContacts(formattedContacts);
          }
        } else {
          console.log('ℹ️ No recent contacts found');
        }
      } catch (error) {
        console.error('Error loading contacts:', error);
      }

      // Then connect WebSocket (ONCE - do not reconnect on every render)
      console.log('🔌 Connecting to WebSocket...');

      try {
        socketInstance = await connectWebSocket(auth.token, (incomingData) => {
          if (!isMounted) return;

          // Handle read receipts (blue tick notifications)
          if (incomingData.type === 'read') {
            console.log(`💙 Read receipt received!`);
            console.log(`   From userId: ${incomingData.userId}`);
            console.log(`   Read by: ${incomingData.readBy}`);

            // Mark ALL sent messages as read (regardless of which chat is open)
            // This is correct because the read receipt means "they read YOUR messages"
            console.log('💙 Marking ALL sent messages as READ (blue ticks)');
            setMessages(prevMessages => {
              const updated = prevMessages.map(m => {
                if (m.sent && m.status !== 'read') {
                  console.log('  ✓✓ → 💙 Message turned blue:', m.text);
                  return { ...m, status: 'read' }; // Turn blue!
                }
                return m;
              });
              return updated;
            });

            return; // Don't process as presence or message
          }

          // Handle presence updates (online/offline status)
          if (incomingData.type === 'presence') {
            console.log(`👤 Presence update: ${incomingData.userId} is ${incomingData.online ? 'online ✅' : 'offline ⚫'}`);

            setContacts(prevContacts => {
              // Check if contact exists
              const contactExists = prevContacts.some(c => c.userId === incomingData.userId);

              if (!contactExists) {
                console.log(`ℹ️ Presence update for ${incomingData.userId} - not in contact list yet`);
                return prevContacts;
              }

              // Update existing contact
              const updated = prevContacts.map(c => {
                if (c.userId === incomingData.userId) {
                  console.log(`✅ Updated ${c.name} to ${incomingData.online ? 'ONLINE' : 'OFFLINE'}`);
                  return {
                    ...c,
                    online: incomingData.online,
                  };
                }
                return c;
              });

              return updated;
            });

            // Update selected contact if it's the one whose status changed
            setSelectedContact(prev => {
              if (prev && prev.userId === incomingData.userId) {
                console.log(`✅ Updated chat header: ${prev.name} is ${incomingData.online ? 'ONLINE' : 'OFFLINE'}`);
                return {
                  ...prev,
                  online: incomingData.online,
                };
              }
              return prev;
            });

            return; // Don't process as a message
          }

          // Handle regular chat messages
          const incomingMsg = incomingData;
          console.log('📨 New message received:', incomingMsg);

          // IMPORTANT: Ignore messages sent by yourself (to prevent echo)
          if (incomingMsg.senderId === auth.user.userId) {
            console.log('🚫 Ignoring own message (already shown optimistically)');
            return;
          }

          // First, check if sender is in contacts, if not add them
          setContacts(prevContacts => {
            const existingContact = prevContacts.find(c =>
              c.userId === incomingMsg.senderId ||
              (incomingMsg.groupId && c.id === incomingMsg.groupId)
            );

            if (!existingContact && !incomingMsg.groupId) {
              // New contact - add to list
              console.log('👤 New contact from incoming message:', incomingMsg.senderName);
              const senderName = incomingMsg.senderName || 'Unknown User';
              const newContact = {
                id: incomingMsg.senderId,
                userId: incomingMsg.senderId,
                name: senderName,
                avatar: senderName.slice(0, 2).toUpperCase(),
                avatarColor: '#00a884',
                lastMessage: incomingMsg.content,
                time: 'Just now',
                unread: 1,
                online: true,
              };
              return [newContact, ...prevContacts];
            }

            // Update existing contact (for received messages only)
            return prevContacts.map(c => {
              const isMatch = incomingMsg.senderId === c.userId ||
                             (incomingMsg.groupId && incomingMsg.groupId === c.id);

              if (isMatch) {
                // Use ref to check if chat is currently open (not stale closure)
                const isCurrentlyViewing = selectedContactRef.current?.userId === c.userId;
                return {
                  ...c,
                  lastMessage: incomingMsg.content,
                  time: 'Just now',
                  unread: isCurrentlyViewing ? 0 : (c.unread || 0) + 1,
                };
              }
              return c;
            });
          });

          // Add incoming message to current chat if it matches
          setMessages(prevMessages => {
            // Use ref to get the CURRENT selected contact (not stale closure)
            const currentSelected = selectedContactRef.current;
            if (!currentSelected) return prevMessages;

            const isFromSelected =
              incomingMsg.senderId === currentSelected.userId ||
              incomingMsg.groupId === currentSelected.id;

            if (isFromSelected) {
              console.log('✅ Adding incoming message to current chat:', incomingMsg.content);

              // Add the new incoming message
              return [...prevMessages, {
                id: incomingMsg.id,
                text: incomingMsg.content,
                sent: false,
                time: new Date(incomingMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                sender: currentSelected.isGroup ? incomingMsg.senderName : undefined, // Only show sender in group chats
              }];
            }

            return prevMessages;
          });
        });

        if (isMounted) {
          if (socketInstance) {
            console.log('✅ WebSocket connected successfully');
            setBackendError(false);
          } else {
            console.warn('⚠️ WebSocket connection failed');
            setBackendError(true);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.warn('⚠️ Backend not available:', error);
          setBackendError(true);
        }
      }
    };

    attemptConnection();

    return () => {
      isMounted = false;
      // Clean up WebSocket when component unmounts
      if (socketInstance) {
        socketInstance.close();
      }
    };
  }, [auth, registrationComplete]); // Remove selectedContact from dependencies to prevent reconnecting

  // Initialize with demo contacts if backend is disabled
  useEffect(() => {
    if (auth && !ENABLE_BACKEND && contacts.length === 0) {
      console.log('ℹ️ Backend disabled - loading demo contacts');
      console.log('💡 To enable backend: Set ENABLE_BACKEND = true in App.js');
      setContacts(demoContacts);
    }
  }, [auth, contacts.length]);

  // Load messages when contact selected
  useEffect(() => {
    if (!auth || !selectedContact) return;

    if (!ENABLE_BACKEND) {
      setMessages([]);
      return;
    }

    async function load() {
      console.log('📥 Loading messages for:', selectedContact.name);

      try {
        const data = await getMessages(auth.token, {
          type: selectedContact.isGroup ? 'group' : 'direct',
          targetId: selectedContact.userId || selectedContact.id,
        });

        if (data && data.messages) {
          console.log(`✅ Loaded ${data.messages.length} messages`);
          console.log('🔍 Current user ID:', auth.user.userId);

          setMessages(data.messages.map(m => {
            const isSent = m.senderId === auth.user.userId;
            console.log(`📧 Message from ${m.senderId} - isSent: ${isSent} (current user: ${auth.user.userId})`);

            // Determine message status for sent messages
            let status = 'sent';
            if (isSent) {
              // Use backend readAt field if available (from Cosmos DB)
              if (m.readAt) {
                status = 'read'; // Blue double tick - message was read (stored in DB)
                console.log(`  💙 Message "${m.content.substring(0, 20)}..." - readAt: ${m.readAt} → BLUE TICKS`);
              } else if (selectedContact.online) {
                status = 'delivered'; // Double gray tick - recipient is online (delivered)
                console.log(`  ✓✓ Message "${m.content.substring(0, 20)}..." - delivered (online)`);
              } else {
                status = 'sent'; // Single gray tick - recipient is offline
                console.log(`  ✓ Message "${m.content.substring(0, 20)}..." - sent (offline)`);
              }
            }

            return {
              id: m.id,
              text: m.content,
              sent: isSent,
              status: isSent ? status : undefined,
              time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sender: selectedContact.isGroup ? m.senderName : undefined, // Only show sender name in group chats
            };
          }));

          // If chat is open, mark unread as 0
          setContacts(prev => prev.map(c =>
            c.id === selectedContact.id ? { ...c, unread: 0 } : c
          ));

          // Mark all messages from this contact as read (call backend)
          if (selectedContact.userId) {
            try {
              console.log(`📬 Marking messages from ${selectedContact.name} as read...`);
              const response = await fetch(`${API_BASE}/messages/mark-read`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${auth.token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  senderId: selectedContact.userId
                })
              });

              if (response.ok) {
                const result = await response.json();
                console.log(`✅ Marked ${result.markedCount} messages as read in database`);
              } else {
                console.error('❌ Failed to mark as read:', response.status);
              }
            } catch (error) {
              console.error('❌ Error marking as read:', error);
            }
          }
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        setMessages([]);
      }
    }

    load();
  }, [selectedContact, auth]);

  const handleSelectContact = (contact) => {
    console.log('👤 Selected contact:', contact.name);
    setSelectedContact(contact);
    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, unread: 0 } : c));
  };

  const handleSendMessage = async (text) => {
    if (!selectedContact || !text.trim()) return;

    console.log('📤 Sending message to:', selectedContact.name);

    const tempId = `temp-${Date.now()}`;
    const newMsg = {
      id: tempId,
      text,
      sent: true,
      status: 'sent', // Initial status: single tick (gray)
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Optimistically add message to UI
    setMessages(prev => [...prev, newMsg]);

    // Update contact's last message
    setContacts(prev => prev.map(c =>
      c.id === selectedContact.id
        ? { ...c, lastMessage: text, time: 'Just now' }
        : c
    ));

    // Send to backend
    if (ENABLE_BACKEND) {
      try {
        const result = await sendMessage(auth.token, {
          type: selectedContact.isGroup ? 'group' : 'direct',
          content: text,
          toUserId: selectedContact.userId,
          groupId: selectedContact.isGroup ? selectedContact.id : undefined,
        });

        if (result.error) {
          console.warn('⚠️ Message sent locally but backend sync failed');
        } else {
          console.log('✅ Message sent successfully');

          // Update message status to delivered if recipient is online
          if (selectedContact.online) {
            setMessages(prev => prev.map(m =>
              m.id === tempId ? { ...m, status: 'delivered', id: result.id || tempId } : m
            ));
          }
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);

    if (query.length < 2 || !ENABLE_BACKEND) return;

    console.log('🔍 Searching for user:', query);

    try {
      const user = await findUser(auth.token, query);

      // Don't add yourself to contacts
      if (user && user.userId === auth.user.userId) {
        console.log('ℹ️ Cannot add yourself as a contact');
        return;
      }

      if (user && !contacts.find(c => c.userId === user.userId)) {
        console.log('✅ User found:', user);

        const displayName = user.displayName || user.username || 'Unknown User';
        const newContact = {
          id: user.userId,
          userId: user.userId,
          name: displayName,
          avatar: displayName.slice(0, 2).toUpperCase(),
          avatarColor: '#00a884',
          lastMessage: 'Start a conversation',
          time: '',
          unread: 0,
          online: false,
        };

        setContacts(prev => [...prev, newContact]);

        // Clear search query after adding contact so they appear in the list
        setSearchQuery('');

        console.log('✅ Contact added to list');
      } else if (user && contacts.find(c => c.userId === user.userId)) {
        console.log('ℹ️ User already in contact list');
        // Clear search to show existing contact
        setSearchQuery('');
      } else if (!user) {
        console.log('❌ User not found');
      }
    } catch (error) {
      console.error('Error searching for user:', error);
    }
  };

  const handleUpdateProfile = async (updates) => {
    if (!ENABLE_BACKEND) return;

    console.log('📝 Updating profile:', updates);

    try {
      const res = await fetch(`${API_BASE}/users/username`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const data = await res.json();
      console.log('✅ Profile updated:', data.user);

      // Update both auth and userProfile state with new username
      setAuth(prev => ({
        ...prev,
        user: {
          ...prev.user,
          username: data.user.username
        }
      }));

      setUserProfile(prev => ({
        ...prev,
        username: data.user.username
      }));

      return data.user;
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      throw error;
    }
  };

  // Show loading during registration
  if (registering) {
    return (
      <div className="app" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
          <div style={{ fontSize: '18px', color: '#667781' }}>Setting up your account...</div>
        </div>
      </div>
    );
  }

  if (!auth) {
    return <Auth onAuthenticated={setAuth} />;
  }

  const filteredContacts = contacts.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app">
      {backendError && (
        <div style={{
          backgroundColor: '#fff3cd',
          color: '#856404',
          padding: '8px 16px',
          textAlign: 'center',
          fontSize: '13px',
          borderBottom: '1px solid #ffeaa7'
        }}>
          ⚠️ Backend not available - running in demo mode (messages not persisted)
        </div>
      )}
      <div className="app-container">
        <Sidebar
          contacts={filteredContacts}
          selectedContact={selectedContact}
          onSelectContact={handleSelectContact}
          searchQuery={searchQuery}
          onSearch={handleSearch}
          currentUser={userProfile || auth.user}
          onUpdateProfile={handleUpdateProfile}
        />
        <ChatWindow
          contact={selectedContact}
          messages={messages}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}

export default App;
