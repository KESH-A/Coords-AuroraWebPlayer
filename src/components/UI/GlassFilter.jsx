import React from 'react';

export const GlassFilter = () => {
  return (
    <>
      <svg className="absolute w-0 h-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="lg" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.008" numOctaves="2" seed="5" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="70" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <style>{`
        .glass-surface {
          backdrop-filter: url(#lg) blur(14px) saturate(180%);
          -webkit-backdrop-filter: blur(14px) saturate(180%);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
          will-change: transform;
        }
      `}</style>
    </>
  );
};