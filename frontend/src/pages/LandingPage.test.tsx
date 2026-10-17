import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { LandingPage } from './LandingPage'

describe('LandingPage', () => {
  it('renders the page content and passes accessibility checks', async () => {
    const { container } = render(<LandingPage />)
    expect(screen.getByText('ALTLUME')).toBeInTheDocument()
    const results = await axe(container)
    expect(results.violations).toHaveLength(0)
  })
})
