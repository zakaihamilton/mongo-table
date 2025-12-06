"use client";

import { use } from 'react';

export default function CollectionList({ params }) {
  const { db } = use(params);

  return (
    <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
        <h2>Database: {db}</h2>
        <p>Select a collection from the sidebar to view documents.</p>
      </div>
    </div>
  );
}
