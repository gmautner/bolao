import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import MatchesPage from './MatchesPage'
import * as api from '../lib/api'

// Mock the api module
vi.mock('../lib/api', () => ({
  getMatches: vi.fn(),
  getMyPredictions: vi.fn(),
  submitPrediction: vi.fn(),
}))

// Mock getFlag from DashboardPage
vi.mock('./DashboardPage', () => ({
  getFlag: (team: string) => team.charAt(0),
}))

function makeMatch(overrides: Partial<api.Match> = {}): api.Match {
  return {
    id: 'match-1',
    phase: 'group',
    phase_label: 'Fase de Grupos',
    match_number: 1,
    group_name: 'A',
    home_team: 'Brasil',
    away_team: 'México',
    home_score: null,
    away_score: null,
    has_extra_time: false,
    match_time: '2026-06-11T18:00:00Z',
    stadium: 'Azteca',
    city: 'Cidade do México',
    day_number: 1,
    status: 'open',
    ...overrides,
  }
}

const groupStageMatches: api.Match[] = [
  makeMatch({ id: 'm1', group_name: 'A', home_team: 'Brasil', away_team: 'México', match_number: 1 }),
  makeMatch({ id: 'm2', group_name: 'A', home_team: 'Escócia', away_team: 'Haiti', match_number: 2 }),
  makeMatch({ id: 'm3', group_name: 'B', home_team: 'Canadá', away_team: 'Catar', match_number: 3 }),
  makeMatch({ id: 'm4', group_name: 'B', home_team: 'Suíça', away_team: 'Japão', match_number: 4 }),
  makeMatch({ id: 'm5', group_name: 'C', home_team: 'Alemanha', away_team: 'Equador', match_number: 5 }),
]

/** Helper to find the phase tabs bar and click a specific tab button */
function clickPhaseTab(label: string) {
  // Phase tabs are <button> elements inside the scrollable tabs bar
  const buttons = screen.getAllByRole('button').filter(
    (b) => b.textContent === label && b.classList.contains('rounded-full')
  )
  fireEvent.click(buttons[0])
}

