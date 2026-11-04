import { z } from 'zod';

export const MAX_CONFERENCE_RANKINGS = 8;
const optionalDate = z.iso.date({ error: 'Vui lòng chọn ngày hợp lệ.' }).nullish();
export const conferenceSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên hội nghị.').max(240, 'Tên hội nghị tối đa 240 ký tự.'),
  status: z.enum(['ACCEPTED', 'PUBLISHED']).default('ACCEPTED'),
  publicationDate: optionalDate,
  eventDate: optionalDate,
  acceptedDate: optionalDate,
  rankings: z.array(z.object({
    system: z.string().trim().min(1, 'Nhập hệ thống xếp hạng.').max(80, 'Tối đa 80 ký tự.'),
    rank: z.string().trim().min(1, 'Nhập mức hạng.').max(40, 'Tối đa 40 ký tự.'),
  }).strict()).max(MAX_CONFERENCE_RANKINGS, 'Tối đa 8 xếp hạng.').default([]),
}).strict().superRefine((value, context) => {
  const seen = new Set<string>();
  value.rankings.forEach((entry, index) => {
    const key = JSON.stringify([entry.system.toLowerCase(), entry.rank.toLowerCase()]);
    if (seen.has(key)) context.addIssue({ code: 'custom', path: ['rankings', index, 'rank'], message: 'Xếp hạng này đã được thêm.' });
    seen.add(key);
  });
});
export type Conference = z.output<typeof conferenceSchema>;
export type ConferenceInput = z.input<typeof conferenceSchema>;

/** JSON from legacy rows or snapshots is never rendered without validation. */
export function readConference(value: unknown): Conference | null {
  const parsed = conferenceSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
export function formatConferenceDate(date: string) {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}


export function conferenceMilestone(conference: Conference) {
  return conference.status === 'PUBLISHED'
    ? { label: 'Công bố', dateLabel: 'Ngày công bố', statusLabel: 'Đã công bố', date: conference.publicationDate }
    : { label: 'Chấp nhận', dateLabel: 'Ngày chấp nhận đăng', statusLabel: 'Đã chấp nhận', date: conference.acceptedDate };
}
