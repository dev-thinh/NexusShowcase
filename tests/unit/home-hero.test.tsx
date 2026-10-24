import { HomeHero } from '@/features/publications/components/home-hero';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

describe('HomeHero', () => {
  it('opens the entire library through one primary action', () => {
    const markup = renderToStaticMarkup(<HomeHero />);

    expect(markup).toContain('id="home-hero-title"');
    expect(markup).toContain('href="/explore"');
    expect(markup).not.toContain('href="#home-search"');
    expect(markup).not.toContain('home-hero__secondary-action');
  });

  it('marks the animated technical artwork as decorative', () => {
    const markup = renderToStaticMarkup(<HomeHero />);

    expect(markup).toContain('data-home-hero-art="true"');
    expect(markup).toContain('aria-hidden="true"');
  });

  it('keeps the club logo readable and separate from the rotating artwork', () => {
    const markup = renderToStaticMarkup(<HomeHero />);

    expect(markup).toContain('src="/logo.svg?white=2"');
    expect(markup).toContain('alt="Logo CLB Robotics &amp; IoT"');
  });

  it('keeps the artwork minimal with ambient energy and a cursor spotlight', () => {
    const markup = renderToStaticMarkup(<HomeHero />);

    expect(markup).not.toContain('home-hero__pulse-wave');
    expect(markup).not.toContain('home-hero__heart-halo');
    expect(markup).toContain('home-hero__cursor-glow');
    expect(markup).toContain('home-hero__ambient-particle');
    expect(markup).not.toContain('home-hero__robot-frame');
    expect(markup).not.toContain('home-hero__vision-sensor');
  });
});
