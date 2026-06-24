import Twin from '@/components/twin';

export default function Home() {
  return (
    <main className="site-main">
      <div className="site-grid" aria-hidden="true" />
      <Twin />
      <footer className="site-footer">
        <span>Built for focused product conversations.</span>
        <a
          href="https://portfolio-alpha-five-1ka0417h0y.vercel.app/"
          target="_blank"
          rel="noreferrer"
        >
          View portfolio
        </a>
      </footer>
    </main>
  );
}
