import React from 'react';
import { cn } from '@/lib/utils';

interface BillboxLogoProps {
  className?: string;
}

export const BillboxLogo: React.FC<BillboxLogoProps> = ({ className }) => {
  return (
    <div
      className={cn(
        'flex h-7 min-w-[80px] max-w-[140px] items-center justify-center sm:h-9 sm:min-w-[100px]',
        className
      )}
    >
      <img
        src="/images/logo-v1-official.png"
        alt="Billbox logo"
        className="max-h-full w-auto object-contain"
        loading="eager"
        decoding="async"
      />
    </div>
  );
};
