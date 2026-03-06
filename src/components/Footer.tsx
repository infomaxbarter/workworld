import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="border-t border-border bg-card py-8 mt-16">
    <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">© 2026 WorkWorld</p>
      <nav className="flex gap-6">
        <Link to="/kvkk" className="text-sm text-muted-foreground hover:text-foreground transition-colors">KVKK</Link>
        <Link to="/cookies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Çerez Politikası</Link>
        <Link to="/consent" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Açık Rıza Formu</Link>
      </nav>
    </div>
  </footer>
);

export default Footer;
