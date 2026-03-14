'use client';

interface DragIndicatorProps {
  isExpanded: boolean;
  onClick: () => void;
}

export default function DragIndicator({ isExpanded, onClick }: DragIndicatorProps) {
  return (
    <div
      className="flex flex-col items-center pt-2 pb-1 cursor-grab active:cursor-grabbing"
      onClick={onClick}
    >
      <svg
        width="20"
        height="12"
        viewBox="0 0 20 12"
        fill="none"
        className="transition-transform duration-300"
        style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
      >
        <path
          d="M2 10L10 3L18 10"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
