import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { bootstrapAdmin } from './seed-bootstrap';

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  loadEnvConfig(process.cwd());
  const prisma = new PrismaClient();
  bootstrapAdmin(prisma, process.env).then(result => {
    console.log(result === 'created' ? 'Bootstrap administrator created; password change required.' : 'Administrator already exists; no accounts changed.');
  }).catch(() => {
    console.error('Bootstrap failed. Configure BOOTSTRAP_ADMIN_EMAIL and a private BOOTSTRAP_ADMIN_PASSWORD (15+ characters, at most 72 UTF-8 bytes); verify database migrations.');
    process.exitCode = 1;
  }).finally(() => prisma.$disconnect());
}
