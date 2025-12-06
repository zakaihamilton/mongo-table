'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import './CollectionHeader.css';

export default function CollectionHeader({ dbName, colName, searchInput, onSearchChange, onExport, isExporting }) {
    const [showExportMenu, setShowExportMenu] = useState(false);
    const exportMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
                setShowExportMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleExportClick = (format) => {
        setShowExportMenu(false);
        onExport(format);
    };

    return (
        <div className="header">
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                <div className="breadcrumbs">
                    <Link href={`/databases/${dbName}`}>{dbName}</Link>
                    <span className="breadcrumbs-separator">/</span>
                    <span className="current-col">{colName}</span>
                </div>
            </div>

            <div className="search-container">
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchInput}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="header-search-input"
                />
            </div>

            <div className="export-container" ref={exportMenuRef}>
                <button
                    className="export-btn"
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    disabled={isExporting}
                >
                    {isExporting ? 'Exporting...' : 'Export'}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showExportMenu ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>

                {showExportMenu && (
                    <div className="export-menu">
                        <button className="export-item" onClick={() => handleExportClick('json')}>
                            JSON
                        </button>
                        <button className="export-item" onClick={() => handleExportClick('csv')}>
                            CSV
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
