import WorldMap from '@/components/WorldMap';
import Footer from '@/components/Footer';
import { useLanguage } from '@/i18n/LanguageContext';

const MapPage = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <section className="px-2 sm:px-4 pt-4 sm:pt-8 pb-4 sm:pb-6 max-w-7xl mx-auto w-full flex-1">
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('map.title')}</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">{t('map.subtitle')}</p>
        </div>
        <WorldMap showSidebar={true} />
      </section>
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
};

export default MapPage;
