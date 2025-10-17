import { IsString } from 'class-validator';

export class AttendanceSummaryQueryDto {
  @IsString()
  employeeId!: string;
}
