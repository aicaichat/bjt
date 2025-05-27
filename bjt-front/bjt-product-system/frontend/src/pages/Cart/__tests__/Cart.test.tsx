import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Cart from '../index'
import { CartProvider } from '@/contexts/CartContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { BrowserRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'

const renderCart = () => {
  return render(
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <Cart />
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}

describe('Cart Page', () => {
  test('renders cart page with items', async () => {
    renderCart()
    
    // Check if cart items are loaded
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument()
    })
    
    // Check if total price is calculated correctly
    expect(screen.getByText('¥200.00')).toBeInTheDocument()
  })
  
  test('updates item quantity', async () => {
    renderCart()
    
    // Wait for cart items to load
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument()
    })
    
    // Find and click increment button
    const incrementButton = screen.getByRole('button', { name: /\+/i })
    fireEvent.click(incrementButton)
    
    // Check if quantity is updated
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })
  
  test('removes item from cart', async () => {
    renderCart()
    
    // Wait for cart items to load
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument()
    })
    
    // Find and click remove button
    const removeButton = screen.getByRole('button', { name: /remove/i })
    fireEvent.click(removeButton)
    
    // Check if item is removed
    await waitFor(() => {
      expect(screen.queryByText('Test Product')).not.toBeInTheDocument()
    })
  })
  
  test('clears entire cart', async () => {
    renderCart()
    
    // Wait for cart items to load
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument()
    })
    
    // Find and click clear cart button
    const clearButton = screen.getByRole('button', { name: /clear cart/i })
    fireEvent.click(clearButton)
    
    // Check if cart is empty
    await waitFor(() => {
      expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument()
    })
  })
  
  test('proceeds to checkout', async () => {
    renderCart()
    
    // Wait for cart items to load
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument()
    })
    
    // Find and click checkout button
    const checkoutButton = screen.getByRole('button', { name: /checkout/i })
    fireEvent.click(checkoutButton)
    
    // Check if redirected to checkout page
    expect(window.location.pathname).toBe('/checkout')
  })
  
  test('handles API errors gracefully', async () => {
    // Mock API error
    server.use(
      http.get('/wp-json/bjt/v1/cart', () => {
        return new HttpResponse(null, { status: 500 })
      })
    )
    
    renderCart()
    
    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/failed to load cart/i)).toBeInTheDocument()
    })
  })
}) 