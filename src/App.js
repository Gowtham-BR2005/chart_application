import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { connectWebSocket, findUser, sendMessage, getMessages, registerUser, findUserById, getRecentContacts, getOnlineUsers } from './chatService';
import { API_BASE } from './authConfig';
import './App.css';

// Feature flag: Set to true to enable backend connection
const ENABLE_BACKEND = true;

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

  // Periodically check for inactive users (every 30 seconds)
  useEffect(() => {
    if (!auth || !ENABLE_BACKEND || !registrationComplete) return;

    const checkInactive = async () => {
      try {
        const res = await fetch(`${API_BASE}/presence/check-inactive`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${auth.token}` }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.marked > 0) {
            console.log(`🔴 Marked ${data.marked} inactive users as offline`);
          }
        }
      } catch (error) {
        // Silent fail - not critical
      }
    };

    // Check immediately
    checkInactive();

    // Then check every 30 seconds
    const interval = setInterval(checkInactive, 30000);

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
          setRegistrationComplete(true);
          setBackendError(false);
        } else {
          // User not registered yet, auto-register with their Microsoft name
          console.log('📝 Auto-registering new user...');

          // Generate username from email or name
          const username = auth.user.email?.split('@')[0] ||
                          auth.user.name?.replace(/\s+/g, '_').toLowerCase() ||
                          'user_' + Date.now();

          const registeredUser = await registerUser(auth.token, username);

          if (registeredUser) {
            console.log('✅ User registered successfully:', registeredUser);
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

  // Step 2: After registration complete, load contacts and connect WebSocket
  useEffect(() => {
    if (!auth || !ENABLE_BACKEND || !registrationComplete) {
      return;
    }

    let isMounted = true;

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

          setContacts(formattedContacts);

          // Sync online status after loading contacts
          try {
            const onlineUsersList = await getOnlineUsers(auth.token);
            if (onlineUsersList && onlineUsersList.length > 0) {
              console.log(`🟢 ${onlineUsersList.length} users currently online`);

              setContacts(prevContacts => {
                return prevContacts.map(c => {
                  const isOnline = onlineUsersList.some(u => u.userId === c.userId);
                  if (isOnline && !c.online) {
                    console.log(`✅ Synced: ${c.name} is ONLINE`);
                  }
                  return {
                    ...c,
                    online: isOnline,
                  };
                });
              });
            }
          } catch (error) {
            console.error('Error syncing online status:', error);
          }
        } else {
          console.log('ℹ️ No recent contacts found');
        }
      } catch (error) {
        console.error('Error loading contacts:', error);
      }

      // Then connect WebSocket
      console.log('🔌 Connecting to WebSocket...');

      try {
        const socket = await connectWebSocket(auth.token, (incomingData) => {
          if (!isMounted) return;

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

            // Update existing contact (keep current online status from presence)
            return prevContacts.map(c => {
              const isMatch = incomingMsg.senderId === c.userId ||
                             (incomingMsg.groupId && incomingMsg.groupId === c.id);

              if (isMatch) {
                return {
                  ...c,
                  lastMessage: incomingMsg.content,
                  time: 'Just now',
                  unread: selectedContact?.id === c.id ? 0 : (c.unread || 0) + 1,
                  // Don't change online status here - it's managed by presence updates
                };
              }
              return c;
            });
          });

          // Add incoming message to current chat if it matches
          setSelectedContact(prev => {
            if (!prev) return prev;

            const isFromSelected =
              incomingMsg.senderId === prev.userId ||
              incomingMsg.groupId === prev.id;

            if (isFromSelected) {
              setMessages(m => [...m, {
                id: incomingMsg.id,
                text: incomingMsg.content,
                sent: false,
                time: new Date(incomingMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                sender: incomingMsg.senderName,
              }]);

              // Update name if needed, but keep online status from presence
              return {
                ...prev,
                name: incomingMsg.senderName || prev.name,
              };
            }

            return prev;
          });
        });

        if (isMounted) {
          if (socket) {
            console.log('✅ WebSocket connected');
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
    };
  }, [auth, registrationComplete, selectedContact]);

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

          setMessages(data.messages.map(m => ({
            id: m.id,
            text: m.content,
            sent: m.senderId === auth.user.userId,
            time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sender: m.senderName,
          })));
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

    const newMsg = {
      id: Date.now(),
      text,
      sent: true,
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
          currentUser={auth.user}
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
