import React from 'react';

interface ProductTypeCardProps {
  value: string;
  label: string;
  count: number;
  imageSrc: string;
  selected: boolean;
  onSelect: (value: string) => void;
}

const ProductTypeCard: React.FC<ProductTypeCardProps> = ({ value, label, count, imageSrc, selected, onSelect }) => {
  return (
    <div className="relative">
      <input
        type="radio"
        id={`product-type-${value}`}
        name="productType"
        className="sr-only"
        checked={selected}
        onChange={() => onSelect(value)}
      />
      <label
        htmlFor={`product-type-${value}`}
        className={`block p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 text-center w-40
          ${selected ? 'border-blue-500 bg-blue-50 shadow-lg scale-105' : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md hover:bg-blue-25'}`}
      >
        <div className="mb-4 flex justify-center">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={label}
              className="h-28 w-32 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/images/default-product-type.png';
              }}
            />
          ) : (
            <div className="h-28 w-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-sm font-medium">
              {label === 'All' ? 'All' : label.charAt(0)}
            </div>
          )}
        </div>
        <div className={`text-base font-medium flex flex-col items-center ${selected ? 'text-blue-700' : 'text-gray-700'}`}>
          <span>{label}</span>
          <span className="text-xs mt-1 text-blue-500">({count})</span>
        </div>
        {selected && (
          <div className="absolute -top-1 -right-1 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </label>
    </div>
  );
};

export default ProductTypeCard; 