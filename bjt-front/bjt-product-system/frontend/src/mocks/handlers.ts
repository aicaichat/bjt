import { http, HttpResponse } from 'msw'

// Mock cart items
const mockCartItems = [
  {
    id: 1,
    name: 'Test Product',
    price: 100,
    quantity: 2,
    image: 'test.jpg',
    type: 'machine'
  }
]

export const handlers = [
  // Get cart items
  http.get('/wp-json/bjt/v1/cart', () => {
    return HttpResponse.json({ items: mockCartItems })
  }),
  
  // Update cart item
  http.put('/wp-json/bjt/v1/cart/:id', () => {
    return HttpResponse.json({ success: true })
  }),
  
  // Remove cart item
  http.delete('/wp-json/bjt/v1/cart/:id', () => {
    return HttpResponse.json({ success: true })
  }),
  
  // Clear cart
  http.delete('/wp-json/bjt/v1/cart', () => {
    return HttpResponse.json({ success: true })
  })
] 