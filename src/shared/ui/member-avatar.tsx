'use client';

import { type ComponentProps } from 'react';
import { MediaImage } from './media-image';

type MemberAvatarProps = Omit<ComponentProps<typeof MediaImage>, 'fallback'> & { fullName: string };

export function MemberAvatar({ fullName, className = '', style, width, height, optimized, sizes, ...props }: MemberAvatarProps) {
  const name = fullName.normalize('NFC').trim().replace(/\s+/g, ' ');
  // Derive the color from the name so SSR, navigation, and reloads all agree.
  let hash = 2166136261;
  for (const character of name.toLocaleLowerCase('vi')) {
    hash = Math.imul(hash ^ character.codePointAt(0)!, 16777619) >>> 0;
  }
  const background = `hsl(${(hash % 36000) / 100} 65% 35%)`;
  const lastWord = name.split(' ').findLast(word => /\p{L}/u.test(word)) ?? '';
  const initial = Array.from(lastWord.match(/\p{L}/u)?.[0].toLocaleUpperCase('vi') ?? '?')[0];

  const useThumbnail = optimized ?? Boolean(props.src?.startsWith('/uploads/thumbnails/'));
  const displayWidth = width ?? 96;
  return <MediaImage {...props} optimized={useThumbnail} sizes={sizes ?? (useThumbnail ? `${displayWidth}px` : undefined)} className={className} style={style} width={useThumbnail ? displayWidth : width} height={useThumbnail ? height ?? displayWidth : height} fallback={
    <span role="img" aria-label={props.alt || fullName} data-member-avatar-fallback="true"
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden font-semibold ${className}`}
      style={{ ...style, backgroundColor: background, color: '#fff' }}>
      {initial}
    </span>
  } />;
}
