# Order Service Documentation

The Order Service provides functionality for handling order-related operations in the application. It allows you to fetch cart items, get shipping information, calculate order summaries, and submit orders.

## Features

- Get cart items for order creation
- Get default shipping information for users
- Calculate order summaries (subtotal, shipping, tax, total)
- Submit orders with shipping and payment details

## Usage

### Import the Service

```typescript
import { orderService } from '../services';
// or
import orderService from '../services/orderService';
```

### Getting Cart Items

Retrieve the items in the user's cart that will be used for order creation:

```typescript
const getItems = async () => {
  try {
    const response = await orderService.getCartItems();
    setCartItems(response.data);
  } catch (error) {
    console.error('Error fetching cart items:', error);
  }
};
```

### Getting Default Shipping Information

Retrieve the user's default shipping address and contact information:

```typescript
const getShippingInfo = async () => {
  try {
    const response = await orderService.getDefaultShippingInfo();
    setShippingInfo(response.data);
  } catch (error) {
    console.error('Error fetching shipping info:', error);
  }
};
```

### Calculating Order Summary

Get the calculated order summary with subtotal, shipping costs, and taxes:

```typescript
const calculateSummary = async () => {
  try {
    const response = await orderService.calculateOrderSummary();
    setSummary(response.data);
  } catch (error) {
    console.error('Error calculating order summary:', error);
  }
};
```

### Submitting an Order

Submit the final order with all required information:

```typescript
const submitOrder = async () => {
  try {
    const orderData = {
      cartItems: cartItems,
      shippingInfo: shippingInfo,
      billingInfo: billingInfo,
      paymentMethod: selectedPaymentMethod
    };
    
    const response = await orderService.submitOrder(orderData);
    
    // Handle successful order submission
    setOrderId(response.data.orderId);
    navigateToConfirmationPage();
  } catch (error) {
    console.error('Error submitting order:', error);
  }
};
```

## Mock vs Production

The service automatically handles the differences between development and production environments:

- In development (when `USE_MOCK_DATA` is enabled), the service uses mock data
- In production, the service makes real API calls to the backend

No code changes are needed when switching between environments. 