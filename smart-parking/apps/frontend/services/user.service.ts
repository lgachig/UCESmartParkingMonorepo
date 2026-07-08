import { userApi, vehicleApi } from '@/lib/api';
import type { UserProfile } from '@/interfaces/user.interface';
import type { Vehicle } from '@/interfaces/vehicle.interface';

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
}

export interface VehiclePayload {
  registrationNumber: string;
  plate: string;
  color: string;
  model: string;
  year: number;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  newLast7Days: number;
  newLast30Days: number;
  byRole: Record<string, number>;
  recentProfiles: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    createdAt: string;
  }>;
}

export const userService = {
  async getMyProfile(): Promise<UserProfile> {
    const { data } = await userApi.get<UserProfile>('/users/me');
    return data;
  },

  async updateMyProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
    const { data } = await userApi.patch<UserProfile>('/users/me', payload);
    return data;
  },

  // --- ADMIN ---
  async getStats(): Promise<UserStats> {
    const { data } = await userApi.get<UserStats>('/users/stats');
    return data;
  },

  async getProfileByAuthUserId(authUserId: string): Promise<UserProfile | null> {
    try {
      const { data } = await userApi.get<UserProfile>(`/users/profile/${authUserId}`);
      return data;
    } catch {
      return null;
    }
  },
};

export interface VehicleStats {
  total: number;
  newLast7Days: number;
  newLast30Days: number;
  topModels: Array<{ model: string; count: number }>;
}

export const vehicleService = {
  // --- ADMIN ---
  async getStats(): Promise<VehicleStats> {
    const { data } = await vehicleApi.get<VehicleStats>('/vehicles/stats');
    return data;
  },

  async getById(id: string): Promise<Vehicle | null> {
    try {
      const { data } = await vehicleApi.get<Vehicle>(`/vehicles/${id}`);
      return data;
    } catch {
      return null;
    }
  },

  async getMyVehicle(): Promise<Vehicle | null> {
    try {
      const { data } = await vehicleApi.get<Vehicle>('/vehicles/me');
      return data;
    } catch {
      return null;
    }
  },

  async createVehicle(payload: VehiclePayload): Promise<Vehicle> {
    const { data } = await vehicleApi.post<Vehicle>('/vehicles/me', payload);
    return data;
  },

  async updateVehicle(payload: Partial<VehiclePayload>): Promise<Vehicle> {
    const { data } = await vehicleApi.patch<Vehicle>('/vehicles/me', payload);
    return data;
  },

  async deleteVehicle(): Promise<void> {
    await vehicleApi.delete('/vehicles/me');
  },
};