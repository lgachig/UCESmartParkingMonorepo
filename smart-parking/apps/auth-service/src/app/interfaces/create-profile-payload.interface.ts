export interface CreateProfilePayload {
  authUserId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
}
