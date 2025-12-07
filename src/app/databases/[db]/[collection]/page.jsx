'use client';

import { useEffect, useState, use } from 'react';
import { getDocuments, getAllDocuments, getDocument } from '@/actions/mongo';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import JSZip from 'jszip';
import CollectionHeader from '@/components/CollectionHeader';
import CollectionTable from '@/components/CollectionTable';
import Pagination from '@/components/Pagination';
import JsonViewModal from '@/components/JsonViewModal';

export default function CollectionPage({ params }) {
    const { db: dbName, collection: colName } = use(params);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [totalCount, setTotalCount] = useState(0);
    const [sort, setSort] = useState({ field: undefined, dir: 'asc' });
    const [searchInput, setSearchInput] = useState('');
    const [query, setQuery] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);

    // Sync URL 'view' param with selectedDoc
    useEffect(() => {
        const viewId = searchParams.get('view');
        if (viewId) {
            // If already showing correct doc, do nothing
            if (selectedDoc && selectedDoc._id === viewId) return;

            // Fetch and show doc
            const uri = localStorage.getItem('active_connection');
            if (uri) {
                getDocument(uri, dbName, colName, viewId)
                    .then(doc => {
                        if (doc) setSelectedDoc(doc);
                    })
                    .catch(console.error);
            }
        } else {
            // If no param but doc is selected, close it (handle back button)
            if (selectedDoc) setSelectedDoc(null);
        }
    }, [searchParams, dbName, colName]); // Removed selectedDoc from deps to avoid loop

    const handleViewJson = (doc) => {
        setSelectedDoc(doc);
        const params = new URLSearchParams(searchParams);
        params.set('view', doc._id);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const handleCloseJson = () => {
        setSelectedDoc(null);
        const params = new URLSearchParams(searchParams);
        params.delete('view');
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const folder = searchParams.get('folder');

    useEffect(() => {
        const uri = localStorage.getItem('active_connection');
        if (!uri) {
            router.push('/');
            return;
        }

        setLoading(true);
        const filter = folder ? { folder } : {};

        getDocuments(uri, dbName, colName, page, limit, sort.field, sort.dir, query, filter)
            .then(res => {
                setDocuments(res.documents);
                setTotalCount(res.totalCount);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [dbName, colName, page, limit, sort, query, router, folder]);

    const handleSort = (field) => {
        setSort(prev => {
            if (prev.field === field) {
                return { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
            }
            return { field, dir: 'asc' };
        });
    };

    // Debounce Logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== query) {
                setQuery(searchInput);
                setPage(1);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [searchInput, query]);

    const handleExport = async (format) => {
        const uri = localStorage.getItem('active_connection');
        if (!uri) return;

        setIsExporting(true);
        try {
            const zip = new JSZip();
            const docs = await getAllDocuments(uri, dbName, colName);

            const folder = zip.folder(colName);
            if (folder) {
                docs.forEach((doc) => {
                    const fileName = (doc._id || 'doc') + (format === 'json' ? '.json' : '.csv');
                    let content = '';
                    if (format === 'json') {
                        content = JSON.stringify(doc, null, 2);
                    } else {
                        const keys = Object.keys(doc);
                        content = keys.join(',') + '\n' + keys.map(k => JSON.stringify(doc[k])).join(',');
                    }
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
            setIsExporting(false);
        }
    };

    const columns = Array.from(new Set(documents.flatMap(doc => Object.keys(doc))));

    return (
        <div className="container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <CollectionHeader
                dbName={dbName}
                colName={colName}
                searchInput={searchInput}
                onSearchChange={setSearchInput}
                onExport={handleExport}
                isExporting={isExporting}
            />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                {loading && documents.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading documents...</div>
                ) : (
                    <>
                        {loading && (
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                backdropFilter: 'blur(2px)',
                                zIndex: 60,
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
                        <CollectionTable
                            documents={documents}
                            columns={columns}
                            sort={sort}
                            onSort={handleSort}
                            onViewJson={handleViewJson}
                        />
                    </>
                )}
            </div>

            <Pagination
                page={page}
                limit={limit}
                totalCount={totalCount}
                onPageChange={setPage}
                onLimitChange={(l) => { setLimit(l); setPage(1); }}
            />

            <JsonViewModal
                data={selectedDoc}
                onClose={handleCloseJson}
            />
        </div>
    );
}
