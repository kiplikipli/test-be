import { IsString } from 'class-validator';

export class ClockOutDto {
  @IsString()
  employeeId!: string;
}
