'use client';

import { MediaImage } from '@/shared/ui/media-image';

import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { UserRound } from 'lucide-react';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';
import type { HomeMember, HomeMembersPayload } from '../model/home';
import type { PublicMemberRole } from '../model/directory';

const labels: Record<PublicMemberRole, string> = { ADMIN: 'Ban chủ nhiệm', CORE_MEMBER: 'Core Member', MEMBER: 'Thành viên' };

export function HomeMemberWall({ members, total }: HomeMembersPayload) {
  const [active, setActive] = useState<{ member: HomeMember; x: number; y: number; below: boolean; viewport: number[] } | null>(null);
  const tooltipId = useId();
  const remaining = Math.max(0, total - members.length);

  useEffect(() => {
    if (!active) return;
    const close = () => setActive(null);
    const onViewportChange = () => {
      // A scroll/resize event queued before the click can arrive after opening.
      // Dismiss only if the viewport has moved since this tooltip was positioned.
      const viewport = [window.scrollX, window.scrollY, window.innerWidth, window.innerHeight];
      if (viewport.some((value, index) => value !== active.viewport[index])) close();
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    const onPointer = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('[data-home-member-avatar]')) close();
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onViewportChange, true);
    window.addEventListener('resize', onViewportChange);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onViewportChange, true);
      window.removeEventListener('resize', onViewportChange);
    };
  }, [active]);

  const show = (member: HomeMember, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const below = rect.top < 100;
    setActive({ member, x: Math.max(116, Math.min(window.innerWidth - 116, rect.left + rect.width / 2)), y: below ? rect.bottom + 10 : rect.top - 10, below, viewport: [window.scrollX, window.scrollY, window.innerWidth, window.innerHeight] });
  };

  if (!members.length) return <p className="home-members-empty">Thông tin thành viên đang được cập nhật.</p>;

  return (
    <div className="home-members-wall">
      <div className="home-members-meta">
        <p>{total} thành viên</p>
        <div className="home-members-legend" aria-label="Vai trò thành viên">
          {(['ADMIN', 'CORE_MEMBER', 'MEMBER'] as const).map(role => <span key={role}><i className={`home-member-dot home-member-dot--${role.toLowerCase()}`} aria-hidden="true" />{labels[role]}</span>)}
        </div>
      </div>
      <div className="home-member-grid">
        {members.map(member => {
          return (
            <div className="home-member-slot" key={member.id}>
              <button
                type="button"
                data-home-member-avatar="true"
                data-member-id={member.id}
                data-role={member.role}
                className={`home-member-avatar home-member-avatar--${member.role.toLowerCase()}`}
                aria-label={`${member.fullName} · ${labels[member.role]}`}
                aria-describedby={active?.member.id === member.id ? tooltipId : undefined}
                onPointerEnter={event => { if (event.pointerType === 'mouse') show(member, event.currentTarget); }}
                onPointerLeave={event => { if (event.pointerType === 'mouse') setActive(null); }}
                onFocus={event => show(member, event.currentTarget)}
                onBlur={() => setActive(null)}
                onClick={event => show(member, event.currentTarget)}
              >
                <MediaImage src={member.avatarUrl} alt="" width={76} height={76} className="h-full w-full rounded-full object-cover" loading="lazy" decoding="async" />
              </button>
            </div>
          );
        })}
        {remaining > 0 && <Link href="/members" className="home-member-slot home-member-more" aria-label={`Xem tất cả ${total} thành viên, còn ${remaining} thành viên`}>
          <span className="home-member-more__circle"><UserRound size={22} aria-hidden="true" /><strong>+{remaining}</strong></span>
          <span className="home-member-more__label">Xem tất cả</span>
        </Link>}
      </div>
      {active && createPortal(
        <div id={tooltipId} role="tooltip" className={`home-member-tooltip${active.below ? ' home-member-tooltip--below' : ''}`} style={{ left: active.x, top: active.y }}>
          <strong>{active.member.fullName}</strong><span>{labels[active.member.role]}</span>
        </div>, document.body,
      )}
    </div>
  );
}
