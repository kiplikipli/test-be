import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { JwtTcpGuard, MessagePatterns, Role, Roles, RolesGuard } from '@app/common';

import { AttendanceService } from './attendance.service';
import { AttendanceSummaryQueryDto } from './dto/attendance-summary-query.dto';
import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @UseGuards(JwtTcpGuard)
  @Post('clock-in')
  clockIn(@Body() dto: ClockInDto) {
    return this.attendanceService.clockIn(dto);
  }

  @UseGuards(JwtTcpGuard)
  @Post('clock-out')
  clockOut(@Body() dto: ClockOutDto) {
    return this.attendanceService.clockOut(dto);
  }

  @UseGuards(JwtTcpGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get(':employeeId')
  summary(@Param() params: AttendanceSummaryQueryDto) {
    return this.attendanceService.findSummary(params.employeeId);
  }

  @MessagePattern(MessagePatterns.ATTENDANCE.QUERY_BY_PERSON)
  summaryRpc(@Payload('employeeId') employeeId: string) {
    return this.attendanceService.findSummary(employeeId);
  }
}
