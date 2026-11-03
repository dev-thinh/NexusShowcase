export function ClubLogo() {
  return <span
    role="img"
    aria-label="CLB Robotics & IoT - HCMUS"
    className="block w-full max-w-full"
    style={{
      aspectRatio: '1080 / 340',
      backgroundColor: 'var(--club-logo-color, var(--brand-blue))',
      maskImage: 'url(/robotics-iot-club-hcmus.png)',
      maskSize: 'contain',
      maskPosition: 'center',
      maskRepeat: 'no-repeat',
      WebkitMaskImage: 'url(/robotics-iot-club-hcmus.png)',
      WebkitMaskSize: 'contain',
      WebkitMaskPosition: 'center',
      WebkitMaskRepeat: 'no-repeat',
    }}
  />;
}
