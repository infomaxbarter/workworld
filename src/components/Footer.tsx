import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const Footer = () => {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [dark]);

  return (
    <footer className="border-t border-border bg-card py-8 mt-16">
      <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">© 2026 WorkWorld</p>
        <nav className="flex items-center gap-6">
          <Link to="/kvkk" className="text-sm text-muted-foreground hover:text-foreground transition-colors">KVKK</Link>
          <Link to="/cookies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Çerez Politikası</Link>
          <Link to="/consent" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Açık Rıza Formu</Link>
          <Button variant="ghost" size="icon" onClick={() => setDark(!dark)} className="ml-2">
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
