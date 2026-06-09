'use client';

import { DashboardShell } from '@/components/layout/DashboardShell';
import SlotsPage from '@/components/admin/slots/SlotsPage';

export default function AdminSlotsPage() {
  return (
    <DashboardShell allowedRoles={['ADMIN']}>
      <SlotsPage />
    </DashboardShell>
  );
}
