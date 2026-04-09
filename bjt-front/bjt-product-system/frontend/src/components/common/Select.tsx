import React, { forwardRef } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[] | SelectGroup[];
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
  onChange?: (value: string) => void;
  className?: string;
  containerClassName?: string;
  labelClassName?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      options,
      label,
      helperText,
      error,
      fullWidth = true,
      onChange,
      className = '',
      containerClassName = '',
      labelClassName = '',
      ...props
    },
    ref
  ) => {
    // 判断是否为选项组
    const isGrouped = options.length > 0 && 'options' in options[0];

    // 处理变更事件
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onChange) {
        onChange(e.target.value);
      }
    };

    // 生成选择框容器类名
    const containerClasses = [
      'select-container',
      fullWidth ? 'w-full' : '',
      containerClassName
    ].filter(Boolean).join(' ');

    // 生成选择框类名
    const selectClasses = [
      'form-select',
      error ? 'border-error' : '',
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
          <select
            ref={ref}
            className={selectClasses}
            onChange={handleChange}
            aria-invalid={!!error}
            aria-describedby={`${props.id}-helper ${props.id}-error`}
            {...props}
          >
            {props.placeholder && (
              <option value="" disabled>
                {props.placeholder}
              </option>
            )}
            
            {isGrouped
              ? (options as SelectGroup[]).map((group, groupIndex) => (
                  <optgroup key={`group-${groupIndex}`} label={group.label}>
                    {group.options.map((option, optionIndex) => (
                      <option
                        key={`group-${groupIndex}-option-${optionIndex}`}
                        value={option.value}
                        disabled={option.disabled}
                      >
                        {option.label}
                      </option>
                    ))}
                  </optgroup>
                ))
              : (options as SelectOption[]).map((option, index) => (
                  <option
                    key={`option-${index}`}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </option>
                ))}
          </select>
          
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            {/* 自定义下拉箭头 */}
            <svg
              className="h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
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

Select.displayName = 'Select';

export default Select; 