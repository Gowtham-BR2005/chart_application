import React, { useState, useRef, useEffect } from 'react';
import './ChatWindow.css';

const icons = {
  emoji: (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path d="M9.153 11.603c.795 0 1.44-.88 1.44-1.962s-.645-1.96-1.44-1.96c-.795 0-1.44.88-1.44 1.96s.645 1.962 1.44 1.962zm-3.246 1.94c-.086.86.082 1.717.512 2.418a4.9 4.9 0 0 0 4.281 2.453 4.9 4.9 0 0 0 4.281-2.453c.43-.701.598-1.558.512-2.418H5.907zm7.34-1.94c.795 0 1.44-.88 1.44-1.962s-.644-1.96-1.44-1.96c-.795 0-1.439.88-1.439 1.96s.644 1.962 1.44 1.962zm1.28 3.304A2.66 2.66 0 0 1 12 16.5a2.66 2.66 0 0 1-2.527-1.594H7.98a4.143 4.143 0 0 0 4.02 3.094 4.143 4.143 0 0 0 4.02-3.094h-1.493zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
    </svg>
  ),
  attach: (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path d="M1.816 15.556v.002c0 1.502.584 2.912 1.646 3.972s2.472 1.647 3.974 1.647a5.58 5.58 0 0 0 3.972-1.645l9.547-9.548c.769-.768 1.147-1.767 1.058-2.817-.079-.968-.548-1.927-1.319-2.698-1.594-1.592-4.068-1.994-5.517-.548L3.211 13.420c-.51.51-.805 1.24-.805 1.988 0 .74.292 1.436.814 1.96.51.51 1.24.807 1.988.807 .762 0 1.447-.29 1.963-.808l7.112-7.112c.159-.159.159-.418 0-.577s-.418-.159-.577 0l-7.112 7.112a1.22 1.22 0 0 1-.862.353 1.22 1.22 0 0 1-.868-.351 1.22 1.22 0 0 1-.351-.868c0-.32.124-.63.354-.86L14.396 5.2c1.147-1.147 3.048-.84 4.274.386.609.608.986 1.365 1.063 2.126.079.769-.204 1.469-.81 2.074L9.375 19.338a3.932 3.932 0 0 1-2.809 1.162 3.932 3.932 0 0 1-2.816-1.164 3.932 3.932 0 0 1-1.162-2.81 3.932 3.932 0 0 1 1.162-2.816L14.396 3.463c.159-.159.159-.418 0-.577s-.418-.159-.577 0L3.462 13.234a5.56 5.56 0 0 0-1.646 4.322z"/>
    </svg>
  ),
  mic: (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
    </svg>
  ),
  send: (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"/>
    </svg>
  ),
  video: (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path d="M15 8v8H5V8h10m1-2H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4V7c0-.55-.45-1-1-1z"/>
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
    </svg>
  ),
  more: (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"/>
    </svg>
  ),
  tick: (
    <svg viewBox="0 0 16 15" width="16" height="15" fill="currentColor">
      <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L2.926 8.290a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l2.074 2.009c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.511z"/>
    </svg>
  ),
};

const WelcomeScreen = () => (
  <div className="welcome-screen">
    <div className="welcome-content">
      <div className="welcome-logo">💬</div>
      <h2>Chat Application</h2>
      <p>Send and receive messages without keeping your phone online.<br/>
        you can use it on up to 4 linked devices and 1 phone at the same time.</p>
      <div className="welcome-badge">🔒 Your personal messages are not encrypted</div>
    </div>
  </div>
);

export default function ChatWindow({ contact, onSendMessage }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [contact?.messages]);

  if (!contact) return <WelcomeScreen />;

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-window">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-avatar" style={{ background: contact.avatarColor }}>
            {contact.avatar}
          </div>
          <div className="chat-header-text">
            <div className="chat-contact-name">{contact.name}</div>
            <div className="chat-status">
              {contact.online ? 'online' : contact.isGroup ? `${contact.messages.length} messages` : 'last seen recently'}
            </div>
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="icon-btn">{icons.video}</button>
          <button className="icon-btn">{icons.phone}</button>
          <button className="icon-btn">{icons.more}</button>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-area">
        <div className="messages-inner">
          {contact.messages.map((msg, i) => (
            <div key={msg.id} className={`message-row ${msg.sent ? 'sent' : 'received'}`}>
              <div className={`message-bubble ${msg.sent ? 'bubble-sent' : 'bubble-received'}`}>
                {msg.sender && (
                  <div className="message-sender">{msg.sender}</div>
                )}
                <div className="message-text">{msg.text}</div>
                <div className="message-meta">
                  <span className="message-time">{msg.time}</span>
                  {msg.sent && (
                    <span className="message-ticks">{icons.tick}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Bar */}
      <div className="chat-input-bar">
        <button className="icon-btn emoji-btn">{icons.emoji}</button>
        <button className="icon-btn attach-btn">{icons.attach}</button>
        <div className="input-wrapper">
          <input
            type="text"
            placeholder="Type a message"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        {input.trim() ? (
          <button className="send-btn" onClick={handleSend}>{icons.send}</button>
        ) : (
          <button className="icon-btn mic-btn">{icons.mic}</button>
        )}
      </div>
    </div>
  );
}
