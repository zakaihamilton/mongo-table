"use client";

import FolderTree from "../FolderTree";
import ChevronIcon from "./ChevronIcon";
import { collectionMatches } from "./treeFilter";

/**
 * Renders a collection tree node and its optional folder subtree.
 */
export default function CollectionNode({
  col,
  dbId,
  dbName,
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
  const colId = `${dbId}|col-${col.name}`;
  const folders = cache[colId] || [];
  const hasFolders = folders.length > 0;

  if (!collectionMatches(dbId, col.name, cache, term)) {
    return null;
  }

  const href = `/databases/${dbName}/${col.name}`;
  const isColActive = pathname === href;
  const expandedCol = Boolean(expanded[colId]);
  const showExpanded = expandedCol || Boolean(term);
  const currentFolder = isColActive ? activeFolder : null;

  const handleCollectionClick = () => {
    const isAtRoot = isColActive && !currentFolder;
    if (!isAtRoot) {
      localStorage.setItem("active_connection", connUri);
      onNavigate(href);
    }
    if (!cache[colId]) {
      onToggleExpand(colId, "collection", { uri: connUri, dbName, colName: col.name });
    }
  };

  const handleFolderSelect = (folder) => {
    if (!isColActive) {
      localStorage.setItem("active_connection", connUri);
    }
    const target = folder ? `${href}?folder=${folder}` : href;
    onNavigate(target);
  };

  return (
    <div className="tree-node">
      <div className={`node-label ${isColActive && !currentFolder ? "active" : ""}`}>
        <button
          type="button"
          className="node-label-control icon-toggle"
          aria-label={`${showExpanded ? "Collapse" : "Expand"} ${col.name} folders`}
          aria-expanded={showExpanded}
          disabled={!hasFolders || Boolean(term)}
          onClick={() =>
            onToggleExpand(colId, "collection", { uri: connUri, dbName, colName: col.name })
          }
          style={{
            width: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: "4px",
          }}
        >
          {hasFolders ? (
            <ChevronIcon expanded={showExpanded} />
          ) : (
            <span style={{ width: "10px" }} />
          )}
        </button>
        <button
          type="button"
          className="node-label-control collection-control"
          aria-current={isColActive && !currentFolder ? "page" : undefined}
          onClick={handleCollectionClick}
        >
          <span
            className="icon-folder"
            style={{ display: "flex", alignItems: "center", marginRight: "8px" }}
          >
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
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </span>
          <span className="text">{col.name}</span>
        </button>
      </div>

      {hasFolders && showExpanded && (
        <div className="node-children">
          {loading[colId] && <div className="loading-item">Loading folders...</div>}
          <FolderTree
            folders={folders}
            selectedFolder={isColActive ? currentFolder : null}
            onSelect={handleFolderSelect}
            showHeader={false}
            showAllRecords={false}
            searchTerm={term}
          />
        </div>
      )}
    </div>
  );
}
