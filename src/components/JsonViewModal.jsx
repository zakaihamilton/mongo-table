'use client';

import { useEffect } from 'react';
import React from 'react';
import dynamic from 'next/dynamic';
const ReactJson = dynamic(() => import('react-json-view'), { ssr: false });
import './JsonViewModal.css';

export default function JsonViewModal({ data, onClose }) {
    useEffect(() => {
        if (data) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [data]);

    if (!data) return null;

    const handleDownload = (e) => {
        e.stopPropagation();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `document_${data._id || 'record'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '0' }}>
                <div className="modal-header">
                    <h3>JSON View</h3>
                    <div style={{ position: 'absolute', right: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                            className="close-btn"
                            onClick={handleDownload}
                            title="Download JSON"
                            style={{ position: 'static' }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                        </button>
                        <button className="close-btn" onClick={onClose} style={{ position: 'static' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
                <div
                    className="json-container"
                    style={{ padding: '0', background: '#272822' }}
                >
                    <ReactJson
                        src={data}
                        theme="monokai"
                        collapsed={1}
                        displayDataTypes={false}
                        style={{ padding: '1rem', background: 'transparent' }}
                    />
                </div>
            </div>
        </div>
    );
}
