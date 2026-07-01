import { DashboardShell } from '@/components/layout/DashboardShell';
import ReservationsPage from '@/components/user/ReservationsPage';

export default function UserReservationsPage() {
  return (
    <DashboardShell allowedRoles={['STUDENT', 'PROFESSOR', 'GUEST']}>
      <ReservationsPage />
    </DashboardShell>
  );
}