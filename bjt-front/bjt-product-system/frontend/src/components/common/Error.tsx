import React from 'react';

interface ErrorProps {
  message: string;
}

const Error: React.FC<ErrorProps> = ({ message }) => {
  return (
    <div className="flex justify-center items-center min-h-[300px]">
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative max-w-md w-full" role="alert">
        <strong className="font-bold">Error! </strong>
        <span className="block sm:inline">{message}</span>
      </div>
    </div>
  );
};

export default Error; 