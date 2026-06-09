import { parkingApi } from '@/lib/api';

export interface Faculty {
  id: number;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export interface Zone {
  id: number;
  name: string;
  code: string;
  centerLatitude: number;
  centerLongitude: number;
  facultyId: number;
  faculty?: Faculty;
  createdAt: string;
  updatedAt: string;
}

export type SlotStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'MAINTENANCE' | 'DISABLED';

export interface Slot {
  id: string;
  number: string;
  status: SlotStatus;
  latitude: number;
  longitude: number;
  zoneId: number;
  zone?: Zone;
  facultyId: number;
  faculty?: Faculty;
  distance?: number; // returned by nearby search
  createdAt: string;
  updatedAt: string;
}

export interface GlobalStats {
  totalSlots: number;
  available: number;
  occupied: number;
  reserved: number;
  maintenance: number;
  disabled: number;
}

export interface FacultyStats {
  facultyId: number;
  facultyName: string;
  facultyCode: string;
  totalSlots: number;
  available: number;
  occupied: number;
  reserved: number;
  maintenance: number;
  disabled: number;
}

export interface ZoneStats {
  zoneId: number;
  zoneName: string;
  zoneCode: string;
  facultyId: number;
  facultyName: string;
  totalSlots: number;
  available: number;
  occupied: number;
  reserved: number;
  maintenance: number;
  disabled: number;
}

export const parkingService = {
  // --- FACULTIES ---
  async getFaculties(): Promise<Faculty[]> {
    const { data } = await parkingApi.get<Faculty[]>('/faculties');
    return data;
  },

  async createFaculty(payload: { name: string; code: string }): Promise<Faculty> {
    const { data } = await parkingApi.post<Faculty>('/faculties', payload);
    return data;
  },

  async updateFaculty(id: number, payload: Partial<{ name: string; code: string }>): Promise<Faculty> {
    const { data } = await parkingApi.patch<Faculty>(`/faculties/${id}`, payload);
    return data;
  },

  async deleteFaculty(id: number): Promise<void> {
    await parkingApi.delete(`/faculties/${id}`);
  },

  // --- ZONES ---
  async getZones(): Promise<Zone[]> {
    const { data } = await parkingApi.get<Zone[]>('/zones');
    return data;
  },

  async getZonesByFaculty(facultyId: number): Promise<Zone[]> {
    const { data } = await parkingApi.get<Zone[]>(`/zones/faculty/${facultyId}`);
    return data;
  },

  async createZone(payload: {
    name: string;
    code: string;
    centerLatitude: number;
    centerLongitude: number;
    facultyId: number;
  }): Promise<Zone> {
    const { data } = await parkingApi.post<Zone>('/zones', payload);
    return data;
  },

  async updateZone(
    id: number,
    payload: Partial<{
      name: string;
      code: string;
      centerLatitude: number;
      centerLongitude: number;
      facultyId: number;
    }>,
  ): Promise<Zone> {
    const { data } = await parkingApi.patch<Zone>(`/zones/${id}`, payload);
    return data;
  },

  async deleteZone(id: number): Promise<void> {
    await parkingApi.delete(`/zones/${id}`);
  },

  // --- SLOTS ---
  async getSlots(): Promise<Slot[]> {
    const { data } = await parkingApi.get<Slot[]>('/slots');
    return data;
  },

  async getSlot(id: string): Promise<Slot> {
    const { data } = await parkingApi.get<Slot>(`/slots/${id}`);
    return data;
  },

  async createSlot(payload: {
    id?: string;
    number: string;
    status?: SlotStatus;
    latitude: number;
    longitude: number;
    zoneId: number;
    facultyId: number;
  }): Promise<Slot> {
    const { data } = await parkingApi.post<Slot>('/slots', payload);
    return data;
  },

  async updateSlot(
    id: string,
    payload: Partial<{
      number: string;
      status: SlotStatus;
      latitude: number;
      longitude: number;
      zoneId: number;
      facultyId: number;
    }>,
  ): Promise<Slot> {
    const { data } = await parkingApi.patch<Slot>(`/slots/${id}`, payload);
    return data;
  },

  async deleteSlot(id: string): Promise<void> {
    await parkingApi.delete(`/slots/${id}`);
  },

  // --- STATE TRANSITIONS ---
  async reserveSlot(id: string): Promise<Slot> {
    const { data } = await parkingApi.patch<Slot>(`/slots/${id}/reserve`);
    return data;
  },

  async occupySlot(id: string): Promise<Slot> {
    const { data } = await parkingApi.patch<Slot>(`/slots/${id}/occupy`);
    return data;
  },

  async releaseSlot(id: string): Promise<Slot> {
    const { data } = await parkingApi.patch<Slot>(`/slots/${id}/release`);
    return data;
  },

  async maintenanceSlot(id: string): Promise<Slot> {
    const { data } = await parkingApi.patch<Slot>(`/slots/${id}/maintenance`);
    return data;
  },

  async enableSlot(id: string): Promise<Slot> {
    const { data } = await parkingApi.patch<Slot>(`/slots/${id}/enable`);
    return data;
  },

  // --- SEARCH AND GEOLOCATION ---
  async searchSlots(filters: {
    facultyId?: number;
    zoneId?: number;
    status?: SlotStatus;
  }): Promise<Slot[]> {
    const params = new URLSearchParams();
    if (filters.facultyId) params.append('facultyId', String(filters.facultyId));
    if (filters.zoneId) params.append('zoneId', String(filters.zoneId));
    if (filters.status) params.append('status', filters.status);

    const { data } = await parkingApi.get<Slot[]>(`/slots/search?${params.toString()}`);
    return data;
  },

  async getNearbySlots(lat: number, lng: number, radius: number): Promise<Slot[]> {
    const { data } = await parkingApi.get<Slot[]>(`/slots/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
    return data;
  },

  // --- STATISTICS ---
  async getGlobalStats(): Promise<GlobalStats> {
    const { data } = await parkingApi.get<GlobalStats>('/statistics');
    return data;
  },

  async getFacultyStats(): Promise<FacultyStats[]> {
    const { data } = await parkingApi.get<FacultyStats[]>('/statistics/faculties');
    return data;
  },

  async getZoneStats(): Promise<ZoneStats[]> {
    const { data } = await parkingApi.get<ZoneStats[]>('/statistics/zones');
    return data;
  },
};
