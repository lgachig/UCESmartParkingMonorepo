import { DashboardShell } from '@/components/layout/DashboardShell';
import { PlaceholderPage } from '@/components/ui/PlaceholderPage';

export default function UserVehiclePage() {
  return (
    <DashboardShell allowedRoles={['STUDENT', 'PROFESSOR', 'GUEST']}>
      <PlaceholderPage
        title="Mi Vehículo"
        description="Registro y gestión del vehículo asociado a tu cuenta."
      />
    </DashboardShell>
  );
}
