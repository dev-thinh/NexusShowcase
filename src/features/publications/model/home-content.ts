import { z } from 'zod';

export const homeTextGroups = [
  { title: 'Banner', fields: [
    { key: 'heroEyebrow', label: 'Dòng giới thiệu', value: 'CLB Robotics & IoT - HCMUS' },
    { key: 'heroTitle', label: 'Tiêu đề dòng 1', value: 'Cùng nghiên cứu.' },
    { key: 'heroAccent', label: 'Tiêu đề dòng 2', value: 'Cùng sáng tạo.' },
    { key: 'heroDescription', label: 'Mô tả banner', value: 'Khám phá Robotics, IoT và hệ thống nhúng qua những dự án thực tế.' },
    { key: 'heroAction', label: 'Nhãn nút khám phá', value: 'Khám phá công trình' },
  ] },
  { title: 'Công trình nổi bật', fields: [
    { key: 'featuredEyebrow', label: 'Dòng giới thiệu', value: 'Dấu ấn nghiên cứu' },
    { key: 'featuredTitle', label: 'Tiêu đề', value: 'Công trình nổi bật' },
    { key: 'featuredAction', label: 'Nhãn nút xem tất cả', value: 'Xem nghiên cứu khoa học' },
  ] },
  { title: 'Hướng nghiên cứu', fields: [
    { key: 'researchEyebrow', label: 'Dòng giới thiệu', value: 'Hướng nghiên cứu' },
    { key: 'researchTitle', label: 'Tiêu đề', value: 'Nghiên cứu để ứng dụng' },
    { key: 'researchOneTitle', label: 'Thẻ 1 — tiêu đề', value: 'Trí tuệ nhân tạo & Thị giác máy tính' },
    { key: 'researchOneDescription', label: 'Thẻ 1 — mô tả', value: 'Ứng dụng học máy để nhận diện hình ảnh và hiểu dữ liệu.' },
    { key: 'researchTwoTitle', label: 'Thẻ 2 — tiêu đề', value: 'Robot tự hành & Điều khiển' },
    { key: 'researchTwoDescription', label: 'Thẻ 2 — mô tả', value: 'Giúp robot định vị, tìm đường và di chuyển tự động.' },
    { key: 'researchThreeTitle', label: 'Thẻ 3 — tiêu đề', value: 'Internet of Things & Hệ thống nhúng' },
    { key: 'researchThreeDescription', label: 'Thẻ 3 — mô tả', value: 'Kết nối cảm biến, giám sát và điều khiển thiết bị từ xa.' },
  ] },
  { title: 'Khoảnh khắc', fields: [
    { key: 'momentsEyebrow', label: 'Dòng giới thiệu', value: 'Hoạt động CLB' },
    { key: 'momentsTitle', label: 'Tiêu đề', value: 'Khoảnh khắc sáng tạo' },
  ] },
  { title: 'Thành viên', fields: [
    { key: 'membersEyebrow', label: 'Dòng giới thiệu', value: 'Đội ngũ CLB' },
    { key: 'membersTitle', label: 'Tiêu đề', value: 'Thành viên' },
    { key: 'membersAction', label: 'Nhãn nút xem tất cả', value: 'Xem tất cả thành viên' },
  ] },
] as const;

export type HomeTextKey = typeof homeTextGroups[number]['fields'][number]['key'];
export type HomeText = Record<HomeTextKey, string>;
const fields = homeTextGroups.flatMap(group => [...group.fields]);
export const defaultHomeText = Object.fromEntries(fields.map(field => [field.key, field.value])) as HomeText;
export const homeTextLimit = (key: HomeTextKey) => key.endsWith('Description') ? 1000 : ['researchOneTitle', 'researchTwoTitle', 'researchThreeTitle'].includes(key) ? 500 : 200;
const shape = Object.fromEntries(fields.map(field => [field.key, z.string().trim().min(1).max(homeTextLimit(field.key))])) as Record<HomeTextKey, z.ZodString>;
export const homeContentSchema = z.object({
  version: z.number().int().min(0).max(2_147_483_646),
  text: z.object(shape).strict(),
}).strict();
export type HomeContent = z.infer<typeof homeContentSchema>;
export type HomeContentPayload = HomeContent & { isAdmin: boolean };

export const homeTextLabel = (key: HomeTextKey) => {
  for (const group of homeTextGroups) {
    const field = group.fields.find(field => field.key === key);
    if (field) return `${group.title} — ${field.label}`;
  }
  return key;
};

/** Preserve existing custom copy while retiring the former split title fields. */
export function normalizeHomeText(value: unknown): HomeText {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return homeContentSchema.shape.text.parse(value);
  const text = { ...value } as Record<string, unknown>;
  delete text.membersDescription;
  if (text.featuredAction === 'Xem tất cả công trình') text.featuredAction = 'Xem nghiên cứu khoa học';
  for (const prefix of ['researchOne', 'researchTwo', 'researchThree']) {
    const subtitle = text[`${prefix}Subtitle`];
    const title = text[`${prefix}Title`];
    if (typeof subtitle === 'string' && subtitle.trim() && typeof title === 'string') {
      text[`${prefix}Title`] = `${title.trim()} & ${subtitle.trim()}`;
    }
    delete text[`${prefix}Subtitle`];
  }
  return homeContentSchema.shape.text.parse(text);
}
