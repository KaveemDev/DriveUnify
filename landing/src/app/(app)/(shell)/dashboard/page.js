'use client';

import { Suspense } from 'react';
import Dashboard from '@/drive/pages/Dashboard';
import { FullscreenSpinner } from '@/drive/components/common/Spinner';

export default function DashboardPage() {
  return (
    <Suspense fallback={<FullscreenSpinner />}>
      <Dashboard />
    </Suspense>
  );
}
