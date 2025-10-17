import { BadRequestException, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';

import { AuthenticatedUser, JwtTcpGuard, Role, Roles, RolesGuard } from '@app/common';

import { AttendanceService } from './attendance.service';
import { AttendanceRangeDto } from './dto/attendance-range.dto';

interface RequestWithUser {
  user?: AuthenticatedUser;
}

@UseGuards(JwtTcpGuard, RolesGuard)
@Roles(Role.EMPLOYEE)
@Controller('attendance')
export class AttendanceHttpController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  clockIn(@Req() request: RequestWithUser) {
    const employeeId = this.getEmployeeId(request.user);
    return this.attendanceService.clockIn(employeeId);
  }

  @Post('clock-out')
  clockOut(@Req() request: RequestWithUser) {
    const employeeId = this.getEmployeeId(request.user);
    return this.attendanceService.clockOut(employeeId);
  }

  @Get('summary')
  summary(@Req() request: RequestWithUser, @Query() query: AttendanceRangeDto) {
    const employeeId = this.getEmployeeId(request.user);
    return this.attendanceService.getSummaryByEmployee(employeeId, query);
  }

  private getEmployeeId(user?: AuthenticatedUser): string {
    if (!user?.employeeId) {
      throw new BadRequestException('Authenticated employee context is required');
    }

    return user.employeeId;
  }
}
