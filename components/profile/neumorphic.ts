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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(255, 255, 255, 0.25)',
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
    backgroundColor: '#dc2626',
    borderRadius: '50%',
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '3px 3px 6px rgba(220,38,38,0.3)',
  } as CSSProperties,

  sheet: {
    borderTopLeftRadius: '24px',
    borderTopRightRadius: '24px',
    background: 'linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.05) 8%, rgba(0, 0, 0, 0.15) 18%, rgba(0, 0, 0, 0.35) 35%, rgba(0, 0, 0, 0.6) 55%, rgba(0, 0, 0, 0.85) 75%, rgba(0, 0, 0, 0.95) 100%)',
    backdropFilter: 'blur(20px) saturate(1.2)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
  } as CSSProperties,

  skillTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '999px',
  } as CSSProperties,
};
