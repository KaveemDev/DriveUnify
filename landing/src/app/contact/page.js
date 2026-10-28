import { PageShell, PageHero } from '@/components/sections/PageShell';
import { ContactForm } from '@/components/pages/ContactContent';

export const metadata = {
  title: 'Contact',
  description: 'Get in touch with DriveUnify about support, provider requests, or security and privacy.',
};

export default function ContactPage() {
  return (
    <PageShell>
      <PageHero eyebrow="Contact" lines={['Talk to a human.']}>
        <p>Pick a topic, write a line, and we’ll get back to you by email.</p>
      </PageHero>
      <ContactForm />
    </PageShell>
  );
}
