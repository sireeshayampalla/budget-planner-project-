import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  glass = false,
  ...props
}) => {
  const baseStyle = 'rounded-xl p-5 border transition-all duration-300';
  const normalStyle = 'bg-white dark:bg-darkcard border-gray-150 dark:border-darkborder shadow-sm';
  const glassStyle = 'glass-panel shadow-sm';
  const hoverStyle = 'hover:shadow-md hover:translate-y-[-2px]';

  return (
    <div
      className={`
        ${baseStyle}
        ${glass ? glassStyle : normalStyle}
        ${hoverEffect ? hoverStyle : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};
