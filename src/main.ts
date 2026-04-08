import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NEST_LISTEN_PORT_DEFAULT } from './nest-listen-port';

/** Allowed CORS origins: all localhost in dev + any origin listed in CORS_ORIGINS env var (comma-separated). */
function allowCorsOrigin(origin: string | undefined): boolean {
  if (!origin) return true;

  // Always allow extra origins from env (works for both http and https, dev and prod)
  const extra =
    process.env.CORS_ORIGINS?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  if (extra.includes(origin)) return true;

  try {
    const u = new URL(origin);
    // Allow any localhost or loopback in development
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return true;
  } catch {
    return false;
  }
  return false;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: (origin, cb) => cb(null, allowCorsOrigin(origin)),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.setGlobalPrefix('api/v1');
  const raw = process.env.PORT ?? String(NEST_LISTEN_PORT_DEFAULT);
  const parsed = Number.parseInt(raw, 10);
  const port = Number.isFinite(parsed) ? parsed : NEST_LISTEN_PORT_DEFAULT;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Nest API listening on port ${port} — routes at /api/v1/...`);
}
bootstrap();
