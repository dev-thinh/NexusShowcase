'use client';

import React, { useState } from 'react';
import { HelpCircle, Info } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  iconOnly?: boolean;
}

export function Tooltip({ content, children, iconOnly = false }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-flex items-center group cursor-pointer"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      tabIndex={0}
      role="tooltip"
      aria-label={content}
    >
      {children ? (
        children
      ) : iconOnly ? (
        <Info className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
      ) : (
        <HelpCircle className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
      )}

      {isVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-slate-900 text-white text-xs rounded-lg shadow-xl z-50 pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95 leading-relaxed">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}
