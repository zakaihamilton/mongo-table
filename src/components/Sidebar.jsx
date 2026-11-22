"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getDistinctValues, listCollections, listDatabases } from "@/actions/mongo";
import ChevronIcon from "./Sidebar/ChevronIcon";
import DatabaseNode from "./Sidebar/DatabaseNode";
import { databaseMatches, matchesTerm } from "./Sidebar/treeFilter";
import "./Sidebar.css";

export default function Sidebar() {
  const [connections, setConnections] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expanded, setExpanded] = useState({}); // { [id]: boolean }
  const [cache, setCache] = useState({}); // { [connUri]: dbs[], [connUri+dbName]: cols[], [connUri+dbName+colName]: folders[] }
  const [loading, setLoading] = useState({}); // { [id]: boolean }
  const [term, setTerm] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    // Load theme from storage
    const storedTheme = localStorage.getItem("theme") || "dark";
    setTheme(storedTheme);
    document.documentElement.setAttribute("data-theme", storedTheme);

    // Load connections from local storage
    const stored = localStorage.getItem("mongo_connections");
    if (stored) {
      setConnections(JSON.parse(stored));
    }

    // Listen for storage events to update list if changed elsewhere
    const handleStorage = () => {
      const updated = localStorage.getItem("mongo_connections");
      if (updated) setConnections(JSON.parse(updated));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const toggleExpand = async (id, type, data) => {
    // data = { uri, dbName, colName }

    // Toggle
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

    // If expanding and not cached, fetch children
    if (!expanded[id] && !cache[id]) {
      setLoading((prev) => ({ ...prev, [id]: true }));
      try {
        if (type === "connection") {
          const res = await listDatabases(data.uri);
          setCache((prev) => ({ ...prev, [id]: res.databases }));
        } else if (type === "database") {
          const res = await listCollections(data.uri, data.dbName);
          setCache((prev) => ({ ...prev, [id]: res.collections }));
        } else if (type === "collection") {
          // Fetch folders for this collection
          const folders = await getDistinctValues(data.uri, data.dbName, data.colName, "folder");
          setCache((prev) => ({ ...prev, [id]: folders }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading((prev) => ({ ...prev, [id]: false }));
      }
    }
  };

  const isExpanded = (id) => !!expanded[id];
  const activeFolder = searchParams.get("folder");
  const handleNavigate = (target) => router.push(target);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        {!isCollapsed && (
          <Link href="/" className="brand">
            <Image src="/app_icon.png" alt="Logo" width={48} height={48} />
            <span>Mongo Table</span>
          </Link>
        )}
        <div className="sidebar-header-actions">
          {!isCollapsed && (
            <button
              type="button"
              onClick={toggleTheme}
              className="sidebar-toggle"
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
            >
              {theme === "dark" ? (
                <svg
                  aria-hidden="true"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg
                  aria-hidden="true"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          )}
          <button type="button" onClick={toggleSidebar} className="sidebar-toggle">
            {isCollapsed ? (
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 12L10 8L6 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 12L6 8L10 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
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
              onChange={(e) => setTerm(e.target.value)}
            />
          </div>

          <div className="sidebar-content" style={{ paddingTop: 0 }}>
            <div className="tree">
              {connections.length === 0 && <div className="empty-msg">No connections</div>}

              {connections.map((conn, idx) => {
                const connId = `conn-${idx}`;
                const dbList = cache[connId] || [];
                const showConn =
                  matchesTerm(conn.name, term) ||
                  dbList.some((db) => databaseMatches(connId, db.name, cache, term));
                if (!showConn) return null;

                const connExpanded = isExpanded(connId) || Boolean(term);

                return (
                  <div key={connId} className="tree-node">
                    <button
                      type="button"
                      aria-expanded={connExpanded}
                      className="node-label"
                      onClick={() => toggleExpand(connId, "connection", { uri: conn.uri })}
                    >
                      <span
                        className="icon"
                        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <ChevronIcon expanded={connExpanded} />
                      </span>
                      <span className="text">{conn.name}</span>
                    </button>

                    {connExpanded && (
                      <div className="node-children">
                        {loading[connId] && <div className="loading-item">Loading...</div>}
                        {dbList.map((db) => (
                          <DatabaseNode
                            key={`${connId}|db-${db.name}`}
                            db={db}
                            connId={connId}
                            connUri={conn.uri}
                            cache={cache}
                            expanded={expanded}
                            loading={loading}
                            term={term}
                            pathname={pathname}
                            activeFolder={activeFolder}
                            onNavigate={handleNavigate}
                            onToggleExpand={toggleExpand}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {pathname !== "/" && (
            <div className="sidebar-footer">
              <Link href="/" className="btn btn-sm btn-secondary">
                + New Connection
              </Link>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
