import './globals.css';

export const metadata = {
  title: 'Mongo Table',
  description: 'Browser for MongoDB',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
