'use client';

import { Suspense } from 'react';
import OAuthCallback from '@/drive/pages/OAuthCallback';
import { FullscreenSpinner } from '@/drive/components/common/Spinner';

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<FullscreenSpinner />}>
      <OAuthCallback />
    </Suspense>
  );
}
