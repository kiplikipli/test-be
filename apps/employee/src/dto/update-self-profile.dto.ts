import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSelfProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  position?: string;
}
