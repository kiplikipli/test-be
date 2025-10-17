import { IsOptional, IsString } from 'class-validator';

export class ClockInDto {
  @IsString()
  employeeId!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
