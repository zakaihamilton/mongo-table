"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { listDatabases, listCollections, getDistinctValues } from '@/actions/mongo';
import FolderTree from './FolderTree';
import './Sidebar.css';

export default function Sidebar() {
    const [connections, setConnections] = useState([]);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [expanded, setExpanded] = useState({}); // { [id]: boolean }
    const [cache, setCache] = useState({}); // { [connUri]: dbs[], [connUri+dbName]: cols[], [connUri+dbName+colName]: folders[] }
    const [loading, setLoading] = useState({}); // { [id]: boolean }
    const [term, setTerm] = useState('');
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        // Load theme from storage
        const storedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(storedTheme);
        document.documentElement.setAttribute('data-theme', storedTheme);

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

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    const toggleExpand = async (id, type, data) => {
        // data = { uri, dbName, colName }

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
                } else if (type === 'collection') {
                    // Fetch folders for this collection
                    const folders = await getDistinctValues(data.uri, data.dbName, data.colName, 'folder');
                    setCache(prev => ({ ...prev, [id]: folders }));
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
            <div className="sidebar-header">
                {!isCollapsed && (
                    <Link href="/" className="brand">
                        <img src="/app_icon.png" alt="Logo" style={{ width: '24px', height: '24px' }} />
                        <span>Mongo Table</span>
                    </Link>
                )}
                <div className="sidebar-header-actions">
                    {!isCollapsed && (
                        <button onClick={toggleTheme} className="sidebar-toggle" title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}>
                            {theme === 'dark' ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                            )}
                        </button>
                    )}
                    <button onClick={toggleSidebar} className="sidebar-toggle">
                        {isCollapsed ? (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        )}
                    </button>
                </div>
            </div>
            {!isCollapsed && (
                <>
                    <div className="sidebar-search-container">
                        <input
                            type="search"
                            placeholder="Filter..."
                            className="sidebar-search-input"
                            value={term}
                            onChange={e => setTerm(e.target.value)}
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
                                            <span className="icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {isExpanded(connId) || term ? (
                                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                ) : (
                                                    <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                )}
                                            </span>
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
                                                                <span className="icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    {isExpanded(dbId) || term ? (
                                                                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                                    ) : (
                                                                        <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                                    )}
                                                                </span>
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

                                                                        // Check folder data
                                                                        const folders = cache[colId] || [];
                                                                        const hasFolders = folders.length > 0;
                                                                        const expandedCol = isExpanded(colId);

                                                                        const currentFolder = isColActive ? searchParams.get('folder') : null;

                                                                        return (
                                                                            <div key={colId} className="tree-node">
                                                                                <div
                                                                                    className={`node-label ${isColActive && !currentFolder ? 'active' : ''}`}
                                                                                    onClick={(e) => {
                                                                                        // Navigate if not already there
                                                                                        if (!isColActive) {
                                                                                            localStorage.setItem('active_connection', conn.uri);
                                                                                            router.push(href);
                                                                                        }

                                                                                        // Try to fetch/expand if not cached OR if we know there are folders
                                                                                        // This fixes the bootstrapping issue where we wouldn't fetch because we didn't think there were folders
                                                                                        if (!cache[colId] || (cache[colId] && cache[colId].length > 0)) {
                                                                                            toggleExpand(colId, 'collection', { uri: conn.uri, dbName: db.name, colName: col.name });
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <span className="icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                                        {/* Show expand icon if has folders, else show file icon */}
                                                                                        {hasFolders ? (
                                                                                            (expandedCol || term) ? (
                                                                                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                                                            ) : (
                                                                                                <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                                                            )
                                                                                        ) : (
                                                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                                                                                        )}
                                                                                    </span>
                                                                                    <span className="text">{col.name}</span>
                                                                                </div>

                                                                                {hasFolders && (expandedCol || term) && (
                                                                                    <div className="node-children">
                                                                                        {loading[colId] && <div className="loading-item">Loading folders...</div>}
                                                                                        <FolderTree
                                                                                            folders={folders}
                                                                                            selectedFolder={isColActive ? currentFolder : null}
                                                                                            onSelect={(folder) => {
                                                                                                if (!isColActive) {
                                                                                                    localStorage.setItem('active_connection', conn.uri);
                                                                                                }
                                                                                                const target = folder ? `${href}?folder=${folder}` : href;
                                                                                                router.push(target);
                                                                                            }}
                                                                                            showHeader={false}
                                                                                            showAllRecords={false}
                                                                                        />
                                                                                    </div>
                                                                                )}

                                                                                {/* Auto-load folders logic if needed, but manual expand is safer for perf */}
                                                                            </div>
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

                    {pathname !== '/' && (
                        <div className="sidebar-footer">
                            <Link href="/" className="btn btn-sm btn-secondary">+ New Connection</Link>
                        </div>
                    )}
                </>
            )}
        </aside>
    );
}
