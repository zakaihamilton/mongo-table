"use client";

import ChevronIcon from "./ChevronIcon";
import CollectionNode from "./CollectionNode";
import { databaseMatches } from "./treeFilter";

/**
 * Renders a database tree node and its matching collections.
 */
export default function DatabaseNode({
  db,
  connId,
  connUri,
  cache,
  expanded,
  loading,
  term,
  pathname,
  activeFolder,
  onNavigate,
  onToggleExpand,
}) {
  if (!databaseMatches(connId, db.name, cache, term)) {
    return null;
  }

  const dbId = `${connId}|db-${db.name}`;
  const colList = cache[dbId] || [];
  const showExpanded = Boolean(expanded[dbId]) || Boolean(term);

  return (
    <div className="tree-node">
      <button
        type="button"
        aria-expanded={showExpanded}
        className="node-label"
        onClick={() => onToggleExpand(dbId, "database", { uri: connUri, dbName: db.name })}
      >
        <span
          className="icon"
          style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <ChevronIcon expanded={showExpanded} />
        </span>
        <span className="text">{db.name}</span>
      </button>
      {showExpanded && (
        <div className="node-children">
          {loading[dbId] && <div className="loading-item">Loading...</div>}
          {colList.map((col) => (
            <CollectionNode
              key={`${dbId}|col-${col.name}`}
              col={col}
              dbId={dbId}
              dbName={db.name}
              connUri={connUri}
              cache={cache}
              expanded={expanded}
              loading={loading}
              term={term}
              pathname={pathname}
              activeFolder={activeFolder}
              onNavigate={onNavigate}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}
