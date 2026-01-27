import React from 'react';

export const Button = ({ children, onClick, type = 'button', variant = 'primary', disabled = false }) => {
  const baseClasses = 'px-6 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed';
  const variantClasses = {
    primary: 'bg-accent hover:bg-accent/80 text-white hover:-translate-y-0.5',
    secondary: 'bg-secondary hover:bg-secondary/80 text-light'
  };
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]}`}
      onClick={onClick} 
      type={type}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
