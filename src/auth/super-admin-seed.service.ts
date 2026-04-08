import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';

const BCRYPT_ROUNDS = 10;

/**
 * Creates the super admin row from env on startup if missing.
 * Set SUPER_ADMIN_USERNAME and SUPER_ADMIN_PASSWORD in server `.env` only — never in source.
 */
@Injectable()
export class SuperAdminSeedService implements OnModuleInit {
  private readonly log = new Logger(SuperAdminSeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    const username = this.config.get<string>('SUPER_ADMIN_USERNAME')?.trim();
    const password = this.config.get<string>('SUPER_ADMIN_PASSWORD') ?? '';
    if (!username || !password) return;

    const existing = await this.users.findOne({ where: { username } });
    if (existing) return;

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await this.users.save(
      this.users.create({
        username,
        passwordHash,
        role: UserRole.SUPER_ADMIN,
      }),
    );
    this.log.log(`Created super admin user from environment (username: ${username})`);
  }
}
