/**
 * ULE - TEST DE COMPONENTE BUTTON
 * Tests unitarios para el componente Button
 */

import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('applies default variant by default', () => {
    render(<Button>Default</Button>)
    const button = screen.getByRole('button')
    // Verificar que tiene las clases del variant primary
    expect(button).toHaveClass('bg-primary')
    expect(button).toHaveClass('text-white')
  })

  it('applies different variants', () => {
    const { rerender } = render(<Button variant="outline">Outline</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('border-2')
    expect(button).toHaveClass('border-primary')

    rerender(<Button variant="ghost">Ghost</Button>)
    expect(screen.getByRole('button')).toHaveClass('text-primary')
  })

  it('applies different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('text-sm')

    rerender(<Button size="lg">Large</Button>)
    expect(screen.getByRole('button')).toHaveClass('text-lg')
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows loading spinner when loading', () => {
    render(<Button loading>Loading</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    // El spinner tiene la clase animate-spin
    const spinner = button.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })
})
