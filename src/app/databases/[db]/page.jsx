"use client";

import { useEffect, useState, use } from 'react';
import { listCollections, getAllDocuments } from '@/actions/mongo';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import JSZip from 'jszip';

export default function CollectionList({ params }) {
  // Params are a promise in Next 15
  const unwrappedParams = use(params);
  const dbName = unwrappedParams.db;
  
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const uri = localStorage.getItem('active_connection');
    if (!uri) {
      router.push('/');
      return;
    }

    listCollections(uri, dbName)
      .then(res => {
        setCollections(res.collections);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [dbName, router]);

  const handleExportDatabase = async () => {
    const uri = localStorage.getItem('active_connection');
    if (!uri) return;
    
    if (!confirm(`This will download all collections in '${dbName}'. It might take a while. Continue?`)) return;

    setExporting(true);
    try {
        const zip = new JSZip();
        
        // Parallel fetching could be too heavy, let's do sequential for safety or small batches
        for (const col of collections) {
            const docs = await getAllDocuments(uri, dbName, col.name);
            const folder = zip.folder(col.name);
            if (folder) {
                docs.forEach((doc) => {
                    const fileName = (doc._id || 'doc') + '.json';
                    folder.file(fileName, JSON.stringify(doc, null, 2));
                });
            }
        }
        
        const content = await zip.generateAsync({ type: "blob" });
        const url = window.URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${dbName}_dump.zip`;
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (err) {
        alert('Export failed: ' + err.message);
    } finally {
        setExporting(false);
    }
  };

  if (loading) return <div>Loading collections...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="container">
      <div className="header">
         <div className="breadcrumbs">
            <Link href="/">Connections</Link> &gt; <Link href="/databases">Databases</Link> &gt; {dbName}
         </div>
         <button onClick={handleExportDatabase} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Export Database (ZIP)'}
         </button>
      </div>
      
      <h1>Collections in {dbName}</h1>
      
      <ul className="list">
        {collections.map(col => (
          <li key={col.name}>
            <Link href={`/databases/${dbName}/${col.name}`}>{col.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
