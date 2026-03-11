import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import NotFound from './NotFound'

describe('NotFound Page', () => {
  it('renders without crashing', () => {
    const { container } = render(<MemoryRouter><NotFound /></MemoryRouter>)
    expect(container).toBeTruthy()
  })

  it('displays 404 text', () => {
    render(<MemoryRouter><NotFound /></MemoryRouter>)
    expect(document.body.textContent).toMatch(/404|not found/i)
  })
})
