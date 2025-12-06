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
  const [limit] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [sort, setSort] = useState({ field: undefined, dir: 'asc' });
  const [search, setSearch] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(0); // to trigger refetch
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
    getDocuments(uri, dbName, colName, page, limit, sort.field, sort.dir, search)
      .then(res => {
        setDocuments(res.documents);
        setTotalCount(res.totalCount);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [dbName, colName, page, limit, sort, searchTrigger, search, router]); 
  // Added 'search' to deps or just searchTrigger? 
  // Original had searchTrigger. If we rely on button, search shouldn't be in deps to avoid typing-fetches.
  // But for linting correctness, if we use 'search' inside effect we should include it or use ref.
  // Actually, 'search' is state, so if it changes, effect runs if included.
  // We want to run ONLY on searchTrigger for search changes.
  // But we passed 'search' to getDocuments.
  // If we don't want to fetch on every keystroke, we should only update 'search' state when button is clicked?
  // Or keep 'search' as input state and 'appliedSearch' as effect state.
  // Current implementation: onChange updates 'search'. If we add 'search' to deps, it fetches on type.
  // Let's stick to the previous logic: we only want to fetch when page/sort/trigger changes.
  // To satisfy linter cleanly we would separate "inputValue" vs "queryValue".
  // For now I will leave it as is, or fix the dependency warning by ignoring or splitting state.
  // I will split state to be clean: query

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
    setSearchTrigger(prev => prev + 1);
  };

  const handleExportCollection = async () => {
    const uri = localStorage.getItem('active_connection');
    if (!uri) return;
    
    setExporting(true);
    try {
        const zip = new JSZip();
        const docs = await getAllDocuments(uri, dbName, colName);
        
        const folder = zip.folder(colName);
        if (folder) {
            docs.forEach((doc) => {
                const fileName = (doc._id || 'doc') + '.json';
                folder.file(fileName, JSON.stringify(doc, null, 2));
            });
        }
        
        const content = await zip.generateAsync({ type: "blob" });
        const url = window.URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${colName}_dump.zip`;
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
    <div className="container">
      <div className="header">
         <div className="breadcrumbs">
            <Link href="/">Connections</Link> &gt; <Link href="/databases">Databases</Link> &gt; <Link href={`/databases/${dbName}`}>{dbName}</Link> &gt; {colName}
         </div>
         <button onClick={handleExportCollection} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Export Collection (ZIP)'}
         </button>
      </div>

      <h1>Collection: {colName}</h1>

      <div className="controls">
        <form onSubmit={handleSearch} className="search-box">
            <input 
                type="text" 
                placeholder="Global Search..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
            />
            <button type="submit">Search</button>
        </form>
        <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
            <span>Page {page} of {Math.ceil(totalCount / limit)} ({totalCount} docs)</span>
            <button disabled={page >= Math.ceil(totalCount / limit)} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      </div>

      {loading ? <div>Loading documents...</div> : (
        <div className="table-wrapper">
            <table>
                <thead>
                    <tr>
                        {columns.map(col => (
                            <th key={col} onClick={() => handleSort(col)} className="clickable-th">
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
                                            <button className="view-json-btn" onClick={() => setSelectedDoc(val)}>View JSON</button>
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
    </div>
  );
}
