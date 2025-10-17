import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  firebaseToken?: string;
}
