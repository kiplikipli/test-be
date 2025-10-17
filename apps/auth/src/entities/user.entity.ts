import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { Role } from '@app/common';

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
}
