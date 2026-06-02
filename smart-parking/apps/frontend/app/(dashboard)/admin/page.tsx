import { DashboardShell } from '@/components/layout/DashboardShell';
import { PlaceholderPage } from '@/components/ui/PlaceholderPage';

export default function AdminDashboardPage() {
  return (
    <DashboardShell allowedRoles={['ADMIN']}>
      <PlaceholderPage
        title="Panel de Administración"
        description="Métricas generales y control del sistema de parqueo."
      />
    </DashboardShell>
  );
}
