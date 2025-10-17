import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { MessagePatterns } from '@app/common';

import { EmployeeService } from './employee.service';

@Controller()
export class EmployeeRpcController {
  constructor(private readonly employeeService: EmployeeService) {}

  @MessagePattern(MessagePatterns.EMPLOYEE.GET_BY_ID)
  getById(@Payload('id') id: string) {
    return this.employeeService.findProfileById(id);
  }
}
