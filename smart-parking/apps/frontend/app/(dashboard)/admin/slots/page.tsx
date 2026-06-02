import { DashboardShell } from '@/components/layout/DashboardShell';
import { PlaceholderPage } from '@/components/ui/PlaceholderPage';

export default function AdminSlotsPage() {
  return (
    <DashboardShell allowedRoles={['ADMIN']}>
      <PlaceholderPage
        title="Gestión de Espacios"
        description="Administración de zonas, slots y mapa del parqueadero."
      />
    </DashboardShell>
  );
}
