import { IsOptional, IsString } from 'class-validator';

import { AttendanceRangeDto } from './attendance-range.dto';

export class AdminAttendanceQueryDto extends AttendanceRangeDto {
  @IsOptional()
  @IsString()
  employeeId?: string;
}
