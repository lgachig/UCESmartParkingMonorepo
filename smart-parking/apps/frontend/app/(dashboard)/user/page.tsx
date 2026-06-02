import { DashboardShell } from '@/components/layout/DashboardShell';
import { PlaceholderPage } from '@/components/ui/PlaceholderPage';

export default function UserDashboardPage() {
  return (
    <DashboardShell allowedRoles={['STUDENT', 'PROFESSOR', 'GUEST']}>
      <PlaceholderPage
        title="Dashboard de Usuario"
        description="Vista principal del estudiante o docente. Aquí irá el mapa y disponibilidad de espacios."
      />
    </DashboardShell>
  );
}
