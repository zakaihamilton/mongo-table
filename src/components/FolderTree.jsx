'use client';

import { useState, useMemo, useEffect } from 'react';
import './FolderTree.css';

// Helper to build tree from paths
const buildTree = (paths) => {
    const root = {};

    paths.forEach(path => {
        // Remove leading/trailing slashes and split
        const parts = path.split('/').filter(Boolean);
        let current = root;

        parts.forEach((part, index) => {
            if (!current[part]) {
                current[part] = {
                    name: part,
                    children: {},
                    fullPath: '/' + parts.slice(0, index + 1).join('/')
                };
            }
            current = current[part].children;
        });
    });

    return root;
};

// Helper to filter tree based on search term
const filterTree = (nodes, term, forceShow = false) => {
    if (!term && !forceShow) return nodes;

    const newNodes = {};

    Object.keys(nodes).forEach(key => {
        const node = nodes[key];
        // Safe string check
        const matches = forceShow || String(node.fullPath).toLowerCase().includes(term.toLowerCase());
        const shouldForceChildren = matches;

        const filteredChildren = filterTree(node.children, term, shouldForceChildren);
        const hasMatchingChildren = Object.keys(filteredChildren).length > 0;

        if (matches || hasMatchingChildren) {
            newNodes[key] = {
                ...node,
                children: filteredChildren
            };
        }
    });

    return newNodes;
};

const FolderNode = ({ node, selectedPath, onSelect, depth = 0, searchTerm }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    // Auto-expand if searching
    useEffect(() => {
        if (searchTerm) {
            setIsExpanded(true);
        }
    }, [searchTerm]);

    const hasChildren = Object.keys(node.children).length > 0;
    const isSelected = selectedPath === node.fullPath;

    const handleSelect = (e) => {
        e.stopPropagation();
        onSelect(node.fullPath);
    };

    const handleToggle = (e) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    return (
        <div className="folder-node">
            <div
                className={`folder-label ${isSelected ? 'active' : ''}`}
                onClick={handleSelect}
                style={{ paddingLeft: `${depth * 12 + 4}px` }}
            >
                <div
                    className="folder-toggle"
                    onClick={hasChildren ? handleToggle : undefined}
                    style={{ visibility: hasChildren ? 'visible' : 'hidden' }}
                >
                    {isExpanded ? (
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1L5 5L9 1" /></svg>
                    ) : (
                        <svg width="6" height="10" viewBox="0 0 6 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1L5 5L1 9" /></svg>
                    )}
                </div>
                <svg className="folder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
                <span className="folder-name">{node.name}</span>
            </div>

            {isExpanded && hasChildren && (
                <div className="folder-children">
                    {Object.keys(node.children).sort().map(key => (
                        <FolderNode
                            key={key}
                            node={node.children[key]}
                            selectedPath={selectedPath}
                            onSelect={onSelect}
                            depth={depth + 1}
                            searchTerm={searchTerm}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function FolderTree({
    folders = [],
    selectedFolder,
    onSelect,
    showHeader = true,
    showAllRecords = true,
    searchTerm = ''
}) {
    const tree = useMemo(() => buildTree(folders), [folders]);
    const filteredTree = useMemo(() => filterTree(tree, searchTerm), [tree, searchTerm]);
    const hasVisibleNodes = Object.keys(filteredTree).length > 0;
    const hasFolders = folders.length > 0;

    if (!hasFolders) return null;

    // If we have a search term but no matches, show message
    if (searchTerm && !hasVisibleNodes) {
        return <div className="folder-tree"><div style={{ padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No matching folders</div></div>;
    }

    return (
        <div className="folder-tree">
            {showHeader && (
                <div className="folder-header">
                    <span className="folder-title">Folders</span>
                </div>
            )}
            <div className="folder-list">
                {showAllRecords && !searchTerm && (
                    <div
                        className={`folder-label ${!selectedFolder ? 'active' : ''}`}
                        onClick={() => onSelect(null)}
                    >
                        <span className="folder-name">All Records</span>
                    </div>
                )}
                {Object.keys(filteredTree).sort().map(key => (
                    <FolderNode
                        key={key}
                        node={filteredTree[key]}
                        selectedPath={selectedFolder}
                        onSelect={onSelect}
                        searchTerm={searchTerm}
                    />
                ))}
            </div>
        </div>
    );
}
