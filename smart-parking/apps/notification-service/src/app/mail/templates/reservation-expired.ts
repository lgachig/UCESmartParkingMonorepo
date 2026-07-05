export interface ReservationExpiredContext {
    reservationCode: string;
    slotNumber: string;
    zoneName?: string;
}

export function reservationExpiredTemplate(ctx: ReservationExpiredContext): string {
    return `
    <h2>Reserva expirada</h2>
    <p>Tu reserva <strong>${ctx.reservationCode}</strong> del puesto <strong>${ctx.slotNumber}${ctx.zoneName ? ` (${ctx.zoneName})` : ''}</strong> expiró porque no se realizó el check-in a tiempo.</p>
    <p>El puesto fue liberado y ya está disponible para otros usuarios.</p>
  `;
}