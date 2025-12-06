"use client";

import { useEffect, useState, use } from 'react';
import { getDocuments, getAllDocuments } from '@/actions/mongo';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import JSZip from 'jszip';

// Dynamically import ReactJson to avoid SSR issues
const ReactJson = dynamic(() => import('react-json-view'), { ssr: false });

export default function DocumentList({ params }) {
    const unwrappedParams = use(params);
    const { db: dbName, collection: colName } = unwrappedParams;

    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [inputPage, setInputPage] = useState(1);

    useEffect(() => {
        setInputPage(page);
    }, [page]);

    const handlePageSubmit = (e) => {
        e.preventDefault();
        const p = parseInt(inputPage);
        if (p >= 1 && p <= Math.ceil(totalCount / limit)) {
            setPage(p);
        } else {
            setInputPage(page); // Reset if invalid
        }
    };
    const [totalCount, setTotalCount] = useState(0);
    const [sort, setSort] = useState({ field: undefined, dir: 'asc' });

    // Split search state: `searchInput` for UI, `query` for fetching
    const [searchInput, setSearchInput] = useState('');
    const [query, setQuery] = useState('');

    // We can rely on 'query' changes to trigger fetch, no need for extra trigger if logic is clean.
    // However, if we want to force re-fetch on same query, we might need a trigger or just rely on other deps.
    // Let's rely on 'query' update.

    const [exporting, setExporting] = useState(false);

    // For Modal
    const [selectedDoc, setSelectedDoc] = useState(null);

    const router = useRouter();

    useEffect(() => {
        const uri = localStorage.getItem('active_connection');
        if (!uri) {
            router.push('/');
            return;
        }

        setLoading(true);
        // Use 'query' here instead of 'searchInput'
        getDocuments(uri, dbName, colName, page, limit, sort.field, sort.dir, query)
            .then(res => {
                setDocuments(res.documents);
                setTotalCount(res.totalCount);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [dbName, colName, page, limit, sort, query, router]);

    const handleSort = (field) => {
        setSort(prev => {
            if (prev.field === field) {
                return { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
            }
            return { field, dir: 'asc' };
        });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1); // Reset to first page
    };

    // Debounce Logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== query) {
                setQuery(searchInput);
                setPage(1); // Reset to page 1 on search
            }
        }, 1000); // 1 second delay

        return () => clearTimeout(timer);
    }, [searchInput, query]);

    // State for Export UI
    const [showExportMenu, setShowExportMenu] = useState(false);

    const handleExport = async (format) => {
        const uri = localStorage.getItem('active_connection');
        if (!uri) return;

        setExporting(true);
        setShowExportMenu(false);
        try {
            const zip = new JSZip();
            const docs = await getAllDocuments(uri, dbName, colName);

            const folder = zip.folder(colName);
            if (folder) {
                docs.forEach((doc) => {
                    const fileName = (doc._id || 'doc') + (format === 'json' ? '.json' : '.csv'); // Just extension placeholder for now
                    let content = '';
                    if (format === 'json') {
                        content = JSON.stringify(doc, null, 2);
                    } else {
                        // Simple CSV flatten
                        const keys = Object.keys(doc);
                        content = keys.join(',') + '\n' + keys.map(k => JSON.stringify(doc[k])).join(',');
                    }
                    // For CSV proper export of array of docs, we usually do one file. 
                    // But existing logic was one file per doc? 
                    // Correction: Existing logic was generic loop. 
                    // If CSV, usually we want one BIG csv.
                    // Let's stick to existing logic (one file per doc) or upgrade? 
                    // Reviewing request: "options to export as JSON or CSV files zipped"
                    // If zipped, multiple files is fine.
                    folder.file(fileName, content);
                });
            }

            const content = await zip.generateAsync({ type: "blob" });
            const url = window.URL.createObjectURL(content);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${colName}_${format}.zip`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('Export failed: ' + err.message);
        } finally {
            setExporting(false);
        }
    };

    // Determine columns from the first few docs (or all current page docs)
    const columns = Array.from(new Set(documents.flatMap(doc => Object.keys(doc))));

    return (
        <div className="container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <div className="header" style={{ marginBottom: 0, paddingBottom: 0.5, borderBottom: 'none', display: 'flex', alignItems: 'center', height: '60px', padding: '0 1rem', gap: '1rem' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                    <div className="breadcrumbs" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <span style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{colName}</span>
                        <span style={{ opacity: 0.5 }}>in</span>
                        <Link href={`/databases/${dbName}`}>{dbName}</Link>
                    </div>
                </div>

                {/* Global Search - Visible, Debounced */}
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        style={{
                            padding: '0.5rem 0.75rem',
                            paddingRight: '2.5rem', /* Space for spinner if needed, or icon */
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)',
                            width: '250px',
                            transition: 'width 0.2s'
                        }}
                    />
                    <div style={{ position: 'absolute', right: '0.75rem', pointerEvents: 'none', opacity: 0.5 }}>
                        {loading ? '...' : '🔍'}
                    </div>
                </div>

                {/* Export Dropdown */}
                <div style={{ position: 'relative' }}>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        disabled={exporting}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        {exporting ? 'Exporting...' : 'Export'} ▼
                    </button>
                    {showExportMenu && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '0.5rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-lg)',
                            zIndex: 50,
                            minWidth: '150px',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <button
                                onClick={() => handleExport('json')}
                                style={{
                                    padding: '0.75rem 1rem',
                                    textAlign: 'left',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    hover: { background: 'var(--bg-tertiary)' }
                                }}
                            >
                                JSON (Zipped)
                            </button>
                            <button
                                onClick={() => handleExport('csv')}
                                style={{
                                    padding: '0.75rem 1rem',
                                    textAlign: 'left',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    borderTop: '1px solid var(--border-color)'
                                }}
                            >
                                CSV (Zipped)
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area - No H1, margins reduced */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Table Overlay/Wrapper */}
                {loading && documents.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading documents...</div>
                ) : (
                    <div className="table-wrapper" style={{
                        position: 'relative',
                        flex: 1,
                        border: 'none',
                        borderRadius: 0,
                        borderTop: '1px solid var(--border-color)',
                        borderBottom: '1px solid var(--border-color)'
                    }}>
                        {loading && (
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(15, 23, 42, 0.4)',
                                backdropFilter: 'blur(2px)',
                                zIndex: 20, /* Below header (30), above content */
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                color: 'var(--text-primary)',
                            }}>
                                <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-lg)' }}>
                                    Updating...
                                </div>
                            </div>
                        )}
                        <table style={{ minWidth: '100%' }}>
                            <thead>
                                <tr>
                                    {columns.map(col => (
                                        <th key={col} onClick={() => handleSort(col)} className="clickable-th" style={{ borderRadius: 0 }}>
                                            {col} {sort.field === col ? (sort.dir === 'asc' ? '↑' : '↓') : ''}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {documents.map((doc, idx) => (
                                    <tr key={doc._id || idx}>
                                        {columns.map(col => {
                                            const val = doc[col];
                                            const isComplex = typeof val === 'object' && val !== null;
                                            return (
                                                <td key={col}>
                                                    {isComplex ? (
                                                        <button className="view-json-btn" onClick={() => setSelectedDoc(val)}>JSON</button>
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
                )}
            </div>

            {selectedDoc && (
                <div className="modal-overlay" onClick={() => setSelectedDoc(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setSelectedDoc(null)}>X</button>
                        <h3>JSON View</h3>
                        <div className="json-container">
                            <ReactJson src={selectedDoc} theme="rjv-default" collapsed={1} displayDataTypes={false} />
                        </div>
                    </div>
                </div>
            )}
            {/* Footer with Icons for Pagination */}
            <div className="pagination-footer" style={{
                height: '50px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 1rem',
                backgroundColor: 'var(--bg-secondary)',
                fontSize: '0.875rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Rows:</span>
                    <select
                        value={limit}
                        onChange={(e) => {
                            setLimit(Number(e.target.value));
                            setPage(1);
                        }}
                        style={{
                            padding: '0.25rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)'
                        }}
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                        {totalCount === 0 ? '0-0 of 0' : `${(page - 1) * limit + 1}-${Math.min(page * limit, totalCount)} of ${totalCount}`}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <button
                            className="btn btn-secondary"
                            disabled={page <= 1}
                            onClick={() => setPage(page - 1)}
                            style={{ padding: '0.25rem 0.5rem', width: '32px' }}
                            title="Previous Page"
                        >
                            ◄
                        </button>

                        <form onSubmit={handlePageSubmit}>
                            <input
                                type="number"
                                value={inputPage}
                                onChange={(e) => setInputPage(e.target.value)}
                                min={1}
                                max={Math.ceil(totalCount / limit) || 1}
                                style={{
                                    width: '40px',
                                    padding: '0.25rem',
                                    textAlign: 'center',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-tertiary)',
                                    color: 'var(--text-primary)',
                                    appearance: 'textfield'
                                }}
                            />
                        </form>

                        <button
                            className="btn btn-secondary"
                            disabled={page >= Math.ceil(totalCount / limit)}
                            onClick={() => setPage(page + 1)}
                            style={{ padding: '0.25rem 0.5rem', width: '32px' }}
                            title="Next Page"
                        >
                            ►
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
