import Header from '@/components/Header';
import Map from '@/components/Map';

export default function Home() {
  return (
    <div className="page-wrapper">
      <Header />
      <main className="main-content">
        <Map />
      </main>
    </div>
  );
}
