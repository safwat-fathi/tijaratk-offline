import { Injectable, } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(phone: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByPhone(phone);
    if (!user) {
        return null;
    }
    const isMatch = await bcrypt.compare(pass, user.password);
    if (user && isMatch) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: User) {
    const payload = { 
        sub: user.id, 
        phone: user.phone, 
        tenantId: user.tenant_id,
        role: user.role 
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        tenant_id: user.tenant_id,
        name: user.phone // User entity doesn't have name? tech-doc says "Users belong to exactly one tenant". "User: id, tenant_id, phone, role". No name?
                  // Ah, wait. tech-doc User entity: "id, tenant_id, phone, role, created_at". No name. 
                  // But Customer has name. Tenant has name. 
      }
    };
  }

  // Helper for registering via API if needed (or seeding)
  async register(phone: string, pass: string, tenantId: number, role: any) {
      const hashedPassword = await bcrypt.hash(pass, 10);
      return this.usersService.create({
          phone,
          password: hashedPassword,
          tenant_id: tenantId,
          role
      });
  }
}

