import { safeHttpUrlSchema, trimmedText } from '@/shared/lib/validation';
import { z } from 'zod';

export const profileLinkSchema = z.object({ title: trimmedText(80).min(1), url: safeHttpUrlSchema });
export type ProfileLink = z.infer<typeof profileLinkSchema>;
export const profileInputSchema = z.object({
  fullName: trimmedText(200).min(1, 'Vui lòng nhập họ tên.'),
  bio: trimmedText(2000),
  links: z.array(profileLinkSchema).max(12),
});
export type ProfileInput = z.input<typeof profileInputSchema>;

const editableProfileLink = z.object({ title: trimmedText(80), url: trimmedText(2048) }).superRefine((link, context) => {
  if (!link.title && !link.url) return;
  const parsed = profileLinkSchema.safeParse(link);
  if (!parsed.success) for (const issue of parsed.error.issues) context.addIssue({ code: 'custom', path: issue.path, message: issue.path[0] === 'title' ? 'Vui lòng nhập tên hiển thị.' : 'Vui lòng nhập liên kết HTTP(S) hợp lệ.' });
});
export const profileFormSchema = profileInputSchema.extend({ links: z.array(editableProfileLink).max(12, 'Bạn có thể thêm tối đa 12 liên kết.') });

export function getProfileLinks(user: { profileLinks?: unknown; githubUrl?: string | null; linkedinUrl?: string | null; googleScholarUrl?: string | null; portfolioUrl?: string | null }): ProfileLink[] {
  if (user.profileLinks != null) {
    const parsed = z.array(profileLinkSchema).safeParse(user.profileLinks);
    return parsed.success ? parsed.data : [];
  }
  return [
    { title: 'GitHub', url: user.githubUrl },
    { title: 'LinkedIn', url: user.linkedinUrl },
    { title: 'Google Scholar', url: user.googleScholarUrl },
    { title: 'Trang cá nhân', url: user.portfolioUrl },
  ].flatMap(link => { const parsed = profileLinkSchema.safeParse(link); return parsed.success ? [parsed.data] : []; });
}
