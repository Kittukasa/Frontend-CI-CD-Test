import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import PrivacyPolicy from './PrivacyPolicy'

describe('PrivacyPolicy Page', () => {
  it('renders without crashing', () => {
    const { container } = render(<MemoryRouter><PrivacyPolicy /></MemoryRouter>)
    expect(container).toBeTruthy()
  })

  it('displays privacy policy content', () => {
    render(<MemoryRouter><PrivacyPolicy /></MemoryRouter>)
    expect(document.body.textContent).toMatch(/privacy/i)
  })
})
