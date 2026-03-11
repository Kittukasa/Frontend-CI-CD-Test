import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import TermsAndConditions from './TermsAndConditions'

describe('TermsAndConditions Page', () => {
  it('renders without crashing', () => {
    const { container } = render(<MemoryRouter><TermsAndConditions /></MemoryRouter>)
    expect(container).toBeTruthy()
  })

  it('displays terms content', () => {
    render(<MemoryRouter><TermsAndConditions /></MemoryRouter>)
    expect(document.body.textContent).toMatch(/terms/i)
  })
})
