'use client';

import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Car, Loader2, Lock, Save, Trash2, User } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from '@/lib/schemas/change-password.schema';
import {
  profileSchema,
  vehicleSchema,
  type ProfileFormValues,
  type VehicleFormValues,
} from '@/lib/schemas/settings.schema';
import { authService } from '@/services/auth.service';
import { userService, vehicleService } from '@/services/user.service';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
  const { logout } = useAuth();
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [vehicleError, setVehicleError] = useState<string | null>(null);
  const [vehicleSuccess, setVehicleSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [hasVehicle, setHasVehicle] = useState(false);
  const [loading, setLoading] = useState(true);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  const vehicleForm = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
  });

  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await userService.getMyProfile();
      profileForm.reset({
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        phone: profile.phone ?? '',
        avatar: profile.avatar ?? '',
      });

      const vehicle = await vehicleService.getMyVehicle();
      setHasVehicle(!!vehicle);
      if (vehicle) {
        vehicleForm.reset({
          registrationNumber: vehicle.registrationNumber,
          plate: vehicle.plate,
          color: vehicle.color,
          model: vehicle.model,
          year: vehicle.year,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [profileForm, vehicleForm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onProfileSubmit = async (data: ProfileFormValues) => {
    setProfileError(null);
    setProfileSuccess(null);
    try {
      await userService.updateMyProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
        avatar: data.avatar || undefined,
      });
      setProfileSuccess('Profile updated successfully.');
    } catch (error) {
      setProfileError(getAuthErrorMessage(error, 'Could not update profile.'));
    }
  };

  const onVehicleSubmit = async (data: VehicleFormValues) => {
    setVehicleError(null);
    setVehicleSuccess(null);
    try {
      if (hasVehicle) {
        await vehicleService.updateVehicle(data);
        setVehicleSuccess('Vehicle updated successfully.');
      } else {
        await vehicleService.createVehicle(data);
        setHasVehicle(true);
        setVehicleSuccess('Vehicle registered successfully.');
      }
    } catch (error) {
      setVehicleError(getAuthErrorMessage(error, 'Could not save vehicle.'));
    }
  };

  const onDeleteVehicle = async () => {
    setVehicleError(null);
    setVehicleSuccess(null);
    try {
      await vehicleService.deleteVehicle();
      setHasVehicle(false);
      vehicleForm.reset({
        registrationNumber: '',
        plate: '',
        color: '',
        model: '',
        year: new Date().getFullYear(),
      });
      setVehicleSuccess('Vehicle removed successfully.');
    } catch (error) {
      setVehicleError(getAuthErrorMessage(error, 'Could not delete vehicle.'));
    }
  };

  const onPasswordSubmit = async (data: ChangePasswordFormValues) => {
    setPasswordError(null);
    setPasswordSuccess(null);
    try {
      const result = await authService.changePassword(
        data.currentPassword,
        data.newPassword,
      );
      setPasswordSuccess(result.message);
      passwordForm.reset();
      setTimeout(() => logout(), 2000);
    } catch (error) {
      setPasswordError(getAuthErrorMessage(error, 'Could not change password.'));
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-[#003366]" size={32} />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="text-3xl font-black text-[#003366]">Settings</h1>
          <p className="text-slate-500">Manage your profile, vehicle, and security.</p>
        </div>

        {/* Profile */}
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <User className="text-[#003366]" size={22} />
            <h2 className="text-xl font-bold text-[#003366]">Profile</h2>
          </div>
          {profileError && <AlertBox message={profileError} />}
          {profileSuccess && <SuccessBox message={profileSuccess} />}
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="grid gap-4 md:grid-cols-2">
            {(['firstName', 'lastName', 'phone', 'avatar'] as const).map((field) => (
              <div key={field} className={field === 'avatar' ? 'md:col-span-2' : ''}>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                  {field === 'avatar' ? 'Avatar URL' : field.replace(/([A-Z])/g, ' $1')}
                </label>
                <input
                  {...profileForm.register(field)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#003366]"
                />
                {profileForm.formState.errors[field] && (
                  <p className="mt-1 text-xs text-red-500">
                    {profileForm.formState.errors[field]?.message}
                  </p>
                )}
              </div>
            ))}
            <div className="md:col-span-2">
              <button type="submit" disabled={profileForm.formState.isSubmitting} className="btn-primary">
                {profileForm.formState.isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={16} /> Save profile</>}
              </button>
            </div>
          </form>
        </section>

        {/* Vehicle */}
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <Car className="text-[#003366]" size={22} />
            <h2 className="text-xl font-bold text-[#003366]">My Vehicle</h2>
            <span className="text-xs text-slate-400">(one vehicle per user)</span>
          </div>
          {vehicleError && <AlertBox message={vehicleError} />}
          {vehicleSuccess && <SuccessBox message={vehicleSuccess} />}
          <form onSubmit={vehicleForm.handleSubmit(onVehicleSubmit)} className="grid gap-4 md:grid-cols-2">
            {(['registrationNumber', 'plate', 'color', 'model'] as const).map((field) => (
              <div key={field}>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                  {field === 'registrationNumber' ? 'Registration number' : field}
                </label>
                <input
                  {...vehicleForm.register(field)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#003366]"
                />
                {vehicleForm.formState.errors[field] && (
                  <p className="mt-1 text-xs text-red-500">
                    {vehicleForm.formState.errors[field]?.message}
                  </p>
                )}
              </div>
            ))}
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Year</label>
              <input
                type="number"
                {...vehicleForm.register('year', { valueAsNumber: true })}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#003366]"
              />
              {vehicleForm.formState.errors.year && (
                <p className="mt-1 text-xs text-red-500">{vehicleForm.formState.errors.year.message}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button type="submit" disabled={vehicleForm.formState.isSubmitting} className="btn-primary">
                {vehicleForm.formState.isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>{hasVehicle ? 'Update vehicle' : 'Register vehicle'}</>
                )}
              </button>
              {hasVehicle && (
                <button type="button" onClick={onDeleteVehicle} className="btn-danger">
                  <Trash2 size={16} /> Delete vehicle
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Password */}
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <Lock className="text-[#003366]" size={22} />
            <h2 className="text-xl font-bold text-[#003366]">Change password</h2>
          </div>
          {passwordError && <AlertBox message={passwordError} />}
          {passwordSuccess && <SuccessBox message={passwordSuccess} />}
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((field) => (
              <div key={field}>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                  {field.replace(/([A-Z])/g, ' $1')}
                </label>
                <input
                  type="password"
                  {...passwordForm.register(field)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#003366]"
                />
                {passwordForm.formState.errors[field] && (
                  <p className="mt-1 text-xs text-red-500">
                    {passwordForm.formState.errors[field]?.message}
                  </p>
                )}
              </div>
            ))}
            <button type="submit" disabled={passwordForm.formState.isSubmitting} className="btn-primary">
              {passwordForm.formState.isSubmitting ? <Loader2 className="animate-spin" /> : 'Update password'}
            </button>
          </form>
        </section>
      </div>

      <style jsx global>{`
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          border-radius: 0.75rem;
          background: #003366;
          padding: 0.75rem 1.25rem;
          font-weight: 700;
          color: white;
        }
        .btn-danger {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          border-radius: 0.75rem;
          border: 1px solid #fecaca;
          background: #fef2f2;
          padding: 0.75rem 1.25rem;
          font-weight: 700;
          color: #b91c1c;
        }
      `}</style>
    </DashboardShell>
  );
}

function AlertBox({ message }: { message: string }) {
  return (
    <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <AlertCircle size={18} /> {message}
    </div>
  );
}

function SuccessBox({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
      {message}
    </div>
  );
}
