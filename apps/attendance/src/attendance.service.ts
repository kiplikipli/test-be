import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { Attendance } from './entities/attendance.entity';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export interface AttendanceDateRange {
  from?: string;
  to?: string;
}

export interface AttendanceAdminQuery extends AttendanceDateRange {
  employeeId?: string;
}

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
  ) {}

  async clockIn(employeeId: string, timestamp = new Date()): Promise<Attendance> {
    if (!employeeId) {
      throw new BadRequestException('Employee identifier is required to clock in');
    }

    const date = this.formatDate(timestamp);

    let attendance = await this.attendanceRepository.findOne({ where: { employeeId, date } });

    if (!attendance) {
      attendance = this.attendanceRepository.create({ employeeId, date });
    }

    attendance.clockIn = timestamp;

    return this.attendanceRepository.save(attendance);
  }

  async clockOut(employeeId: string, timestamp = new Date()): Promise<Attendance> {
    if (!employeeId) {
      throw new BadRequestException('Employee identifier is required to clock out');
    }

    const record = await this.attendanceRepository.findOne({
      where: { employeeId, clockOut: IsNull() },
      order: { date: 'DESC' },
    });

    if (!record) {
      throw new NotFoundException('No active attendance record found for employee');
    }

    record.clockOut = timestamp;

    if (!record.date) {
      record.date = this.formatDate(timestamp);
    }

    return this.attendanceRepository.save(record);
  }

  async getSummaryByEmployee(employeeId: string, range: AttendanceDateRange = {}): Promise<Attendance[]> {
    if (!employeeId) {
      throw new BadRequestException('Employee identifier is required');
    }

    const { from, to } = this.normalizeRange(range);

    const qb = this.attendanceRepository.createQueryBuilder('attendance').where(
      'attendance.employeeId = :employeeId',
      { employeeId },
    );

    if (from) {
      qb.andWhere('attendance.date >= :from', { from });
    }

    if (to) {
      qb.andWhere('attendance.date <= :to', { to });
    }

    return qb.orderBy('attendance.date', 'DESC').getMany();
  }

  async getSummaryForAdmin(query: AttendanceAdminQuery = {}): Promise<Attendance[]> {
    const { from, to } = this.normalizeRange(query);
    const qb = this.attendanceRepository.createQueryBuilder('attendance');

    if (query.employeeId) {
      qb.andWhere('attendance.employeeId = :employeeId', { employeeId: query.employeeId });
    }

    if (from) {
      qb.andWhere('attendance.date >= :from', { from });
    }

    if (to) {
      qb.andWhere('attendance.date <= :to', { to });
    }

    return qb.orderBy('attendance.employeeId', 'ASC').addOrderBy('attendance.date', 'DESC').getMany();
  }

  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private normalizeRange(range: AttendanceDateRange): AttendanceDateRange {
    const from = this.normalizeDate(range.from);
    const to = this.normalizeDate(range.to);

    if (from && to && from > to) {
      throw new BadRequestException('`from` date must be before or equal to `to` date');
    }

    return { from, to };
  }

  private normalizeDate(value?: string): string | undefined {
    if (!value) {
      return undefined;
    }

    if (!DATE_REGEX.test(value)) {
      throw new BadRequestException('Dates must follow the YYYY-MM-DD format');
    }

    return value;
  }
}
