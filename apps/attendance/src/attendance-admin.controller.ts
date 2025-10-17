import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { JwtTcpGuard, Role, Roles, RolesGuard } from '@app/common';

import { AttendanceService } from './attendance.service';
import { AdminAttendanceQueryDto } from './dto/admin-attendance-query.dto';

@UseGuards(JwtTcpGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/attendance')
export class AttendanceAdminController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  summary(@Query() query: AdminAttendanceQueryDto) {
    return this.attendanceService.getSummaryForAdmin(query);
  }
}
