import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import './App.css';

const initialContacts = [
  {
    id: 1,
    name: 'Ganesh ah',
    avatar: 'GA',
    avatarColor: '#00a884',
    lastMessage: 'is project completed?',
    time: '10:30 AM',
    unread: 2,
    online: true,
    messages: [
      { id: 1, text: 'Hey! How are you?', sent: false, time: '10:20 AM' },
      { id: 2, text: 'I am doing great! What about you?', sent: true, time: '10:22 AM' },
      { id: 3, text: 'Are you coming to the meeting tomorrow?', sent: false, time: '10:30 AM' },
    ],
  },
  {
    id: 2,
    name: 'Arun',
    avatar: 'AR',
    avatarColor: '#5b5ea6',
    lastMessage: 'Sent a photo',
    time: '9:15 AM',
    unread: 0,
    online: false,
    messages: [
      { id: 1, text: 'Check out this place!', sent: false, time: '9:10 AM' },
      { id: 2, text: '📸 Sent a photo', sent: false, time: '9:15 AM' },
      { id: 3, text: 'Wow, looks amazing!', sent: true, time: '9:18 AM' },
    ],
  },
  {
    id: 3,
    name: 'Team React Devs 🚀',
    avatar: 'TR',
    avatarColor: '#e91e63',
    lastMessage: 'Rahul: The build is done ✅',
    time: 'Yesterday',
    unread: 5,
    online: false,
    isGroup: true,
    messages: [
      { id: 1, text: 'Anyone fixed the navbar bug?', sent: false, sender: 'Rahul', time: 'Yesterday' },
      { id: 2, text: 'Working on it now...', sent: true, time: 'Yesterday' },
      { id: 3, text: 'The build is done ✅', sent: false, sender: 'Rahul', time: 'Yesterday' },
    ],
  },
  {
    id: 4,
    name: 'kain Aanto',
    avatar: 'KA',
    avatarColor: '#ff9800',
    lastMessage: 'Thanks a lot! 😊',
    time: 'Yesterday',
    unread: 0,
    online: true,
    messages: [
      { id: 1, text: 'Can you help me with the CSS issue?', sent: false, time: 'Yesterday' },
      { id: 2, text: 'Sure! Try using flexbox here.', sent: true, time: 'Yesterday' },
      { id: 3, text: 'Thanks a lot! 😊', sent: false, time: 'Yesterday' },
    ],
  },
  {
    id: 5,
    name: 'Danush',
    avatar: 'D',
    avatarColor: '#009688',
    lastMessage: 'See you at 7!',
    time: 'Mon',
    unread: 0,
    online: false,
    messages: [
      { id: 1, text: 'Are we still meeting tonight?', sent: true, time: 'Mon' },
      { id: 2, text: 'Yes of course!', sent: false, time: 'Mon' },
      { id: 3, text: 'See you at 7!', sent: false, time: 'Mon' },
    ],
  },
];

function App() {
  const [contacts, setContacts] = useState(initialContacts);
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    setContacts(prev =>
      prev.map(c => c.id === contact.id ? { ...c, unread: 0 } : c)
    );
  };

  const handleSendMessage = (text) => {
    if (!selectedContact || !text.trim()) return;
    const newMsg = {
      id: Date.now(),
      text,
      sent: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setContacts(prev =>
      prev.map(c =>
        c.id === selectedContact.id
          ? { ...c, messages: [...c.messages, newMsg], lastMessage: text, time: 'Just now' }
          : c
      )
    );
    setSelectedContact(prev => ({ ...prev, messages: [...prev.messages, newMsg] }));
  };

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
          onSearch={setSearchQuery}
        />
        <ChatWindow
          contact={selectedContact}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}

export default App;