import ConnectionManager from '@/components/ConnectionManager';

export const metadata = {
  title: 'Mongo Table',
  description: 'Browser for MongoDB',
};

export default function Home() {
  return (
    <main>
      <h1>Mongo Table</h1>
      <ConnectionManager />
    </main>
  );
}
