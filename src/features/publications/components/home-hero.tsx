'use client';

import { ArrowRight } from 'lucide-react';
import { NavigationLink as Link } from '@/shared/navigation/navigation-link';
import React from 'react';

export function HomeHero() {
  const heroRef = React.useRef<HTMLElement>(null);
  const artRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    const navbar = document.getElementById('site-navbar');
    const hero = heroRef.current;
    if (!navbar || !hero) return;

    const updateNavbarHeight = () => {
      hero.style.setProperty('--hero-navbar-height', `${navbar.getBoundingClientRect().height}px`);
    };
    updateNavbarHeight();
    const observer = new ResizeObserver(updateNavbarHeight);
    observer.observe(navbar);
    return () => observer.disconnect();
  }, []);

  const moveSpotlight = (event: React.PointerEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--hero-pointer-x', `${event.clientX - bounds.left}px`);
    event.currentTarget.style.setProperty('--hero-pointer-y', `${event.clientY - bounds.top}px`);
    if (event.pointerType === 'mouse' && artRef.current) {
      const artBounds = artRef.current.getBoundingClientRect();
      const dx = event.clientX - (artBounds.left + artBounds.width / 2);
      const dy = event.clientY - (artBounds.top + artBounds.height / 2);
      const clampAngle = (value: number) => Math.max(-26, Math.min(26, value));
      const yaw = clampAngle(Math.atan2(dx, 550) * 180 / Math.PI);
      const pitch = clampAngle(-Math.atan2(dy, 550) * 180 / Math.PI);
      event.currentTarget.dataset.heartTracking = 'true';
      event.currentTarget.style.setProperty('--heart-tilt-y', `${yaw}deg`);
      event.currentTarget.style.setProperty('--heart-tilt-x', `${pitch}deg`);
      event.currentTarget.style.setProperty('--heart-follow-x', `${Math.tanh(dx / 450) * 22}px`);
      event.currentTarget.style.setProperty('--heart-follow-y', `${Math.tanh(dy / 450) * 16}px`);
    }
  };

  const resetSpotlight = () => {
    heroRef.current?.style.removeProperty('--hero-pointer-x');
    heroRef.current?.style.removeProperty('--hero-pointer-y');
    heroRef.current?.style.removeProperty('--heart-tilt-x');
    heroRef.current?.style.removeProperty('--heart-tilt-y');
    heroRef.current?.style.removeProperty('--heart-follow-x');
    heroRef.current?.style.removeProperty('--heart-follow-y');
    if (heroRef.current) delete heroRef.current.dataset.heartTracking;
  };

  return (
    <section
      ref={heroRef}
      className="home-hero"
      aria-labelledby="home-hero-title"
      onPointerMove={moveSpotlight}
      onPointerLeave={resetSpotlight}
    >
      <div className="home-hero__text-aurora" aria-hidden="true" />
      <div className="home-hero__intro-light" aria-hidden="true" />
      <div className="home-hero__cursor-glow" aria-hidden="true" />
      <div className="home-hero__glow home-hero__glow--one" aria-hidden="true" />
      <div className="home-hero__glow home-hero__glow--two" aria-hidden="true" />

      <div className="home-hero__grid container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="home-hero__intro relative z-10 max-w-3xl py-12 sm:py-16 lg:py-20">
          <p className="home-hero__eyebrow">CLB Robotics &amp; IoT · HCMUS</p>
          <h1 id="home-hero-title" className="home-hero__title">
            <span className="home-hero__title-line">Nơi ý tưởng chuyển động</span>
            <span className="home-hero__title-line home-hero__title-accent">thành công nghệ.</span>
          </h1>
          <p className="home-hero__copy">
            Không gian nghiên cứu Robotics, IoT và hệ thống nhúng, nơi ý tưởng được kiểm chứng
            bằng nguyên mẫu và công nghệ thực tế.
          </p>
          <div className="home-hero__actions mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/explore" className="home-hero__primary-action">
              <span>Khám phá công trình</span>
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div ref={artRef} className="home-hero__art" data-home-hero-art="true">
          <span className="home-hero__ambient-particle home-hero__ambient-particle--one" aria-hidden="true" />
          <span className="home-hero__ambient-particle home-hero__ambient-particle--two" aria-hidden="true" />
          <span className="home-hero__ambient-particle home-hero__ambient-particle--three" aria-hidden="true" />
          <span className="home-hero__ambient-particle home-hero__ambient-particle--four" aria-hidden="true" />
          <span className="home-hero__heart-shadow" aria-hidden="true" />
          <div className="home-hero__logo-core">
            <div className="home-hero__heart-tilt">
              <div className="home-hero__heart-sculpture">
                {[0, 1, 2, 3, 4, 5].map(layer => (
                  <span key={layer} className="home-hero__heart-depth" style={{ '--depth': layer } as React.CSSProperties} aria-hidden="true" />
                ))}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.svg?white=2" alt="Logo CLB Robotics &amp; IoT" />
                <span className="home-hero__heart-sheen" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
