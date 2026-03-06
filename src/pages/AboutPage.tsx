import { useLanguage } from '@/i18n/LanguageContext';
import { Link } from 'react-router-dom';
import { Heart, Globe, Users, Code, Shield, ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer';

const AboutPage = () => {
  const { t } = useLanguage();

  const values = [
    { icon: Globe, title: t('about.value_open_title'), desc: t('about.value_open_desc') },
    { icon: Users, title: t('about.value_community_title'), desc: t('about.value_community_desc') },
    { icon: Code, title: t('about.value_code_title'), desc: t('about.value_code_desc') },
    { icon: Shield, title: t('about.value_privacy_title'), desc: t('about.value_privacy_desc') },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12 flex-1">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" /> {t('event.back')}
        </Link>

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-primary mb-4">
            <Heart className="w-6 h-6" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            {t('about.title')}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {t('about.intro')}
          </p>
        </div>

        {/* Manifesto */}
        <div className="prose prose-neutral dark:prose-invert max-w-none mb-12">
          <div className="rounded-xl border border-border bg-card p-8 space-y-6">
            <h2 className="text-2xl font-bold text-foreground m-0">{t('about.manifesto_title')}</h2>
            <p className="text-foreground leading-relaxed m-0">{t('about.manifesto_p1')}</p>
            <p className="text-foreground leading-relaxed m-0">{t('about.manifesto_p2')}</p>
            <p className="text-foreground leading-relaxed m-0">{t('about.manifesto_p3')}</p>
          </div>
        </div>

        {/* Values */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">{t('about.values_title')}</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {values.map((v, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6">
                <v.icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-foreground mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Open Source Note */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
          <Code className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="font-bold text-foreground text-lg mb-2">{t('about.opensource_title')}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
            {t('about.opensource_desc')}
          </p>
        </div>
      </div>

      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
};

export default AboutPage;
