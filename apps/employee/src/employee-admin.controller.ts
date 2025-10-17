import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { JwtTcpGuard, Role, Roles, RolesGuard } from '@app/common';

import { CreateEmployeeProfileDto } from './dto/create-employee-profile.dto';
import { UpdateEmployeeProfileDto } from './dto/update-employee-profile.dto';
import { EmployeeService } from './employee.service';

@UseGuards(JwtTcpGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('employees')
export class EmployeeAdminController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  create(@Body() dto: CreateEmployeeProfileDto) {
    return this.employeeService.createProfile(dto);
  }

  @Get()
  findAll() {
    return this.employeeService.findAllProfiles();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeeService.findProfileById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeProfileDto) {
    return this.employeeService.updateProfile(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employeeService.removeProfile(id);
  }
}
