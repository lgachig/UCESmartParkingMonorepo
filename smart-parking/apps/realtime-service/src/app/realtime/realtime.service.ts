import { Injectable } from '@nestjs/common';
import { MetricsService } from '../metrics/metrics.service';

export const GLOBAL_ROOM = 'global';

@Injectable()
export class RealtimeService {
    private connections = 0;

    constructor(private readonly metrics: MetricsService) { }

    get activeConnections(): number {
        return this.connections;
    }

    registerConnection(): void {
        this.connections += 1;
        this.metrics.activeConnectionsGauge.set(this.connections);
    }

    unregisterConnection(): void {
        this.connections = Math.max(0, this.connections - 1);
        this.metrics.activeConnectionsGauge.set(this.connections);
    }

    zoneRoom(zoneId: number): string {
        return `zone:${zoneId}`;
    }

    facultyRoom(facultyId: number): string {
        return `faculty:${facultyId}`;
    }
}