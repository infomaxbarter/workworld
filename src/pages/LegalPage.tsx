import { useLocation, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer';

const content: Record<string, { title: string; body: string }> = {
  kvkk: {
    title: 'KVKK Aydınlatma Metni',
    body: `6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, WorkWorld olarak kişisel verilerinizin güvenliğine önem veriyoruz.\n\nToplanan kişisel veriler yalnızca başvuru süreçlerinin yürütülmesi amacıyla kullanılmakta olup, üçüncü kişilerle paylaşılmamaktadır. Verileriniz, yasal saklama süreleri boyunca güvenli ortamlarda muhafaza edilir.\n\nKişisel verilerinize ilişkin haklarınız hakkında detaylı bilgi almak için bizimle iletişime geçebilirsiniz.`,
  },
  cookies: {
    title: 'Çerez Politikası',
    body: `Bu web sitesi, kullanıcı deneyimini iyileştirmek amacıyla çerezler kullanmaktadır.\n\nZorunlu çerezler, sitenin düzgün çalışması için gereklidir. Analitik çerezler ise site kullanımını anlamamıza yardımcı olur.\n\nTarayıcınızın ayarlarından çerezleri yönetebilir veya devre dışı bırakabilirsiniz.`,
  },
  consent: {
    title: 'Açık Rıza Formu',
    body: `WorkWorld platformuna başvuru yaparak, aşağıdaki hususlara açık rızanızı vermiş olmaktasınız:\n\n• Ad, e-posta adresi ve başvuru mesajınızın toplanması ve işlenmesi\n• Başvurunuzun değerlendirilmesi amacıyla verilerinizin kullanılması\n• Verilerinizin yasal saklama süreleri boyunca muhafaza edilmesi\n\nAçık rızanızı istediğiniz zaman geri çekme hakkına sahipsiniz.`,
  },
};

const LegalPage = () => {
  const location = useLocation();
  const slug = location.pathname.replace('/', '');
  const page = content[slug || ''];

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Page not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="max-w-2xl mx-auto px-4 py-16 flex-1">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-6">{page.title}</h1>
        <div className="prose prose-gray max-w-none">
          {page.body.split('\n').map((line, i) => (
            <p key={i} className="text-muted-foreground leading-relaxed mb-3">{line}</p>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LegalPage;
