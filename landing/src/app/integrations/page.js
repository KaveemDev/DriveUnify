import { PageShell, PageHero } from '@/components/sections/PageShell';
import { ProviderMatrix, ConnectSteps } from '@/components/pages/IntegrationsContent';
import { Integrations } from '@/components/sections/Integrations';
import { FinalCTA } from '@/components/sections/FinalCTA';

export const metadata = {
  title: 'Integrations',
  description: 'DriveUnify works with Google Drive and Dropbox today, with OneDrive next. See exactly what each provider supports.',
};

export default function IntegrationsPage() {
  return (
    <PageShell>
      <PageHero eyebrow="Integrations" lines={['Every drive.', 'One sign-in.']}>
        <p>Google Drive and Dropbox are live, with as many accounts of each as you like. OneDrive is next.</p>
      </PageHero>
      <Integrations />
      <ProviderMatrix />
      <ConnectSteps />
      <FinalCTA />
    </PageShell>
  );
}
