import { CSSProperties } from 'react';

export const neuStyles = {
  pill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '999px',
  } as CSSProperties,

  button: {
    backgroundColor: '#ffffff',
    boxShadow: '4px 4px 8px rgba(0,0,0,0.08), -4px -4px 8px rgba(255,255,255,0.9)',
    borderRadius: '14px',
  } as CSSProperties,

  glassButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '50%',
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
  } as CSSProperties,

  buttonPressed: {
    boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.06), inset -2px -2px 4px rgba(255,255,255,0.7)',
  } as CSSProperties,

  card: {
    backgroundColor: '#ffffff',
    boxShadow: '6px 6px 12px rgba(0,0,0,0.06), -6px -6px 12px rgba(255,255,255,0.9)',
    borderRadius: '16px',
  } as CSSProperties,

  redIconCircle: {
    backgroundColor: 'transparent',
    borderRadius: '10px',
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as CSSProperties,

  sheet: {
    borderRadius: '28px 28px 0 0',
    background: 'linear-gradient(180deg, rgba(30, 30, 40, 0.65) 0%, rgba(20, 20, 30, 0.80) 15%, rgba(15, 15, 25, 0.90) 40%, rgba(10, 10, 20, 0.95) 70%, rgba(5, 5, 15, 0.98) 100%)',
    backdropFilter: 'blur(40px) saturate(1.4)',
    WebkitBackdropFilter: 'blur(40px) saturate(1.4)',
    borderTop: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
  } as CSSProperties,

  skillTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '999px',
  } as CSSProperties,
};
