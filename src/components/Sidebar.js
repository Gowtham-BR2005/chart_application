import React, { useState } from 'react';
import './Sidebar.css';

const icons = {
  search: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.605 3.605 0 1 1 0-7.21 3.605 3.605 0 0 1 0 7.21z"/>
    </svg>
  ),
  newChat: (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path d="M19.005 3.175H4.674C3.642 3.175 3 3.789 3 4.821V21.02l3.544-3.514h12.461c1.033 0 2.064-1.06 2.064-2.093V4.821c-.001-1.032-1.032-1.646-2.064-1.646zm-4.989 9.869H7.041V11.1h6.975v1.944zm3-4H7.041V7.1h9.975v1.944z"/>
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"/>
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>
  ),
};

export default function Sidebar({ contacts, selectedContact, onSelectContact, searchQuery, onSearch }) {
  const [searching, setSearching] = useState(false);

  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="my-avatar">
          <span>Me</span>
        </div>
        <div className="header-actions">
          <button className="icon-btn" title="New Chat">{icons.newChat}</button>
          <button className="icon-btn" title="Menu">{icons.menu}</button>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar">
        {searching ? (
          <button className="back-btn" onClick={() => { setSearching(false); onSearch(''); }}>
            {icons.close}
          </button>
        ) : (
          <span className="search-icon">{icons.search}</span>
        )}
        <input
          type="text"
          placeholder="Search or start new chat"
          value={searchQuery}
          onFocus={() => setSearching(true)}
          onChange={e => onSearch(e.target.value)}
        />
      </div>

      {/* Contact List */}
      <div className="contact-list">
        {contacts.length === 0 ? (
          <div className="no-results">No chats found</div>
        ) : (
          contacts.map(contact => (
            <div
              key={contact.id}
              className={`contact-item ${selectedContact?.id === contact.id ? 'active' : ''}`}
              onClick={() => onSelectContact(contact)}
            >
              <div className="contact-avatar" style={{ background: contact.avatarColor }}>
                <span>{contact.avatar}</span>
                {contact.online && <div className="online-dot" />}
              </div>
              <div className="contact-info">
                <div className="contact-top">
                  <span className="contact-name">{contact.name}</span>
                  <span className={`contact-time ${contact.unread > 0 ? 'unread-time' : ''}`}>
                    {contact.time}
                  </span>
                </div>
                <div className="contact-bottom">
                  <span className="contact-last-msg">{contact.lastMessage}</span>
                  {contact.unread > 0 && (
                    <span className="unread-badge">{contact.unread}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
