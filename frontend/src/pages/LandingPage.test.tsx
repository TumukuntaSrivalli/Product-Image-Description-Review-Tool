import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { axe } from 'vitest-axe'
import { LandingPage } from './LandingPage'

describe('LandingPage', () => {
  it('renders the page content and passes accessibility checks', async () => {
    const { container } = render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    )
    expect(screen.getAllByText('VarnX')[0]).toBeInTheDocument()
    const results = await axe(container)
    expect(results.violations).toHaveLength(0)
  })
})
