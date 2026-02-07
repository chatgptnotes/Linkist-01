'use client';

interface DragIndicatorProps {
  isExpanded: boolean;
  onClick: () => void;
}

export default function DragIndicator({ isExpanded, onClick }: DragIndicatorProps) {
  return (
    <div
      className="flex flex-col items-center pt-3 pb-3 cursor-grab active:cursor-grabbing"
      onClick={onClick}
    >
      <div className="w-10 h-1.5 bg-white/50 rounded-full" />
    </div>
  );
}
