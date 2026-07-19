import { motion } from 'framer-motion';
import WorldMap from '@/components/WorldMap';
import ApplicationForm from '@/components/ApplicationForm';
import Footer from '@/components/Footer';
import HeroSearch from '@/components/HeroSearch';
import PageSeo from '@/components/PageSeo';
import { useLanguage } from '@/i18n/LanguageContext';

const Index = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PageSeo
        title="WorkWorldMap — Open Global Community on the Map"
        description="Open-source nonprofit platform mapping people, events, professions and cities worldwide with transparent data and analytics."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'WorkWorldMap',
          url: 'https://workworld.lovable.app/',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://workworld.lovable.app/?q={search_term_string}',
            'query-input': 'required name=search_term_string',
          },
        }}
      />
      {/* Hero */}
      <section className="px-4 pt-12 pb-6 max-w-6xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            {t('hero.title_1')}<span className="text-primary">{t('hero.title_2')}</span>
          </h1>
          <p className="text-muted-foreground mt-3 text-lg max-w-md mx-auto">
            {t('hero.subtitle')}
          </p>
        </motion.div>

        <HeroSearch />
        <WorldMap />
      </section>

      {/* Application Form */}
      <section className="px-4 py-16 max-w-6xl mx-auto w-full">
        <ApplicationForm />
      </section>

      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
};

export default Index;
