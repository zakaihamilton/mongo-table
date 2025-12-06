"use client";

import { useEffect, useState } from 'react';
import { listDatabases } from '@/actions/mongo';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DatabaseList() {
  const [dbs, setDbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const uri = localStorage.getItem('active_connection');
    if (!uri) {
      router.push('/');
      return;
    }

    listDatabases(uri)
      .then(res => {
        setDbs(res.databases);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [router]);

  if (loading) return <div>Loading databases...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="container">
      <div className="header">
        <Link href="/">Back to Connections</Link>
        <h1>Databases</h1>
      </div>
      <ul className="list">
        {dbs.map(db => (
          <li key={db.name}>
            <Link href={`/databases/${db.name}`}>{db.name}</Link>
            <span className="details">({db.sizeOnDisk ? (db.sizeOnDisk / 1024 / 1024).toFixed(2) + ' MB' : 'Empty'})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
