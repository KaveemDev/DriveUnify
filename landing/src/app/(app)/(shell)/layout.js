'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { DashboardLayout } from '@/drive/layouts/DashboardLayout';
import { FullscreenSpinner } from '@/drive/components/common/Spinner';

export default function ProtectedLayout({ children }) {
  const { user, initialized } = useSelector((s) => s.auth);
  const router = useRouter();

  useEffect(() => {
    if (initialized && !user) router.replace('/login');
  }, [initialized, user, router]);

  if (!initialized || !user) return <FullscreenSpinner />;
  return <DashboardLayout>{children}</DashboardLayout>;
}
