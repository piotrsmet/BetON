import React from 'react';

export const Loader = () => {
  return (
    <div className="flex justify-center items-center p-4">
      <div className="w-10 h-10 border-4 border-light/30 border-t-accent rounded-full animate-spin"></div>
    </div>
  );
};
