import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Button } from './button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog'

describe('Button Component', () => {
  it('renders with default variant', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeTruthy()
  })

  it('renders with destructive variant', () => {
    render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByText('Delete')).toBeTruthy()
  })

  it('renders with outline variant', () => {
    render(<Button variant="outline">Outline</Button>)
    expect(screen.getByText('Outline')).toBeTruthy()
  })

  it('renders with ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>)
    expect(screen.getByText('Ghost')).toBeTruthy()
  })

  it('renders with link variant', () => {
    render(<Button variant="link">Link</Button>)
    expect(screen.getByText('Link')).toBeTruthy()
  })

  it('renders as disabled', () => {
    render(<Button disabled>Disabled</Button>)
    const btn = screen.getByText('Disabled')
    expect(btn).toBeTruthy()
  })

  it('renders with small size', () => {
    render(<Button size="sm">Small</Button>)
    expect(screen.getByText('Small')).toBeTruthy()
  })

  it('renders with large size', () => {
    render(<Button size="lg">Large</Button>)
    expect(screen.getByText('Large')).toBeTruthy()
  })
})

describe('Tooltip Component', () => {
  it('renders tooltip with trigger', () => {
    const { container } = render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
    expect(container).toBeTruthy()
    expect(screen.getByText('Hover me')).toBeTruthy()
  })
})

describe('Dialog Component', () => {
  it('renders dialog trigger', () => {
    const { container } = render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogHeader>
          <p>Dialog content</p>
        </DialogContent>
      </Dialog>
    )
    expect(container).toBeTruthy()
    expect(screen.getByText('Open Dialog')).toBeTruthy()
  })
})
