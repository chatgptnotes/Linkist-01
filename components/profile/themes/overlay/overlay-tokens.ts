import { CSSProperties } from 'react';

export const overlayStyles = {
  gradient: {
    background:
      'linear-gradient(to top, rgba(10,0,0,0.55) 0%, rgba(10,0,0,0.35) 25%, rgba(5,0,0,0.15) 50%, transparent 75%)',
  } as CSSProperties,

  frostedPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '999px',
    border: '1px solid rgba(255, 255, 255, 0.25)',
  } as CSSProperties,

  frostedSquare: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as CSSProperties,

  headingRed: {
    color: '#9B1B30',
  } as CSSProperties,

  contactPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '999px',
    height: '36px',
  } as CSSProperties,
};
