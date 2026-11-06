
import { getServerI18n } from '@/shared/i18n/server';
import 'server-only';
import { prisma } from '@/server/db/prisma';
import { summarizeStorageUsage } from '../model/storage-usage';

/** Mount inside the authenticated admin dashboard only. */
export async function StorageUsage() {
  const { t: tr, locale } = await getServerI18n();

  const [assets, reservations] = await Promise.all([
    prisma.asset.findMany({ where: { deletedAt: null }, select: { byteSize: true, deletionStartedAt: true } }),
    prisma.uploadReservation.findMany({ select: { byteSize: true } }),
  ]);
  const configured = Number(process.env.UPLOAD_TOTAL_MAX_BYTES ?? 2 * 1024 * 1024 * 1024);
  if (!Number.isSafeInteger(configured) || configured < 1) throw new Error('Invalid upload quota configuration');
  const usage = summarizeStorageUsage(assets, reservations, BigInt(configured));
  const mib = (value: bigint) => (Number(value) / 1024 / 1024).toLocaleString(locale === 'en' ? 'en-GB' : 'vi-VN', { maximumFractionDigits: 1 });
  return <section aria-labelledby="storage-usage-title" className="panel-operational mb-7 !rounded-xl !shadow-none">
    <h3 id="storage-usage-title" className="mb-2 text-base font-semibold text-slate-900">{tr("Dung lượng lưu trữ")}</h3>
    <p className="text-sm text-slate-700">{mib(usage.bytes)} / {mib(usage.limitBytes)} MiB · {usage.files.toLocaleString(locale === 'en' ? 'en-GB' : 'vi-VN')}{tr(" tệp và lượt tải đang giữ chỗ")}</p>
    <progress aria-label={tr("Dung lượng lưu trữ đã sử dụng")} value={usage.percent} max={100} className="my-3 h-2 w-full accent-[#153D67]" />
    <p className="text-xs text-slate-500">{tr("Đang giữ chỗ: ")}{usage.pending}{tr(" · Đang cách ly để dọn dẹp: ")}{usage.quarantined}{tr(". Tệp không còn được sử dụng vẫn chiếm dung lượng cho đến khi quản trị viên dọn dẹp.")}</p>
    {usage.unknownSizes > 0 && <p className="mt-2 text-xs text-slate-500">{usage.unknownSizes}{tr(" tệp cũ chưa xác định kích thước được tính tạm 25 MiB mỗi tệp.")}</p>}
  </section>;
}
