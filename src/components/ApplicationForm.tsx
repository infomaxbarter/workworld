import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { useLanguage } from '@/i18n/LanguageContext';

const ApplicationForm = () => {
  const { t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);

  const schema = z.object({
    name: z.string().trim().min(1, t('form.name_required')).max(100),
    email: z.string().trim().email(t('form.email_invalid')).max(255),
    message: z.string().trim().min(1, t('form.message_required')).max(2000),
  });

  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', message: '' },
  });

  const onSubmit = async (data: FormValues) => {
    const { error } = await supabase.from('submissions').insert({
      name: data.name,
      email: data.email,
      message: data.message,
    });
    if (error) {
      toast.error(t('form.error'));
      return;
    }
    toast.success(t('form.success'));
    setSubmitted(true);
    form.reset();
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="max-w-lg mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">{t('form.title')}</h2>
        <p className="text-muted-foreground mt-2">{t('form.subtitle')}</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.name')}</FormLabel>
                <FormControl><Input placeholder={t('form.name_placeholder')} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.email')}</FormLabel>
                <FormControl><Input type="email" placeholder={t('form.email_placeholder')} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="message" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.message')}</FormLabel>
                <FormControl><Textarea placeholder={t('form.message_placeholder')} rows={4} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={submitted}>
              {submitted ? t('form.sent') : (<><Send className="w-4 h-4 mr-2" />{t('form.submit')}</>)}
            </Button>
          </form>
        </Form>
      </div>
    </motion.div>
  );
};

export default ApplicationForm;
