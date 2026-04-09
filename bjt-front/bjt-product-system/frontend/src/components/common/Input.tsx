import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  labelClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      fullWidth = true,
      startIcon,
      endIcon,
      className = '',
      containerClassName = '',
      labelClassName = '',
      ...props
    },
    ref
  ) => {
    // 生成输入框容器类名
    const containerClasses = [
      'input-container',
      fullWidth ? 'w-full' : '',
      containerClassName
    ].filter(Boolean).join(' ');

    // 生成输入框类名
    const inputClasses = [
      'form-input',
      error ? 'border-error' : '',
      startIcon ? 'pl-10' : '',
      endIcon ? 'pr-10' : '',
      className
    ].filter(Boolean).join(' ');

    // 生成标签类名
    const labelClasses = [
      'form-label',
      error ? 'text-error' : '',
      labelClassName
    ].filter(Boolean).join(' ');

    return (
      <div className={containerClasses}>
        {label && (
          <label htmlFor={props.id} className={labelClasses}>
            {label}
            {props.required && <span className="text-error ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {startIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              {startIcon}
            </div>
          )}
          
          <input
            ref={ref}
            className={inputClasses}
            aria-invalid={!!error}
            aria-describedby={`${props.id}-helper ${props.id}-error`}
            {...props}
          />
          
          {endIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              {endIcon}
            </div>
          )}
        </div>
        
        {helperText && !error && (
          <p id={`${props.id}-helper`} className="mt-1 text-sm text-text-light">
            {helperText}
          </p>
        )}
        
        {error && (
          <p id={`${props.id}-error`} className="mt-1 text-sm text-error">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input; 