import React, { useState } from 'react';
import './UserProfile.css';

export default function UserProfile({ user, onClose, onUpdateProfile }) {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = async () => {
    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }

    if (username === user?.username) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await onUpdateProfile({ username: username.trim() });
      setSuccess('Username updated successfully!');
      setTimeout(() => {
        setSuccess('');
        setIsEditing(false);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to update username');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setUsername(user?.username || '');
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const initials = user?.displayName?.slice(0, 2).toUpperCase() ||
                   user?.username?.slice(0, 2).toUpperCase() ||
                   'ME';

  return (
    <div className="user-profile-overlay" onClick={onClose}>
      <div className="user-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="user-profile-header">
          <h2>My Profile</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="user-profile-content">
          {/* Avatar */}
          <div className="user-profile-avatar-section">
            <div className="user-profile-avatar-large">
              {initials}
            </div>
          </div>

          {/* Display Name (Read-only) */}
          <div className="user-profile-field">
            <label className="user-profile-label">Display Name</label>
            <div className="user-profile-value-readonly">
              {user?.displayName || 'Not set'}
            </div>
            <div className="user-profile-hint">Your name from Microsoft account</div>
          </div>

          {/* Username (Editable) */}
          <div className="user-profile-field">
            <label className="user-profile-label">Username</label>
            {isEditing ? (
              <input
                type="text"
                className="user-profile-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                autoFocus
              />
            ) : (
              <div className="user-profile-value">
                {user?.username || 'Not set'}
              </div>
            )}
            <div className="user-profile-hint">
              {isEditing ? 'This is how others will find you' : 'Your unique username'}
            </div>
          </div>

          {/* Email (Read-only) */}
          <div className="user-profile-field">
            <label className="user-profile-label">Email</label>
            <div className="user-profile-value-readonly">
              {user?.email || 'Not available'}
            </div>
            <div className="user-profile-hint">Your Microsoft email</div>
          </div>

          {/* User ID (Read-only) */}
          <div className="user-profile-field">
            <label className="user-profile-label">User ID</label>
            <div className="user-profile-value-readonly user-id">
              {user?.userId || 'Not available'}
            </div>
            <div className="user-profile-hint">Your unique identifier</div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="user-profile-message error">
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="user-profile-message success">
              ✅ {success}
            </div>
          )}

          {/* Action Buttons */}
          <div className="user-profile-actions">
            {isEditing ? (
              <>
                <button
                  className="btn-cancel"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="btn-save"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button
                className="btn-edit"
                onClick={() => setIsEditing(true)}
              >
                ✏️ Edit Username
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
