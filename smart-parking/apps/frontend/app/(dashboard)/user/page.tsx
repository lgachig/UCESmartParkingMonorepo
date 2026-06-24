'use client';

import { DashboardShell } from '@/components/layout/DashboardShell';
import UserDashboard from '@/components/user/UserDashboard';

export default function UserDashboardPage() {
  return (
    <DashboardShell allowedRoles={['STUDENT', 'PROFESSOR', 'GUEST']}>
      <UserDashboard />
    </DashboardShell>
  );
}
