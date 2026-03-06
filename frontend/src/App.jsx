import React, { useState, useRef, useEffect } from 'react';
import Settings from './components/Settings.jsx';

const API_BASE = '/api/content';
const TABS = [
  { key: 'create', label: 'Generate Content' },
  { key: 'settings', label: 'Settings' }
];

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [eventType, setEventType] = useState('Harvest');
  const [mood, setMood] = useState('Warm');
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState(TABS[0].key);
  const fileInputRef = useRef(null);

  const eventTypes = ['Harvest', 'Tasting', 'Event', 'Bottling', 'Vineyard', 'Wine Release', 'General'];
  const moods = ['Warm', 'Elegant', 'Playful', 'Sophisticated', 'Rustic', 'Modern'];

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}?limit=20`);
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setGeneratedContent(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setGeneratedContent(null);
    }
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      alert('Please select an image first');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('eventType', eventType);
    formData.append('mood', mood);

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (data.success) {
        setGeneratedContent(data.content);
        loadHistory();
      } else {
        alert('Failed to generate content: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error generating content: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const copyAll = () => {
    if (!generatedContent) return;
    
    const all = `
📷 ${generatedContent.description}

📸 Instagram:
${generatedContent.instagram_caption}

📘 Facebook:
${generatedContent.facebook_caption}

🐦 Twitter:
${generatedContent.twitter_caption}

🏷️ Hashtags:
${JSON.parse(generatedContent.hashtags).map(h => `#${h}`).join(' ')}

💡 Story Ideas:
${JSON.parse(generatedContent.story_ideas).map((idea, i) => `${i + 1}. ${idea}`).join('\n')}
    `.trim();
    
    copyToClipboard(all);
  };

  const renderGenerateTab = () => (
    <>
      <div className="upload-section">
        <div 
          className="upload-area"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <div className="upload-icon">📸</div>
          <div className="upload-text">
            {selectedFile ? '✓ Image selected' : 'Click or drag to upload a photo'}
          </div>
          <div className="upload-hint">
            JPG, PNG, or WebP • Max 10MB
          </div>
        </div>

        <div className="options">
          <div className="option-group">
            <label>Event Type</label>
            <select value={eventType} onChange={(e) => setEventType(e.target.value)}>
              {eventTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="option-group">
            <label>Mood</label>
            <select value={mood} onChange={(e) => setMood(e.target.value)}>
              {moods.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <button 
          className="generate-btn"
          onClick={handleGenerate}
          disabled={!selectedFile || loading}
        >
          {loading ? '⏳ Generating content...' : '🚀 Generate Social Media Content'}
        </button>
      </div>

      {generatedContent && (
        <div className="content-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Generated Content</h2>
            <button className="copy-btn" onClick={copyAll}>📋 Copy All</button>
          </div>

          <div className="content-grid">
            <div className="image-preview">
              <img src={preview} alt="Uploaded" />
              <p style={{ padding: '15px', fontSize: '14px', color: '#666' }}>
                📷 {generatedContent.description}
              </p>
            </div>

            <div className="captions">
              <div className="caption-card instagram">
                <div className="platform-label">📸 Instagram</div>
                <div className="caption-text">{generatedContent.instagram_caption}</div>
                <button className="copy-btn" onClick={() => copyToClipboard(generatedContent.instagram_caption)}>
                  Copy
                </button>
              </div>

              <div className="caption-card facebook">
                <div className="platform-label">📘 Facebook</div>
                <div className="caption-text">{generatedContent.facebook_caption}</div>
                <button className="copy-btn" onClick={() => copyToClipboard(generatedContent.facebook_caption)}>
                  Copy
                </button>
              </div>

              <div className="caption-card twitter">
                <div className="platform-label">🐦 Twitter</div>
                <div className="caption-text">{generatedContent.twitter_caption}</div>
                <button className="copy-btn" onClick={() => copyToClipboard(generatedContent.twitter_caption)}>
                  Copy
                </button>
              </div>

              <div className="hashtags" style={{ padding: '15px', background: '#f8f8f8', borderRadius: '8px' }}>
                🏷️ {JSON.parse(generatedContent.hashtags).map(h => `#${h}`).join(' ')}
              </div>

              <div className="story-ideas">
                <h3>💡 Story Ideas</h3>
                <ul>
                  {JSON.parse(generatedContent.story_ideas).map((idea, i) => (
                    <li key={i}>{idea}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="history-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Recent Content</h2>
            <button 
              className="copy-btn"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? 'Hide' : 'Show'} History ({history.length})
            </button>
          </div>

          {showHistory && (
            <div className="history-grid">
              {history.map(item => (
                <div key={item.id} className="history-card">
                  <img src={item.imageUrl} alt={item.description} />
                  <div className="history-card-info">
                    <h4>{item.event_type}</h4>
                    <p>{item.description?.substring(0, 50)}...</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="app">
      <div className="header">
        <h1>🍷 Social Media Engine for Vineyards</h1>
        <p>Upload photos → AI generates captions, hashtags, and story ideas</p>
      </div>

      <div className="nav-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            type="button"
            className={`nav-tab ${activeTab === tab.key ? 'active-tab' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'create' ? renderGenerateTab() : <Settings />}
    </div>
  );
}

export default App;
