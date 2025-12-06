"use client";

import { useState, useEffect } from 'react';
import { testConnection } from '@/actions/mongo';
import { useRouter } from 'next/navigation';

export default function ConnectionManager() {
  const [connections, setConnections] = useState([]);
  const [newUri, setNewUri] = useState('');
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('mongo_connections');
    if (stored) {
      setConnections(JSON.parse(stored));
    }
  }, []);

  const saveConnections = (conns) => {
    setConnections(conns);
    localStorage.setItem('mongo_connections', JSON.stringify(conns));
  };

  const handleAdd = async () => {
    setError('');
    if (!newUri) {
      setError('URI is required');
      return;
    }
    const name = newName || newUri.split('@')[1] || 'New Connection';

    setLoading(true);
    const result = await testConnection(newUri);
    setLoading(false);

    if (result.success) {
      const newConn = { name, uri: newUri };
      saveConnections([...connections, newConn]);
      setNewUri('');
      setNewName('');
    } else {
      setError('Connection failed: ' + result.error);
    }
  };

  const handleRemove = (index) => {
    const newConns = connections.filter((_, i) => i !== index);
    saveConnections(newConns);
  };

  const connect = (uri) => {
    localStorage.setItem('active_connection', uri);
    router.push('/databases');
  };

  return (
    <div className="connection-manager">
      <h2>Connections</h2>

      {error && <div className="error">{error}</div>}

      <div className="add-connection">
        <input
          type="text"
          placeholder="MongoDB URI (mongodb://...)"
          value={newUri}
          onChange={(e) => setNewUri(e.target.value)}
        />
        <input
          type="text"
          placeholder="Name (optional)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleAdd} disabled={loading}>
          {loading ? 'Testing...' : 'Add Connection'}
        </button>
      </div>

      <div className="connection-list">
        {connections.length === 0 && <p className="text-muted" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No connections saved. Add one above.</p>}
        {connections.map((conn, idx) => (
          <div key={idx} className="connection-item">
            <div className="conn-info">
              <span className="conn-name">{conn.name}</span>
              <span className="conn-uri">{conn.uri}</span>
            </div>
            <div className="conn-actions" style={{
              marginTop: '1rem',
              display: 'flex',
              gap: '0.5rem',
              justifyContent: 'flex-start'
            }}>
              <button className="btn btn-secondary" onClick={() => connect(conn.uri)}>Connect</button>
              <button className="btn btn-danger" onClick={() => handleRemove(idx)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