describe('MatchesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.getMyPredictions).mockResolvedValue([])
  })

  it('renders phase filter tabs', async () => {
    vi.mocked(api.getMatches).mockResolvedValue(groupStageMatches)

    render(<MatchesPage />)

    await waitFor(() => {
      expect(screen.getByText('Brasil')).toBeInTheDocument()
    })

    // Phase tabs should be visible as rounded-full buttons
    const tabButtons = screen.getAllByRole('button').filter(
      (b) => b.classList.contains('rounded-full')
    )
    const tabLabels = tabButtons.map((b) => b.textContent)
    expect(tabLabels).toContain('Todas')
    expect(tabLabels).toContain('Fase de Grupos')
  })

  it('does not show group-by-chave toggle when not on group phase', async () => {
    vi.mocked(api.getMatches).mockResolvedValue(groupStageMatches)

    render(<MatchesPage />)

    await waitFor(() => {
      expect(screen.getByText('Brasil')).toBeInTheDocument()
    })

    // On "Todas" phase — toggle should not appear
    expect(screen.queryByText('Agrupar por chave')).not.toBeInTheDocument()
  })

  it('shows group-by-chave toggle when group phase is selected', async () => {
    vi.mocked(api.getMatches).mockResolvedValue(groupStageMatches)

    render(<MatchesPage />)

    await waitFor(() => {
      expect(screen.getByText('Brasil')).toBeInTheDocument()
    })

    // Click "Fase de Grupos" tab
    clickPhaseTab('Fase de Grupos')

    await waitFor(() => {
      expect(screen.getByText('Agrupar por chave')).toBeInTheDocument()
    })
  })

  it('groups matches by chave when toggle is clicked', async () => {
    vi.mocked(api.getMatches).mockResolvedValue(groupStageMatches)

    render(<MatchesPage />)

    await waitFor(() => {
      expect(screen.getByText('Brasil')).toBeInTheDocument()
    })

    // Select "Fase de Grupos" tab
    clickPhaseTab('Fase de Grupos')

    await waitFor(() => {
      expect(screen.getByText('Agrupar por chave')).toBeInTheDocument()
    })

    // Click the toggle
    fireEvent.click(screen.getByText('Agrupar por chave'))

    // Group headers should appear (h2 elements with uppercase CSS — text in DOM is "Grupo A")
    await waitFor(() => {
      const headings = screen.getAllByRole('heading', { level: 2 })
      const headingTexts = headings.map((h) => h.textContent)
      expect(headingTexts).toContain('Grupo A')
      expect(headingTexts).toContain('Grupo B')
      expect(headingTexts).toContain('Grupo C')
    })
  })

  it('removes group headers when toggle is clicked again', async () => {
    vi.mocked(api.getMatches).mockResolvedValue(groupStageMatches)

    render(<MatchesPage />)

    await waitFor(() => {
      expect(screen.getByText('Brasil')).toBeInTheDocument()
    })

    // Select "Fase de Grupos" and enable grouping
    clickPhaseTab('Fase de Grupos')

    await waitFor(() => {
      expect(screen.getByText('Agrupar por chave')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Agrupar por chave'))

    await waitFor(() => {
      const headings = screen.getAllByRole('heading', { level: 2 })
      expect(headings.some((h) => h.textContent === 'Grupo A')).toBe(true)
    })

    // Click toggle again to disable grouping
    fireEvent.click(screen.getByText('Agrupar por chave'))

    await waitFor(() => {
      // h2 group headers should not exist when grouping is off and a specific phase is active
      const headings = screen.queryAllByRole('heading', { level: 2 })
      expect(headings.some((h) => h.textContent === 'Grupo A')).toBe(false)
      expect(headings.some((h) => h.textContent === 'Grupo B')).toBe(false)
    })
  })

  it('hides toggle and resets grouping when switching away from group phase', async () => {
    const mixedMatches = [
      ...groupStageMatches,
      makeMatch({ id: 'm6', phase: 'round_of_32', phase_label: 'Round de 32', group_name: '', match_number: 73, home_team: 'Japão', away_team: 'Coreia do Sul' }),
    ]
    vi.mocked(api.getMatches).mockResolvedValue(mixedMatches)

    render(<MatchesPage />)

    await waitFor(() => {
      expect(screen.getByText('Brasil')).toBeInTheDocument()
    })

    // Select group phase and enable grouping
    clickPhaseTab('Fase de Grupos')

    await waitFor(() => {
      expect(screen.getByText('Agrupar por chave')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Agrupar por chave'))

    await waitFor(() => {
      const headings = screen.getAllByRole('heading', { level: 2 })
      expect(headings.some((h) => h.textContent === 'Grupo A')).toBe(true)
    })

    // Switch to "Todas"
    clickPhaseTab('Todas')

    await waitFor(() => {
      // Toggle should disappear
      expect(screen.queryByText('Agrupar por chave')).not.toBeInTheDocument()
    })
  })

  it('sorts groups alphabetically (A, B, C...)', async () => {
    // Provide matches out of alphabetical order
    const unorderedMatches: api.Match[] = [
      makeMatch({ id: 'm1', group_name: 'C', home_team: 'Alemanha', away_team: 'Equador', match_number: 5 }),
      makeMatch({ id: 'm2', group_name: 'A', home_team: 'Brasil', away_team: 'México', match_number: 1 }),
      makeMatch({ id: 'm3', group_name: 'B', home_team: 'Canadá', away_team: 'Catar', match_number: 3 }),
    ]
    vi.mocked(api.getMatches).mockResolvedValue(unorderedMatches)

    render(<MatchesPage />)

    await waitFor(() => {
      expect(screen.getByText('Brasil')).toBeInTheDocument()
    })

    clickPhaseTab('Fase de Grupos')

    await waitFor(() => {
      expect(screen.getByText('Agrupar por chave')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Agrupar por chave'))

    await waitFor(() => {
      const headings = screen.getAllByRole('heading', { level: 2 })
      const groupHeadings = headings.filter((h) => h.textContent?.startsWith('Grupo'))
      expect(groupHeadings.map((h) => h.textContent)).toEqual(['Grupo A', 'Grupo B', 'Grupo C'])
    })
  })
})
