/**
 * Stock utility functions
 */

export interface StockStatus {
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  colorClass: string;
  message: string;
}

export const getStockStatus = (quantity: number): StockStatus => {
  if (quantity === 0) {
    return {
      status: 'out-of-stock',
      colorClass: 'red',
      message: 'Out of Stock'
    };
  } else if (quantity <= 10) {
    return {
      status: 'low-stock',
      colorClass: 'orange',
      message: 'Low Stock'
    };
  } else {
    return {
      status: 'in-stock',
      colorClass: 'green',
      message: 'In Stock'
    };
  }
}; 