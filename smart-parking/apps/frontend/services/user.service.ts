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

export const userService = {
  async getMyProfile(): Promise<UserProfile> {
    const { data } = await userApi.get<UserProfile>('/users/me');
    return data;
  },

  async updateMyProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
    const { data } = await userApi.patch<UserProfile>('/users/me', payload);
    return data;
  },
};

export const vehicleService = {
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
