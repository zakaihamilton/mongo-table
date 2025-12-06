'use client';

import React, { useState, useEffect } from 'react';
import './Pagination.css';

export default function Pagination({ page, limit, totalCount, onPageChange, onLimitChange }) {
    const [inputPage, setInputPage] = useState(page);

    useEffect(() => {
        setInputPage(page);
    }, [page]);

    const maxPage = Math.ceil(totalCount / limit) || 1;

    const handlePageSubmit = (e) => {
        e.preventDefault();
        const p = parseInt(inputPage);
        if (p >= 1 && p <= maxPage) {
            onPageChange(p);
        } else {
            setInputPage(page); // Reset if invalid
        }
    };

    return (
        <div className="pagination-footer">
            <div className="pagination-controls">
                <span className="pagination-label">Rows:</span>
                <select
                    value={limit}
                    onChange={(e) => onLimitChange(Number(e.target.value))}
                    className="pagination-select"
                >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                </select>
            </div>

            <div className="pagination-info">
                <span className="pagination-range">
                    {totalCount === 0 ? '0-0 of 0' : `${(page - 1) * limit + 1}-${Math.min(page * limit, totalCount)} of ${totalCount}`}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <button
                        className="pagination-btn"
                        disabled={page <= 1}
                        onClick={() => onPageChange(page - 1)}
                        title="Previous Page"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>

                    <form onSubmit={handlePageSubmit} className="pagination-input-form">
                        <input
                            className="pagination-input"
                            type="number"
                            value={inputPage}
                            onChange={(e) => setInputPage(e.target.value)}
                            min={1}
                            max={maxPage}
                        />
                    </form>

                    <button
                        className="pagination-btn"
                        disabled={page >= maxPage}
                        onClick={() => onPageChange(page + 1)}
                        title="Next Page"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
