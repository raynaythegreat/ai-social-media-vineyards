import React, { useState, useEffect } from 'react';

const REQUIRED_KEYS = [
  { key: 'OPENAI_API_KEY', label: 'OpenAI API Key' }
];

const buildInitialValues = () =>
  REQUIRED_KEYS.reduce((acc, field) => {
    acc[field.key] = '';
    return acc;
  }, {});

export default function Settings() {
  const [values, setValues] = useState(buildInitialValues);
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setError('');
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) {
        throw new Error('Unable to load settings');
      }
      const data = await res.json();
      setStatus(data);
      return data;
    } catch (err) {
      console.error(err);
      setError('Unable to fetch current settings.');
    }
  };

  const handleChange = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setError('');
    setMessage('');

    const payload = {};
    REQUIRED_KEYS.forEach(({ key }) => {
      const trimmed = (values[key] || '').trim();
      if (trimmed.length > 0) {
        payload[key] = trimmed;
      }
    });

    if (Object.keys(payload).length === 0) {
      setError('Enter at least one API key before saving.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errPayload = await res.json().catch(() => ({}));
        throw new Error(errPayload.error || 'Failed to save settings');
      }

      await res.json();
      setMessage('Settings saved successfully.');
      setValues(buildInitialValues());
      await fetchStatus();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <h2>API Key Configuration</h2>
      <p className="settings-subtitle">
        Store encrypted API keys securely so the platform can connect to the AI backend.
      </p>
      <div className="settings-grid">
        {REQUIRED_KEYS.map((field) => {
          const configured = status[field.key];
          return (
            <div key={field.key} className="settings-card">
              <div className="settings-card-header">
                <div>
                  <label htmlFor={field.key}>{field.label}</label>
                </div>
                <span
                  className={`status-indicator ${
                    configured ? 'status-success' : 'status-error'
                  }`}
                >
                  {configured ? '✅ Configured' : '❌ Missing'}
                </span>
              </div>
              <input
                id={field.key}
                type="password"
                placeholder="Enter API key"
                value={values[field.key]}
                onChange={(e) => handleChange(field.key, e.target.value)}
              />
            </div>
          );
        })}
      </div>

      {error && <div className="settings-message error">{error}</div>}
      {message && <div className="settings-message success">{message}</div>}

      <button
        className="save-settings-btn"
        onClick={handleSave}
        disabled={loading}
      >
        {loading ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}
