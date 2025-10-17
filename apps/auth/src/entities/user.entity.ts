import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { Role } from '@app/common';

import { hashPassword, isPasswordHash } from '../utils/password-hash';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ type: 'simple-array' })
  roles!: Role[];

  @Column({ nullable: true })
  employeeId!: string | null;

  @BeforeInsert()
  @BeforeUpdate()
  async ensurePasswordHash(): Promise<void> {
    if (!this.password || isPasswordHash(this.password)) {
      return;
    }

    this.password = await hashPassword(this.password);
  }
}
