import React from 'react';

const Logo = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl',
  };
  return (
    <span className={`font-bold tracking-tight ${sizes[size]} ${className}`}>
      <span className="text-slate-900 dark:text-white">Se</span>
      <span className="text-blue-600 dark:text-blue-400">Note</span>
    </span>
  );
};

export default Logo;
