export type ThemeId = 'bottom-sheet' | 'overlay';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  thumbnail: string;
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'bottom-sheet',
    name: 'Classic',
    description: 'Draggable bottom sheet with glassmorphism overlay',
    thumbnail: '/themes/classic-preview.png',
  },
  {
    id: 'overlay',
    name: 'Overlay',
    description: 'Full-screen photo with gradient and centered layout',
    thumbnail: '/themes/overlay-preview.png',
  },
];

export function getThemeById(id: string): ThemeDefinition {
  return THEMES.find(t => t.id === id) || THEMES[0];
}
