import { homeContentSchema, type HomeContentPayload } from './home-content';

export async function fetchHomeContent(signal?: AbortSignal): Promise<HomeContentPayload> {
  const response = await fetch('/api/home/content', { cache: 'no-store', signal });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Không tải được nội dung Trang chủ.');
  return { ...homeContentSchema.parse({ version: result.version, text: result.text, englishText: result.englishText }), isAdmin: result.isAdmin === true };
}
