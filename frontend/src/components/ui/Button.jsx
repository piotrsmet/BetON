import React from 'react';

export const Button = ({ children, onClick, type = 'button', variant = 'primary', disabled = false, className = '' }) => {
  const baseClasses = 'px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed';
  const variantClasses = {
    primary: 'bg-gradient-to-r from-accent to-accent-hover hover:shadow-accent/30 hover:shadow-lg text-dark hover:-translate-y-0.5',
    secondary: 'bg-surface hover:bg-surface/80 text-light border border-surface/50'
  };
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      onClick={onClick} 
      type={type}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
