import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { MessagePatterns } from '@app/common';

import { AttendanceService, AttendanceDateRange } from './attendance.service';

interface AttendanceQueryPayload extends AttendanceDateRange {
  employeeId: string;
}

@Controller()
export class AttendanceRpcController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @MessagePattern(MessagePatterns.ATTENDANCE.QUERY_BY_PERSON)
  queryByPerson(@Payload() payload: AttendanceQueryPayload) {
    const { employeeId, ...range } = payload;
    return this.attendanceService.getSummaryByEmployee(employeeId, range);
  }
}
