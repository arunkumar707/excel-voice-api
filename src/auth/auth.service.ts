import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import type { JwtUser } from './jwt-payload.types';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private reservedSuperAdminUsername(): string | null {
    const u = this.config.get<string>('SUPER_ADMIN_USERNAME')?.trim();
    return u ? u : null;
  }

  private reservedSuperAdminPassword(): string {
    return this.config.get<string>('SUPER_ADMIN_PASSWORD') ?? '';
  }

  private resolveRoleOnRegister(username: string, password: string): UserRole {
    const su = this.reservedSuperAdminUsername();
    if (!su || username.trim() !== su) return UserRole.USER;
    const expected = this.reservedSuperAdminPassword();
    if (!expected || password !== expected) {
      throw new BadRequestException('Could not create this account.');
    }
    return UserRole.SUPER_ADMIN;
  }

  async register(username: string, password: string) {
    const u = username?.trim();
    const p = password ?? '';
    if (!u) throw new BadRequestException('username is required');
    if (p.length < 6) throw new BadRequestException('password must be at least 6 characters');
    const taken = await this.users.findOne({ where: { username: u } });
    if (taken) throw new BadRequestException('Username already taken');
    const role = this.resolveRoleOnRegister(u, p);
    const passwordHash = await bcrypt.hash(p, BCRYPT_ROUNDS);
    const user = this.users.create({ username: u, passwordHash, role });
    await this.users.save(user);
    return this.issueTokens(user);
  }

  async login(username: string, password: string) {
    const u = username?.trim();
    const p = password ?? '';
    if (!u || !p) throw new UnauthorizedException('Invalid credentials');
    const user = await this.users.findOne({ where: { username: u } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(p, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return this.issueTokens(user);
  }

  private issueTokens(user: User) {
    const payload: JwtUser = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };
    return {
      access_token: this.jwt.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  async me(user: JwtUser) {
    const row = await this.users.findOne({
      where: { id: user.sub },
      select: ['id', 'username', 'role', 'createdAt'],
    });
    if (!row) throw new UnauthorizedException();
    return {
      id: row.id,
      username: row.username,
      role: row.role,
      createdAt: row.createdAt,
    };
  }
}
