'use client';

import React from 'react';
import './CollectionTable.css';

export default function CollectionTable({ documents, columns, sort, onSort, onViewJson }) {
    if (!documents || documents.length === 0) {
        return <div className="empty-msg">No documents found</div>;
    }

    return (
        <div className="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th style={{ width: '50px', borderRadius: 0 }}></th>
                        {columns.map(col => (
                            <th key={col} onClick={() => onSort(col)} className="clickable-th" style={{ borderRadius: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {col}
                                    {sort.field === col && (
                                        sort.dir === 'asc'
                                            ? <svg width="8" height="4" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(180deg)' }}><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            : <svg width="8" height="4" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {documents.map((doc, idx) => (
                        <tr key={doc._id || idx}>
                            <td style={{ textAlign: 'center' }}>
                                <button
                                    className="icon-btn"
                                    onClick={() => onViewJson(doc)}
                                    title="View Full Record"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                </button>
                            </td>
                            {columns.map(col => {
                                const val = doc[col];
                                if (val === undefined || val === null) {
                                    return <td key={col}></td>;
                                }
                                const isComplex = typeof val === 'object' && val !== null;
                                return (
                                    <td key={col}>
                                        {isComplex ? (
                                            <button className="view-json-btn" onClick={() => onViewJson(val)}>
                                                {Array.isArray(val) ? '[ ]' : '{ }'}
                                            </button>
                                        ) : (
                                            <span title={String(val)}>{String(val).substring(0, 50)}{String(val).length > 50 ? '...' : ''}</span>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
