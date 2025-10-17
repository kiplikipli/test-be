import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { ProfileChangeLog } from './profile-change-log.entity';

@Entity({ name: 'employee_profiles' })
export class EmployeeProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  workEmail!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  phone?: string | null;

  @Column({ nullable: true })
  position?: string | null;

  @Column({ nullable: true })
  photoUrl?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => ProfileChangeLog, (log) => log.employee)
  changeLogs?: ProfileChangeLog[];
}
