import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
};

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', children, className, ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200';
  
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-hover focus:ring-primary',
    secondary: 'bg-secondary text-white hover:bg-emerald-600 focus:ring-secondary',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-on-surface-variant hover:bg-gray-100',
  };

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ label, id, ...props }, ref) => (
  <div className="w-full">
    {label && <label htmlFor={id} className="block text-sm font-medium text-on-surface-variant mb-1">{label}</label>}
    <input
      id={id}
      ref={ref}
      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
      {...props}
    />
  </div>
));

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ label, id, children, ...props }, ref) => (
    <div className="w-full">
        {label && <label htmlFor={id} className="block text-sm font-medium text-on-surface-variant mb-1">{label}</label>}
        <select
            id={id}
            ref={ref}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
            {...props}
        >
            {children}
        </select>
    </div>
));

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
};

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
      <div className={`bg-surface rounded-lg shadow-xl w-full p-6 ${sizeClasses[size]}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-on-surface">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={`bg-surface rounded-lg shadow p-6 ${className}`}>
      {children}
    </div>
  );
};

export const ConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
}> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        <div className="text-on-surface-variant">{message}</div>
        <div className="flex justify-end space-x-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>Delete</Button>
        </div>
      </div>
    </Modal>
  );
};