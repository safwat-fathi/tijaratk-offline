import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';
import { genSalt, hash } from 'bcrypt';
import { Exclude } from 'class-transformer';

export enum UserRole {
  OWNER = 'owner',
  STAFF = 'staff',
}

@Entity('users')
export class User extends TenantBaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  phone: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  // Added for authentication purposes (hashed)
  @Exclude()
  @Column({ select: false })
  password: string;

  // ==================== Hooks ====================

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2')) {
      // Only hash if not already hashed (bcrypt hashes start with $2)
      const salt = await genSalt();
      this.password = await hash(this.password, salt);
    }
  }
}
