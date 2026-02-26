'use client';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { THEMES, type ThemeId } from './index';

interface ThemeSelectorProps {
  selectedTheme: ThemeId;
  onSelect: (themeId: ThemeId) => void;
}

export default function ThemeSelector({ selectedTheme, onSelect }: ThemeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {THEMES.map((theme) => {
        const isSelected = selectedTheme === theme.id;

        return (
          <button
            key={theme.id}
            onClick={() => onSelect(theme.id)}
            className={`relative rounded-xl overflow-hidden border-2 transition-all duration-200 ${
              isSelected
                ? 'border-red-500 shadow-lg shadow-red-500/20'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            {/* Compact theme preview thumbnail */}
            <div className="aspect-[4/3] bg-gray-900 relative overflow-hidden">
              {theme.id === 'bottom-sheet' ? (
                <BottomSheetPreview />
              ) : (
                <OverlayPreview />
              )}

              {/* Selected checkmark overlay */}
              {isSelected && (
                <div className="absolute top-2 right-2 z-10">
                  <CheckCircleIcon className="w-6 h-6 text-red-500 drop-shadow-lg" />
                </div>
              )}
            </div>

            {/* Theme name */}
            <div className={`px-3 py-2 text-left ${isSelected ? 'bg-red-50' : 'bg-white'}`}>
              <span className={`text-sm font-semibold ${isSelected ? 'text-red-600' : 'text-gray-800'}`}>
                {theme.name}
              </span>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{theme.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Compact mini preview for the bottom-sheet theme
function BottomSheetPreview() {
  return (
    <div className="w-full h-full relative">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-800" />
      <div className="absolute inset-x-0 top-0 h-[55%] bg-gradient-to-br from-purple-400 via-blue-400 to-teal-300 opacity-60" />

      {/* Bottom sheet mockup */}
      <div className="absolute inset-x-0 bottom-0 h-[55%] rounded-t-lg bg-gradient-to-b from-transparent via-black/60 to-black/95">
        <div className="flex justify-center pt-1.5">
          <div className="w-6 h-0.5 rounded-full bg-white/40" />
        </div>
        <div className="px-3 pt-2">
          <div className="w-[65%] h-2 bg-white/80 rounded mb-1" />
          <div className="w-[45%] h-2 bg-white/80 rounded mb-1.5" />
          <div className="w-[35%] h-1 bg-white/30 rounded mb-2" />
          <div className="flex gap-1 mb-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-3.5 h-3.5 rounded-full bg-red-500/70" />
            ))}
          </div>
          <div className="border-t border-dashed border-white/20 mb-1.5" />
          <div className="w-[28%] h-1 bg-white/50 rounded mb-1" />
          <div className="w-full h-0.5 bg-white/20 rounded mb-0.5" />
          <div className="w-[80%] h-0.5 bg-white/20 rounded" />
        </div>
      </div>
    </div>
  );
}

// Compact mini preview for the overlay theme
function OverlayPreview() {
  return (
    <div className="w-full h-full relative">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-800" />
      <div className="absolute inset-x-0 top-0 h-[50%] bg-gradient-to-br from-purple-400 via-blue-400 to-teal-300 opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-t from-red-950/95 via-red-900/60 to-transparent" />

      {/* Floating badges */}
      <div className="absolute top-[12%] left-[10%]">
        <div className="px-1 py-0.5 rounded-full bg-white/15 border border-white/20">
          <span className="text-[5px] text-white/80">Skill</span>
        </div>
      </div>
      <div className="absolute top-[10%] right-[12%]">
        <div className="px-1 py-0.5 rounded-full bg-white/15 border border-white/20">
          <span className="text-[5px] text-white/80">Skill</span>
        </div>
      </div>

      {/* Centered content */}
      <div className="absolute inset-x-0 top-[35%] px-3 text-center">
        <div className="flex justify-center mb-0.5">
          <div className="w-[50%] h-2.5 bg-white/80 rounded" />
        </div>
        <div className="flex justify-center mb-1.5">
          <div className="w-[35%] h-2 bg-white/70 rounded" />
        </div>
        <div className="flex justify-center mb-2">
          <div className="w-[40%] h-1 bg-white/30 rounded" />
        </div>
        <div className="flex justify-center gap-1 mb-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-3.5 h-3.5 rounded bg-white/15 border border-white/20" />
          ))}
        </div>
        <div className="border-t border-dashed border-white/20 mb-1.5 mx-3" />
        <div className="flex justify-center mb-1">
          <div className="w-[22%] h-1 bg-red-400/60 rounded" />
        </div>
        <div className="flex justify-center mb-0.5">
          <div className="w-[70%] h-0.5 bg-white/20 rounded" />
        </div>
      </div>
    </div>
  );
}
