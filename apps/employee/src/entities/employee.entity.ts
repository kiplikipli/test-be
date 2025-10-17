import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { Role } from '@app/common';

@Entity({ name: 'employees' })
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true })
  firebaseToken?: string;

  @Column({ type: 'simple-array', default: Role.EMPLOYEE })
  roles!: Role[];
}
