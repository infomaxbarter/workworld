import { motion } from 'framer-motion';
import WorldMap from '@/components/WorldMap';
import ApplicationForm from '@/components/ApplicationForm';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero */}
      <section className="px-4 pt-12 pb-6 max-w-6xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Work<span className="text-primary">World</span>
          </h1>
          <p className="text-muted-foreground mt-3 text-lg max-w-md mx-auto">
            A global community connecting people and ideas across borders.
          </p>
        </motion.div>

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
