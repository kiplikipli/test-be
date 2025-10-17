import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Role } from '@app/common';

import { CreateEmployeeDto } from './dto/create-employee.dto';
import { Employee } from './entities/employee.entity';

@Injectable()
export class EmployeeService implements OnModuleInit {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async onModuleInit(): Promise<void> {
    const total = await this.employeeRepository.count();
    if (total === 0) {
      const seedEmployees = this.employeeRepository.create([
        {
          firstName: 'Alice',
          lastName: 'Anderson',
          email: 'alice@example.com',
          roles: [Role.ADMIN],
        },
        {
          firstName: 'Bob',
          lastName: 'Brown',
          email: 'bob@example.com',
          roles: [Role.EMPLOYEE],
        },
      ]);

      await this.employeeRepository.save(seedEmployees);
    }
  }

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
