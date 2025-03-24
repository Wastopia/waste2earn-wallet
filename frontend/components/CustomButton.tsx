import React from 'react';
import { clsx } from 'clsx';

interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  className,
  disabled,
  children,
  ...props
}) => (
  <button
    className={clsx(
      "px-4 py-2 rounded-lg transition-all duration-200",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      className
    )}
    disabled={disabled}
    {...props}
  >
    {children}
  </button>
);