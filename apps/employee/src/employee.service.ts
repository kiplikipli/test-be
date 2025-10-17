import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Role } from '@app/common';

import { CreateEmployeeDto } from './dto/create-employee.dto';
import { Employee } from './entities/employee.entity';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  create(dto: CreateEmployeeDto): Promise<Employee> {
    const entity = this.employeeRepository.create({
      ...dto,
      roles: [Role.EMPLOYEE],
    });
    return this.employeeRepository.save(entity);
  }

  findAll(): Promise<Employee[]> {
    return this.employeeRepository.find();
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({ where: { id } });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    return employee;
  }
}
