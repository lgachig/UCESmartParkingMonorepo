export interface ReservationConfirmedContext {
    reservationCode: string;
    slotNumber: string;
    zoneName?: string;
    expiresAt: string;
}

export function reservationConfirmedTemplate(ctx: ReservationConfirmedContext): string {
    return `
    <h2>Reserva confirmada</h2>
    <p>Tu código de reserva es: <strong>${ctx.reservationCode}</strong></p>
    <p>Puesto asignado: <strong>${ctx.slotNumber}${ctx.zoneName ? ` (${ctx.zoneName})` : ''}</strong></p>
    <p>Tenés hasta <strong>${new Date(ctx.expiresAt).toLocaleString()}</strong> para hacer check-in, o la reserva se cancelará automáticamente.</p>
  `;
}