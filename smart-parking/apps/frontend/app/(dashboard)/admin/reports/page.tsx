import { DashboardShell } from '@/components/layout/DashboardShell';
import { PlaceholderPage } from '@/components/ui/PlaceholderPage';

export default function AdminReportsPage() {
  return (
    <DashboardShell allowedRoles={['ADMIN']}>
      <PlaceholderPage
        title="Reportes"
        description="Estadísticas y reportes del sistema."
      />
    </DashboardShell>
  );
}
