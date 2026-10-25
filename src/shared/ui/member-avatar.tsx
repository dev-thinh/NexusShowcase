'use client';

import { type ComponentProps } from 'react';
import { MediaImage } from './media-image';

type MemberAvatarProps = Omit<ComponentProps<typeof MediaImage>, 'fallback'> & { fullName: string };

export function MemberAvatar({ fullName, className = '', style, width, height, ...props }: MemberAvatarProps) {
  const name = fullName.normalize('NFC').trim().replace(/\s+/g, ' ');
  // Derive the color from the name so SSR, navigation, and reloads all agree.
  let hash = 2166136261;
  for (const character of name.toLocaleLowerCase('vi')) {
    hash = Math.imul(hash ^ character.codePointAt(0)!, 16777619) >>> 0;
  }
  const background = `hsl(${(hash % 36000) / 100} 65% 35%)`;
  const lastWord = name.split(' ').at(-1) ?? '';
  const initial = Array.from(lastWord.match(/\p{L}/u)?.[0].toLocaleUpperCase('vi') ?? '?')[0];

  return <MediaImage {...props} className={className} style={style} width={width} height={height} fallback={
    <span role="img" aria-label={props.alt || fullName} data-member-avatar-fallback="true"
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden font-semibold ${className}`}
      style={{ ...style, backgroundColor: background, color: '#fff' }}>
      {initial}
    </span>
  } />;
}
