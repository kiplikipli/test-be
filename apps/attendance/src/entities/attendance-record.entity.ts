import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'attendance_records' })
export class AttendanceRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  employeeId!: string;

  @CreateDateColumn({ name: 'clock_in_at' })
  clockInAt!: Date;

  @Column({ name: 'clock_out_at', type: 'datetime', nullable: true })
  clockOutAt?: Date | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;
}
