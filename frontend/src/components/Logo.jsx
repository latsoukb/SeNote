import React from 'react';

const SIZES = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-4xl',
  xl: 'text-6xl',
};

const Logo = ({ size = 'md', className = '', onItAdminTap }) => {
  const tapRef = React.useRef({ count: 0, timer: null });

  if (!onItAdminTap) {
    return (
      <span className={`font-bold tracking-tight ${SIZES[size]} ${className}`}>
        <span className="text-slate-900 dark:text-white">Se</span>
        <span className="text-brand-500">Note.</span>
      </span>
    );
  }

  const handleClick = () => {
    tapRef.current.count += 1;
    if (tapRef.current.timer) clearTimeout(tapRef.current.timer);
    if (tapRef.current.count >= 7) {
      tapRef.current.count = 0;
      onItAdminTap();
      return;
    }
    tapRef.current.timer = setTimeout(() => {
      tapRef.current.count = 0;
    }, 2000);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`font-bold tracking-tight ${SIZES[size]} ${className} cursor-default select-none bg-transparent border-0 p-0`}
      aria-label="SeNote"
    >
      <span className="text-slate-900 dark:text-white">Se</span>
      <span className="text-brand-500">Note.</span>
    </button>
  );
};

export default Logo;
