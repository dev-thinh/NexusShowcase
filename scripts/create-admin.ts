import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import { parseArgs } from 'node:util';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { createAdditionalAdmin } from '../prisma/create-admin';

async function readPassword() {
  if (process.env.NEW_ADMIN_PASSWORD) return process.env.NEW_ADMIN_PASSWORD;
  if (!process.stdin.isTTY) throw Error('Run in an interactive terminal or supply NEW_ADMIN_PASSWORD.');
  // Readline handles editing while its output sink keeps the password invisible.
  const output = new Writable({ write(_chunk, _encoding, callback) { callback(); } });
  const prompt = createInterface({ input: process.stdin, output, terminal: true });
  process.stdout.write('Mật khẩu admin mới (ít nhất 15 ký tự): ');
  try { return await prompt.question(''); }
  finally { prompt.close(); process.stdout.write('\n'); }
}

async function main() {
  loadEnvConfig(process.cwd());
  const { values } = parseArgs({ options: { identifier: { type: 'string' }, hidden: { type: 'boolean', default: false } } });
  if (!values.identifier?.trim()) throw Error('Usage: npm run admin:create -- --identifier btlam --hidden');
  const password = await readPassword();
  if ([...password].length < 15 || Buffer.byteLength(password, 'utf8') > 72) throw Error('Mật khẩu cần ít nhất 15 ký tự, tối đa 72 byte UTF-8.');
  const prisma = new PrismaClient();
  try {
    await createAdditionalAdmin(prisma, { identifier: values.identifier, password, hidden: values.hidden });
    console.log(values.hidden ? 'Đã tạo admin ẩn khỏi danh sách thành viên, đội ngũ trang chủ và quản trị thành viên.' : 'Đã tạo thêm admin.');
    console.log('Đăng nhập và đổi mật khẩu ở lần đầu sử dụng.');
  } finally { await prisma.$disconnect(); }
}

main().catch((error: unknown) => {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : undefined;
  if (code === 'P2002') console.error('Tên đăng nhập đã tồn tại. Không thay đổi tài khoản cũ.');
  else if (code) console.error(`Không tạo được admin (${code}). Kiểm tra kết nối database và migration.`);
  else if (error instanceof Error && error.constructor === Error) console.error(error.message);
  else console.error('Không tạo được admin. Kiểm tra cấu hình server.');
  process.exitCode = 1;
});
