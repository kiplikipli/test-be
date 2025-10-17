import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateEmployeeProfileDto {
  @IsEmail()
  @MaxLength(255)
  workEmail!: string;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  position?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  photoUrl?: string;
}
