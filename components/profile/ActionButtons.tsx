'use client';

import ShareIcon from '@mui/icons-material/Share';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import { neuStyles } from './neumorphic';

interface ExtraAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}

interface ActionButtonsProps {
  onShare: () => void;
  onSaveContact: () => void;
  extraActions?: ExtraAction[];
}

export default function ActionButtons({ onShare, onSaveContact, extraActions }: ActionButtonsProps) {
  return (
    <div className="flex items-center gap-2.5">
      {extraActions?.map((action, i) => (
        <button
          key={i}
          onClick={action.onClick}
          className="transition-all active:scale-90"
          style={neuStyles.glassButton}
          title={action.label}
        >
          <action.icon className="w-[18px] h-[18px] text-white" />
        </button>
      ))}
      <button
        onClick={onSaveContact}
        className="transition-all active:scale-90"
        style={neuStyles.glassButton}
        title="Save contact"
      >
        <SaveAltIcon className="w-[18px] h-[18px] text-white" />
      </button>
      <button
        onClick={onShare}
        className="transition-all active:scale-90"
        style={neuStyles.glassButton}
        title="Share"
      >
        <ShareIcon className="w-[18px] h-[18px] text-white" />
      </button>
    </div>
  );
}
