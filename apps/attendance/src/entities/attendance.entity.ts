import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index(['employeeId', 'date'], { unique: true })
@Entity({ name: 'attendance' })
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  employeeId!: string;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'datetime', name: 'clock_in', nullable: true })
  clockIn?: Date | null;

  @Column({ type: 'datetime', name: 'clock_out', nullable: true })
  clockOut?: Date | null;
}
