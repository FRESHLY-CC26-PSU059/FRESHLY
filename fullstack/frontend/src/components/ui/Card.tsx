import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  id?: string;
}

const Card = ({ children, className = '', onClick, id }: CardProps) => {
  return (
    <div 
      id={id}
      onClick={onClick}
      className={`bg-app-surface border border-app-border rounded-2xl ${onClick ? 'cursor-pointer hover:border-primary-500/50 transition-colors' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
