import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateUserProfileDto {
  @IsUUID()
  authUserId!: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  role?: string;
}