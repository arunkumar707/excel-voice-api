import { UserRole } from '../entities/user.entity';

export type JwtUser = {
  sub: number;
  username: string;
  role: UserRole;
};
