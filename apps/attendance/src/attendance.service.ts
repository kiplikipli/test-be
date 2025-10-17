import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';
import { AttendanceRecord } from './entities/attendance-record.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceRecord)
    private readonly attendanceRepository: Repository<AttendanceRecord>,
  ) {}

  clockIn(dto: ClockInDto): Promise<AttendanceRecord> {
    const record = this.attendanceRepository.create({
      employeeId: dto.employeeId,
      notes: dto.notes,
      clockOutAt: null,
    });
    return this.attendanceRepository.save(record);
  }

  async clockOut(dto: ClockOutDto): Promise<AttendanceRecord> {
    const record = await this.attendanceRepository.findOne({
      where: { employeeId: dto.employeeId, clockOutAt: IsNull() },
      order: { clockInAt: 'DESC' },
    });

    if (!record) {
      throw new NotFoundException('No active attendance record found for employee');
    }

    record.clockOutAt = new Date();
    return this.attendanceRepository.save(record);
  }

  findSummary(employeeId: string): Promise<AttendanceRecord[]> {
    return this.attendanceRepository.find({
      where: { employeeId },
      order: { clockInAt: 'DESC' },
    });
  }
}
