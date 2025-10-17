import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { EmployeeProfile } from './employee.entity';

export interface ProfileDiffEntry {
  before: string | null;
  after: string | null;
}

export type ProfileDiff = Record<string, ProfileDiffEntry>;

@Entity({ name: 'employee_profile_change_logs' })
export class ProfileChangeLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  employeeId!: string;

  @ManyToOne(() => EmployeeProfile, (employee) => employee.changeLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  employee!: EmployeeProfile;

  @Column({ type: 'json' })
  diff!: ProfileDiff;

  @CreateDateColumn()
  createdAt!: Date;
}
