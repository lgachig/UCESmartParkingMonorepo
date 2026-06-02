import { DashboardShell } from '@/components/layout/DashboardShell';
import { PlaceholderPage } from '@/components/ui/PlaceholderPage';

export default function UserReservationsPage() {
  return (
    <DashboardShell allowedRoles={['STUDENT', 'PROFESSOR', 'GUEST']}>
      <PlaceholderPage
        title="Mis Reservas"
        description="Historial y reservas activas del usuario."
      />
    </DashboardShell>
  );
}
