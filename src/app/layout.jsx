import './globals.css';

export const metadata = {
  title: 'Mongo Table',
  description: 'Browser for MongoDB',
};

import Sidebar from '@/components/Sidebar';

import { Suspense } from 'react';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <Suspense fallback={<div className="sidebar" />}>
            <Sidebar />
          </Suspense>
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
