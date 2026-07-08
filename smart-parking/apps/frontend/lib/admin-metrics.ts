import { reservationService, type Reservation } from '@/services/reservation.service';
import { userService, type UserStats } from '@/services/user.service';
import type { Slot } from '@/services/parking.service';

export interface AdminSessionRow {
    id: string;
    start_time: string;
    end_time?: string;
    status: 'active' | 'finished';
    parking_slots: { number: string };
    profiles?: { full_name: string; role_id: string };
}

export interface AdminAnalytics {
    filteredSessions: AdminSessionRow[];
    dataReport: {
        dayCounts: { name: string; visitas: number }[];
        hourCounts: { hora: string; cantidad: number }[];
        roleCounts: { name: string; value: number }[];
        topUsers: { name: string; value: number }[];
    };
    stats: {
        totalSessions: number;
        activeNow: number;
        mostUsedSlot: string;
        avgTime: string;
    };
    userStats: UserStats;
}

const ROLE_LABELS: Record<string, string> = {
    STUDENT: 'Estudiante',
    PROFESSOR: 'Docente',
    ADMIN: 'Admin',
    GUEST: 'Invitado',
};

function isActiveStatus(status: Reservation['status']): boolean {
    return status === 'PENDING' || status === 'ACTIVE';
}

/**
 * Combina datos reales de reservation-service (bitácora), user-service (roles/perfiles)
 * y parking-service (slots ya cargados por el caller) para alimentar el dashboard admin.
 * No hay agregación de este tipo disponible en un único microservicio porque cruza
 * datos que viven en 3 servicios distintos, así que se resuelve aquí (frontend/lib)
 * en vez de crear un servicio nuevo.
 */
export async function getAdminAnalytics(
    slots: Slot[],
    occupiedPlusReserved: number,
    filters: { startDate: string; endDate: string },
): Promise<AdminAnalytics> {
    const [reservations, userStats] = await Promise.all([
        reservationService.getRecent({
            limit: 300,
            startDate: filters.startDate || undefined,
            endDate: filters.endDate || undefined,
        }),
        userService.getStats(),
    ]);

    const slotMapById = new Map(slots.map((s) => [s.id, s.number]));

    // Resolver perfiles (nombre + rol) de los usuarios involucrados en estas reservas,
    // deduplicando para no golpear user-service con requests repetidos.
    const uniqueUserIds = Array.from(new Set(reservations.map((r) => r.userId)));
    const profileEntries = await Promise.all(
        uniqueUserIds.map(async (userId) => {
            const profile = await userService.getProfileByAuthUserId(userId);
            return [userId, profile] as const;
        }),
    );
    const profileMap = new Map(profileEntries);

    const sessions: AdminSessionRow[] = reservations.map((r) => {
        const profile = profileMap.get(r.userId);
        const fullName = profile
            ? [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Usuario sin nombre'
            : 'Usuario desconocido';
        const roleId = profile?.role ?? 'STUDENT';

        return {
            id: r.id,
            start_time: r.checkInAt ?? r.reservedAt,
            end_time: r.checkOutAt,
            status: isActiveStatus(r.status) ? 'active' : 'finished',
            parking_slots: { number: slotMapById.get(r.slotId) ?? '—' },
            profiles: { full_name: fullName, role_id: roleId },
        };
    });

    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const dayCounts = days.map((day) => ({ name: day, visitas: 0 }));
    const hourCounts = Array.from({ length: 15 }, (_, i) => ({ hora: `${i + 7}:00`, cantidad: 0 }));

    const userMap: Record<string, number> = {};
    const slotMap: Record<string, number> = {};
    let totalDurationMinutes = 0;
    let finishedCount = 0;

    sessions.forEach((s) => {
        const date = new Date(s.start_time);
        dayCounts[date.getDay()].visitas++;

        const hour = date.getHours();
        if (hour >= 7 && hour <= 21) {
            hourCounts[hour - 7].cantidad++;
        }

        const name = s.profiles?.full_name ?? 'Anónimo';
        userMap[name] = (userMap[name] || 0) + 1;

        if (s.parking_slots.number !== '—') {
            slotMap[s.parking_slots.number] = (slotMap[s.parking_slots.number] || 0) + 1;
        }

        if (s.status === 'finished' && s.end_time) {
            totalDurationMinutes += (new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 60000;
            finishedCount++;
        }
    });

    const topUsers = Object.entries(userMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    const mostUsedSlot = Object.entries(slotMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
    const avgMinutes = finishedCount > 0 ? Math.round(totalDurationMinutes / finishedCount) : 0;
    const avgTime = avgMinutes > 60 ? `${Math.floor(avgMinutes / 60)}h ${avgMinutes % 60}m` : `${avgMinutes} min`;

    const roleCounts = Object.entries(userStats.byRole).map(([role, value]) => ({
        name: ROLE_LABELS[role] ?? role,
        value,
    }));

    const sortedSessions = [...sessions].sort(
        (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
    );

    return {
        filteredSessions: sortedSessions,
        dataReport: { dayCounts, hourCounts, roleCounts, topUsers },
        stats: {
            totalSessions: sessions.length,
            activeNow: occupiedPlusReserved,
            mostUsedSlot,
            avgTime,
        },
        userStats,
    };
}