import { reservationService } from '@/services/reservation.service';
import { userService } from '@/services/user.service';
import { vehicleService } from '@/services/user.service';
import type { Slot } from '@/services/parking.service';

export interface EnrichedSlot extends Slot {
  profiles?: { full_name: string };
  vehicles?: { license_plate: string; model: string };
  alertasActivas: string[];
  tiempoH: string;
}

/**
 * Para cada slot OCCUPIED/RESERVED, cruza datos reales de reservation-service
 * (quién y desde cuándo), user-service (nombre) y vehicle-service (placa/modelo).
 * Esta agregación cruza 3 microservicios distintos, por lo que vive en
 * apps/frontend/lib/ en vez de crear un servicio nuevo (ver CONTEXTO del proyecto).
 */
export async function enrichSlotsWithOccupancy(slots: Slot[]): Promise<EnrichedSlot[]> {
  const relevantSlots = slots.filter((s) => s.status === 'OCCUPIED' || s.status === 'RESERVED');

  const enrichedBySlotId = new Map<string, EnrichedSlot>();

  await Promise.all(
    relevantSlots.map(async (slot) => {
      let profiles: EnrichedSlot['profiles'];
      let vehicles: EnrichedSlot['vehicles'];
      let tiempoH = '0.0';
      let hasActiveReservation = false;

      try {
        const reservations = await reservationService.getBySlot(slot.id);
        const active = reservations.find((r) => r.status === 'PENDING' || r.status === 'ACTIVE');

        if (active) {
          hasActiveReservation = true;
          const referenceTime = active.checkInAt ?? active.reservedAt;
          const elapsedMs = Date.now() - new Date(referenceTime).getTime();
          tiempoH = Math.max(0, elapsedMs / 3_600_000).toFixed(1);

          const [profile, vehicle] = await Promise.all([
            userService.getProfileByAuthUserId(active.userId),
            vehicleService.getById(active.vehicleId),
          ]);

          if (profile) {
            profiles = {
              full_name: [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Sin nombre',
            };
          }
          if (vehicle) {
            vehicles = { license_plate: vehicle.plate, model: vehicle.model };
          }
        }
      } catch (err) {
        console.error(`Error enriching slot ${slot.id}:`, err);
      }

      const alertas: string[] = [];
      if (slot.status === 'OCCUPIED' && parseFloat(tiempoH) > 5.0) {
        alertas.push('EXCESO');
      }
      // Inconsistencia real: el puesto físico está OCCUPIED pero no hay una
      // reserva PENDING/ACTIVE que lo respalde (posible ocupación sin registro).
      if (slot.status === 'OCCUPIED' && !hasActiveReservation) {
        alertas.push('SIN REG');
      }

      enrichedBySlotId.set(slot.id, {
        ...slot,
        profiles,
        vehicles,
        alertasActivas: alertas,
        tiempoH,
      });
    }),
  );

  return slots.map(
    (slot) =>
      enrichedBySlotId.get(slot.id) ?? {
        ...slot,
        alertasActivas: [],
        tiempoH: '0.0',
      },
  );
}