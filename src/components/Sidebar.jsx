"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { listDatabases, listCollections } from '@/actions/mongo';

export default function Sidebar() {
    const [connections, setConnections] = useState([]);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [expanded, setExpanded] = useState({}); // { [id]: boolean }
    const [cache, setCache] = useState({}); // { [connUri]: dbs[], [connUri+dbName]: cols[] }
    const [loading, setLoading] = useState({}); // { [id]: boolean }
    const [term, setTerm] = useState('');
    const pathname = usePathname();

    useEffect(() => {
        // Load connections from local storage
        const stored = localStorage.getItem('mongo_connections');
        if (stored) {
            setConnections(JSON.parse(stored));
        }

        // Listen for storage events to update list if changed elsewhere
        const handleStorage = () => {
            const updated = localStorage.getItem('mongo_connections');
            if (updated) setConnections(JSON.parse(updated));
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const toggleExpand = async (id, type, data) => {
        // data = { uri, dbName }

        // Toggle
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

        // If expanding and not cached, fetch children
        if (!expanded[id] && !cache[id]) {
            setLoading(prev => ({ ...prev, [id]: true }));
            try {
                if (type === 'connection') {
                    const res = await listDatabases(data.uri);
                    setCache(prev => ({ ...prev, [id]: res.databases }));
                } else if (type === 'database') {
                    const res = await listCollections(data.uri, data.dbName);
                    setCache(prev => ({ ...prev, [id]: res.collections }));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(prev => ({ ...prev, [id]: false }));
            }
        }
    };

    const isExpanded = (id) => !!expanded[id];
    const hits = (text) => !term || text.toLowerCase().includes(term.toLowerCase());

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    return (
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', padding: '1.5rem', height: '70px' }}>
                {!isCollapsed && (
                    <Link href="/" className="brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img src="/app_icon.png" alt="Logo" style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)' }} />
                        <span style={{ fontSize: '1.5rem', letterSpacing: '-0.025em', fontWeight: 800 }}>Mongo Table</span>
                    </Link>
                )}
                <button onClick={toggleSidebar} className="sidebar-toggle">
                    {isCollapsed ? '►' : '◄'}
                </button>
            </div>
            {!isCollapsed && (
                <>
                    <div style={{ padding: '0 1rem 1rem 1rem' }}>
                        <input
                            type="search"
                            placeholder="Filter..."
                            className="search-input"
                            value={term}
                            onChange={e => setTerm(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        />
                    </div>

                    <div className="sidebar-content" style={{ paddingTop: 0 }}>
                        <div className="tree">
                            {connections.length === 0 && (
                                <div className="empty-msg">No connections</div>
                            )}

                            {connections.map((conn, idx) => {
                                const connId = `conn-${idx}`;
                                const dbList = cache[connId] || [];

                                const matchingDBs = dbList.filter(db => {
                                    if (hits(db.name)) return true;
                                    const dbId = `${connId}|db-${db.name}`;
                                    const colList = cache[dbId] || [];
                                    return colList.some(c => hits(c.name));
                                });

                                const showConn = hits(conn.name) || matchingDBs.length > 0;
                                if (!showConn) return null;

                                return (
                                    <div key={connId} className="tree-node">
                                        <div
                                            className="node-label"
                                            onClick={() => toggleExpand(connId, 'connection', { uri: conn.uri })}
                                        >
                                            <span className="icon">{isExpanded(connId) || term ? '▼' : '▶'}</span>
                                            <span className="text">{conn.name}</span>
                                        </div>

                                        {(isExpanded(connId) || term) && (
                                            <div className="node-children">
                                                {loading[connId] && <div className="loading-item">Loading...</div>}

                                                {dbList.map((db) => {
                                                    const dbId = `${connId}|db-${db.name}`;
                                                    const colList = cache[dbId] || [];
                                                    const matchingCols = colList.filter(c => hits(c.name));

                                                    const showDb = hits(db.name) || matchingCols.length > 0;
                                                    if (!showDb) return null;

                                                    return (
                                                        <div key={dbId} className="tree-node">
                                                            <div
                                                                className="node-label"
                                                                onClick={() => toggleExpand(dbId, 'database', { uri: conn.uri, dbName: db.name })}
                                                            >
                                                                <span className="icon">{isExpanded(dbId) || term ? '▼' : '▶'}</span>
                                                                <span className="text">{db.name}</span>
                                                            </div>

                                                            {(isExpanded(dbId) || term) && (
                                                                <div className="node-children">
                                                                    {loading[dbId] && <div className="loading-item">Loading...</div>}

                                                                    {colList.map((col) => {
                                                                        if (!hits(col.name)) return null;

                                                                        const colId = `${dbId}|col-${col.name}`;
                                                                        const href = `/databases/${db.name}/${col.name}`;
                                                                        const isColActive = pathname === href;

                                                                        return (
                                                                            <Link
                                                                                key={colId}
                                                                                href={href}
                                                                                className={`tree-leaf ${isColActive ? 'active' : ''}`}
                                                                                onClick={() => {
                                                                                    localStorage.setItem('active_connection', conn.uri);
                                                                                }}
                                                                            >
                                                                                <span className="icon">📄</span>
                                                                                <span className="text">{col.name}</span>
                                                                            </Link>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="sidebar-footer">
                        <Link href="/" className="btn btn-sm btn-secondary">+ New Connection</Link>
                    </div>
                </>
            )}
        </aside>
    );
}
