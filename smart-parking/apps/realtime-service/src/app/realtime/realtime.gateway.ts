import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsResponse,
} from '@nestjs/websockets';
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GLOBAL_ROOM, RealtimeService } from './realtime.service';
import { SubscribeZoneDto } from './dto/subscribe.dto';
import { SlotEventPayload } from './dto/slot-event.dto';


@WebSocketGateway({ namespace: '/realtime' })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    private readonly logger = new Logger(RealtimeGateway.name);

    constructor(private readonly realtimeService: RealtimeService) { }

    handleConnection(client: Socket): void {
        this.realtimeService.registerConnection();
        const rooms = this.joinRoomsFromHandshake(client);
        this.logger.log(
            `Client connected: ${client.id} → rooms=[${rooms.join(', ')}] (active=${this.realtimeService.activeConnections})`,
        );
    }

    handleDisconnect(client: Socket): void {
        this.realtimeService.unregisterConnection();
        this.logger.log(
            `Client disconnected: ${client.id} (active=${this.realtimeService.activeConnections})`,
        );
    }

    emitSlotEvent(payload: SlotEventPayload): void {
        this.server.to(GLOBAL_ROOM).emit('slot:update', payload);

        if (payload.zoneId !== undefined) {
            this.server.to(this.realtimeService.zoneRoom(payload.zoneId)).emit('slot:update', payload);
        }

        if (payload.facultyId !== undefined) {
            this.server.to(this.realtimeService.facultyRoom(payload.facultyId)).emit('slot:update', payload);
        }

        this.logger.log(`Relayed ${payload.eventType} for slot ${payload.id}`);
    }

    @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    @SubscribeMessage('subscribe')
    handleSubscribe(
        @ConnectedSocket() client: Socket,
        @MessageBody() dto: SubscribeZoneDto,
    ): WsResponse<{ rooms: string[] }> {
        this.leaveAllFilterRooms(client);
        const rooms = this.joinFilterRooms(client, dto.zoneId, dto.facultyId);
        this.logger.log(`Client ${client.id} subscribed to: ${rooms.join(', ')}`);
        return { event: 'subscribed', data: { rooms } };
    }

    @SubscribeMessage('unsubscribe')
    handleUnsubscribe(@ConnectedSocket() client: Socket): WsResponse<{ rooms: string[] }> {
        this.leaveAllFilterRooms(client);
        client.join(GLOBAL_ROOM);
        this.logger.log(`Client ${client.id} unsubscribed → back to ${GLOBAL_ROOM}`);
        return { event: 'unsubscribed', data: { rooms: [GLOBAL_ROOM] } };
    }

    private joinRoomsFromHandshake(client: Socket): string[] {
        const { zoneId, facultyId } = client.handshake.query;
        const parsedZone = zoneId ? Number(zoneId) : undefined;
        const parsedFaculty = facultyId ? Number(facultyId) : undefined;
        return this.joinFilterRooms(client, parsedZone, parsedFaculty);
    }

    private joinFilterRooms(client: Socket, zoneId?: number, facultyId?: number): string[] {
        const rooms: string[] = [];

        if (zoneId !== undefined && !Number.isNaN(zoneId)) {
            const room = this.realtimeService.zoneRoom(zoneId);
            client.join(room);
            rooms.push(room);
        }

        if (facultyId !== undefined && !Number.isNaN(facultyId)) {
            const room = this.realtimeService.facultyRoom(facultyId);
            client.join(room);
            rooms.push(room);
        }

        if (rooms.length === 0) {
            client.join(GLOBAL_ROOM);
            rooms.push(GLOBAL_ROOM);
        }

        return rooms;
    }

    private leaveAllFilterRooms(client: Socket): void {
        for (const room of client.rooms) {
            if (room !== client.id) {
                client.leave(room);
            }
        }
    }
}