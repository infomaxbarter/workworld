import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { store } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Invalid email').max(255),
  message: z.string().trim().min(1, 'Message is required').max(2000),
});

type FormData = z.infer<typeof schema>;

const ApplicationForm = () => {
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', message: '' } as FormData,
  });

  const onSubmit = (data: FormData) => {
    store.addSubmission({ name: data.name, email: data.email, message: data.message });
    toast.success('Application submitted successfully!');
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
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Join Our Community</h2>
        <p className="text-muted-foreground mt-2">Tell us about yourself and why you'd like to join.</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message / Motivation</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Why do you want to join?" rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={submitted}>
              {submitted ? 'Sent!' : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Apply
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>
    </motion.div>
  );
};

export default ApplicationForm;
