import React, { useState } from 'react';
import { cn } from '../../utils/cn';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ src, name = 'User', size = 'md', className }: AvatarProps) {
  const [error, setError] = useState(false);

  const getInitials = (n: string) => {
    return n
      .split(' ')
      .map((part) => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
  };

  const wrapperClasses = cn(
    'relative inline-flex items-center justify-center overflow-hidden rounded-full bg-sand-200 shrink-0 border border-sand-300',
    sizeClasses[size],
    className
  );

  if (!src || error) {
    return (
      <div className={wrapperClasses}>
        <span className="font-medium text-navy-800">{getInitials(name)}</span>
      </div>
    );
  }

  return (
    <div className={wrapperClasses}>
      <img
        src={src}
        alt={name}
        onError={() => setError(true)}
        className="h-full w-full object-cover"
        loading="lazy"
        width="100"
        height="100"
      />
    </div>
  );
}
