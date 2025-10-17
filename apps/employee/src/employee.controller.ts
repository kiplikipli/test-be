import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Request } from 'express';

import {
  AuthenticatedUser,
  JwtTcpGuard,
  MessagePatterns,
  Role,
  Roles,
  RolesGuard,
} from '@app/common';

import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeService } from './employee.service';

@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @UseGuards(JwtTcpGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeeService.create(dto);
  }

  @UseGuards(JwtTcpGuard)
  @Get()
  findAll() {
    return this.employeeService.findAll();
  }

  @UseGuards(JwtTcpGuard)
  @Get('me')
  profile(@Req() request: Request & { user?: AuthenticatedUser }) {
    return request.user ?? null;
  }

  @MessagePattern(MessagePatterns.EMPLOYEE.GET_BY_ID)
  getById(@Payload('id') id: string) {
    return this.employeeService.findOne(id);
  }
}
