import React from 'react';

const SIZES = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-4xl',
  xl: 'text-6xl',
};

const Logo = ({ size = 'md', className = '' }) => (
  <span className={`font-bold tracking-tight ${SIZES[size]} ${className}`}>
    <span className="text-slate-900 dark:text-white">Se</span>
    <span className="text-brand-500">Note.</span>
  </span>
);

export default Logo;
