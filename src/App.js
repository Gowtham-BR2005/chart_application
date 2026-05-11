import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { connectWebSocket, findUser, sendMessage, getMessages } from './chatService';
import './App.css';

function App() {
  const [auth, setAuth] = useState(null); // { token, user }
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState([]);

  // After login — connect WebSocket
  useEffect(() => {
    if (!auth) return;
    connectWebSocket(auth.token, (incomingMsg) => {
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
        }
        return prev;
      });
    });
  }, [auth]);

  // Load messages when contact selected
  useEffect(() => {
    if (!auth || !selectedContact) return;
    async function load() {
      const data = await getMessages(auth.token, {
        type: selectedContact.isGroup ? 'group' : 'direct',
        targetId: selectedContact.userId || selectedContact.id,
      });
      if (data.messages) {
        setMessages(data.messages.map(m => ({
          id: m.id,
          text: m.content,
          sent: m.senderId === auth.user.userId,
          time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sender: m.senderName,
        })));
      }
    }
    load();
  }, [selectedContact, auth]);

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, unread: 0 } : c));
  };

  const handleSendMessage = async (text) => {
    if (!selectedContact || !text.trim()) return;

    const newMsg = {
      id: Date.now(),
      text,
      sent: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, newMsg]);

    await sendMessage(auth.token, {
      type: selectedContact.isGroup ? 'group' : 'direct',
      content: text,
      toUserId: selectedContact.userId,
      groupId: selectedContact.isGroup ? selectedContact.id : undefined,
    });

    setContacts(prev => prev.map(c =>
      c.id === selectedContact.id
        ? { ...c, lastMessage: text, time: 'Just now' }
        : c
    ));
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) return;
    const user = await findUser(auth.token, query);
    if (user && !contacts.find(c => c.userId === user.userId)) {
      setContacts(prev => [...prev, {
        id: user.userId,
        userId: user.userId,
        name: user.username,
        avatar: user.username.slice(0, 2).toUpperCase(),
        avatarColor: '#00a884',
        lastMessage: 'Start a conversation',
        time: '',
        unread: 0,
        online: false,
        messages: [],
      }]);
    }
  };

  if (!auth) {
    return <Auth onAuthenticated={setAuth} />;
  }

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app">
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