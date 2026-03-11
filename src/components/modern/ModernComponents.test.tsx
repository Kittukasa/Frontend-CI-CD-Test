import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import ModernHero from './ModernHero'
import ModernCTA from './ModernCTA'
import HowItWorksSteps from './HowItWorksSteps'
import ProblemSolutionFlow from './ProblemSolutionFlow'
import VendorBenefits from './VendorBenefits'
import DashboardPreview from './DashboardPreview'

describe('Modern Components', () => {
  it('ModernHero renders without crashing', () => {
    const { container } = render(<MemoryRouter><ModernHero /></MemoryRouter>)
    expect(container).toBeTruthy()
  })

  it('ModernCTA renders without crashing', () => {
    const { container } = render(<MemoryRouter><ModernCTA /></MemoryRouter>)
    expect(container).toBeTruthy()
  })

  it('HowItWorksSteps renders without crashing', () => {
    const { container } = render(<MemoryRouter><HowItWorksSteps /></MemoryRouter>)
    expect(container).toBeTruthy()
  })

  it('ProblemSolutionFlow renders without crashing', () => {
    const { container } = render(<MemoryRouter><ProblemSolutionFlow /></MemoryRouter>)
    expect(container).toBeTruthy()
  })

  it('VendorBenefits renders without crashing', () => {
    const { container } = render(<MemoryRouter><VendorBenefits /></MemoryRouter>)
    expect(container).toBeTruthy()
  })

  it('DashboardPreview renders without crashing', () => {
    const { container } = render(<MemoryRouter><DashboardPreview /></MemoryRouter>)
    expect(container).toBeTruthy()
  })
})
