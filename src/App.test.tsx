import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { SAMPLE_PROMPTS } from './agent/planner'
import App from './App'

const bodyRows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1)

function setup() {
  render(<App agentSpeed={1000} />)
  return userEvent.setup()
}

beforeEach(() => window.history.replaceState(null, '', '/'))

describe('type filter', () => {
  it('filters only when Search is pressed, and only on the complete type', async () => {
    const user = setup()
    const input = screen.getByRole('searchbox', { name: 'Type' })

    await user.type(input, 'ste')
    expect(bodyRows()).toHaveLength(10)

    await user.click(screen.getByRole('button', { name: 'Search' }))
    expect(screen.getByText(/The filter needs the complete type/)).toBeInTheDocument()

    await user.type(input, 'el')
    await user.click(screen.getByRole('button', { name: 'Search' }))
    expect(bodyRows()).toHaveLength(4)
    expect(window.location.search).toBe('?type=steel')
  })

  it('shows the full list again when the field is emptied', async () => {
    const user = setup()
    const input = screen.getByRole('searchbox', { name: 'Type' })
    await user.type(input, 'cement{Enter}')
    expect(bodyRows()).toHaveLength(2)

    await user.clear(input)
    expect(bodyRows()).toHaveLength(10)
    expect(window.location.search).toBe('')
  })

  it('restores the filter from a shared link', () => {
    window.history.replaceState(null, '', '/?type=steel')
    setup()
    expect(screen.getByRole('searchbox', { name: 'Type' })).toHaveValue('steel')
    expect(bodyRows()).toHaveLength(4)
  })
})

describe('assistant', () => {
  async function ask(user: ReturnType<typeof userEvent.setup>, prompt: string) {
    await user.click(screen.getByRole('textbox', { name: 'Message the assistant' }))
    await user.paste(prompt)
    await user.click(screen.getByRole('button', { name: 'Send' }))
  }

  it('P1 shows the two lowest steel EPDs side by side with A1–A3 highlighted', async () => {
    const user = setup()
    await ask(user, SAMPLE_PROMPTS.P1)
    expect(await screen.findByRole('heading', { name: 'Lowest GWP A1–A3, steel' })).toBeInTheDocument()
    const cards = screen.getAllByRole('article')
    expect(cards.map((c) => within(c).getByRole('heading').textContent)).toEqual([
      'Reinforcing bar B500B',
      'Structural tube ST-60',
    ])
    expect(within(cards[0]).getByText('Lowest')).toBeInTheDocument()
  })

  it('P2 shows two rows with GWP-luluc in place of GWP total', async () => {
    const user = setup()
    await ask(user, SAMPLE_PROMPTS.P2)
    expect(await screen.findByRole('heading', { name: 'Closest GWP-luluc in Mexico' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /GWP-luluc/ })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: /GWP total/ })).not.toBeInTheDocument()
    expect(bodyRows().map((row) => within(row).getAllByRole('cell')[1].textContent)).toEqual(['0.59', '0.62'])

    await user.click(screen.getByRole('button', { name: 'Back to list' }))
    expect(bodyRows()).toHaveLength(10)
  })

  it('answers other prompts by pointing to the samples', async () => {
    const user = setup()
    await ask(user, 'Which is the greenest cement?')
    expect(await screen.findByText(/runs the two sample prompts only/, undefined, { timeout: 3000 })).toBeInTheDocument()
  })
})
