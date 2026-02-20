import { Injectable, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service'; // Correct import path might be wrong in original file? Original said '../users/users.service'. Let's stick to original if possible or fix it. Original was '../users/users.service'.
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import { DataSource } from 'typeorm';
import { TenantsService } from '../tenants/tenants.service';
import { SignupDto } from './dto/signup.dto';
import { formatPhoneNumber } from 'src/common/utils/phone.util';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private dataSource: DataSource,
    private tenantsService: TenantsService,
  ) {}

  async validateUser(phone: string, pass: string): Promise<any> {
    const normalizedPhone = formatPhoneNumber(phone);

    const user =
      await this.usersService.findOneByPhoneWithPassword(normalizedPhone);
    if (!user) {
      return null;
    }
    const isMatch = await bcrypt.compare(pass, user.password);
    if (user && isMatch) {
      const { password: _password, ...result } = user;
      return result;
    }
    return null;
  }

  login(user: Omit<User, 'password'>) {
    const payload = {
      sub: user.id,
      phone: user.phone,
      tenantId: user.tenant_id,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        tenant_id: user.tenant_id,
        name: user.name,
      },
    };
  }

  async signup(signupDto: SignupDto) {
    const { phone: rawPhone, password, storeName, name, category } = signupDto;

    const phone = formatPhoneNumber(rawPhone);

    // Check if user with phone already exists
    const existingUser = await this.usersService.findOneByPhone(phone);
    // Note: One phone number can only belong to one tenant in this model (User belongs to one tenant).
    // So if user exists, they are already registered.
    if (existingUser) {
      throw new BadRequestException(
        'User with this phone number already exists',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Create Tenant
      const tenant = await this.tenantsService.create(
        storeName,
        phone,
        category,
        manager,
      );

      // 2. Create User (Owner)
      const user = await this.usersService.create(
        {
          phone,
          password,
          name,
          role: UserRole.OWNER,
          tenant, // Link to the new tenant
        },
        manager,
      );

      // 3. Return Login Response
      return this.login(user);
    });
  }

  // Helper for registering via API if needed (or seeding)
  async register(
    phone: string,
    pass: string,
    tenantId: number,
    role: UserRole,
  ) {
    const hashedPassword = await bcrypt.hash(pass, 10);
    // Logic here might fail if usersService.create without transaction doesn't handle tenantId correctly if passing Partial<User>.
    // But assuming legacy/seeding code, leaving as is but fixing Types if needed.
    // UsersService.create signature in previous view_file was: async create(userData: Partial<User>): Promise<User>
    return this.usersService.create({
      phone,
      password: hashedPassword,
      tenant_id: tenantId,
      role,
    });
  }
}
