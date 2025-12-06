"use client";

export default function DatabaseList() {
  return (
    <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
        <h2>Select a Database</h2>
        <p>Use the sidebar to browse databases and collections.</p>
      </div>
    </div>
  );
}
