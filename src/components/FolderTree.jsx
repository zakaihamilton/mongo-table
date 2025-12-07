'use client';

import { useState, useMemo } from 'react';
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

const FolderNode = ({ node, selectedPath, onSelect, depth = 0 }) => {
    const [isExpanded, setIsExpanded] = useState(true);
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

            {hasChildren && isExpanded && (
                <div className="folder-children">
                    {Object.keys(node.children).sort().map(key => (
                        <FolderNode
                            key={key}
                            node={node.children[key]}
                            selectedPath={selectedPath}
                            onSelect={onSelect}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function FolderTree({ folders = [], selectedFolder, onSelect }) {
    const tree = useMemo(() => buildTree(folders), [folders]);
    const hasFolders = folders.length > 0;

    if (!hasFolders) return null;

    return (
        <div className="folder-tree">
            <div className="folder-tree-header">
                Folders
            </div>
            <div className="folder-list">
                <div
                    className={`folder-label ${!selectedFolder ? 'active' : ''}`}
                    onClick={() => onSelect(null)}
                >
                    <div style={{ width: 16 }}></div>
                    <span className="folder-name">All Records</span>
                </div>
                {Object.keys(tree).sort().map(key => (
                    <FolderNode
                        key={key}
                        node={tree[key]}
                        selectedPath={selectedFolder}
                        onSelect={onSelect}
                    />
                ))}
            </div>
        </div>
    );
}
