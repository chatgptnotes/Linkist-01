'use client';

import { motion } from 'framer-motion';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

interface DragIndicatorProps {
  isExpanded: boolean;
  onClick: () => void;
}

export default function DragIndicator({ isExpanded, onClick }: DragIndicatorProps) {
  return (
    <div
      className="flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
      onClick={onClick}
    >
      <div className="w-10 h-1.5 bg-white/50 rounded-full mb-1" />
      <motion.div
        animate={{ rotate: isExpanded ? 180 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <KeyboardArrowUpIcon className="text-white/70 w-5 h-5" />
      </motion.div>
    </div>
  );
}
