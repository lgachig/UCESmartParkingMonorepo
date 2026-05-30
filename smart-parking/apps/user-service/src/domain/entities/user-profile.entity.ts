export class UserProfileEntity {
  id!: string;
  authUserId!: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  createdAt!: Date;
  updatedAt!: Date;
}