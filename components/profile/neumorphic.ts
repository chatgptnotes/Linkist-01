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
    boxShadow: '0 -8px 30px rgba(0,0,0,0.2)',
    background: 'linear-gradient(to bottom, rgba(60, 5, 18, 0.35) 0%, rgba(40, 5, 15, 0.45) 20%, rgba(20, 5, 10, 0.7) 45%, rgba(5, 2, 5, 0.92) 65%, rgba(0, 0, 0, 0.97) 100%)',
    backdropFilter: 'blur(40px) saturate(1.5)',
    WebkitBackdropFilter: 'blur(40px) saturate(1.5)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderBottom: 'none',
  } as CSSProperties,

  skillTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '999px',
  } as CSSProperties,
};
