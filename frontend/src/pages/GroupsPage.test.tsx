import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import GroupsPage from './GroupsPage'
import * as api from '../lib/api'
import { AuthContext } from '../contexts/AuthContext'

vi.mock('../lib/api', () => ({
  getGroups: vi.fn(),
  createGroup: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

const mockUser = {
  id: 'user-1',
  email: 'test@test.com',
  display_name: 'Testador',
  photo_path: '',
  is_superadmin: false,
}

const mockAuthContext = {
  authenticated: true,
  user: mockUser,
  loading: false,
  refresh: vi.fn(),
  logout: vi.fn(),
}

function renderGroupsPage() {
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      <MemoryRouter>
        <GroupsPage />
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

describe('GroupsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders "Meus Grupos" heading', async () => {
    vi.mocked(api.getGroups).mockResolvedValue([])
    renderGroupsPage()
    expect(screen.getByText('Meus Grupos')).toBeInTheDocument()
  })

  it('shows empty state when user has no groups', async () => {
    vi.mocked(api.getGroups).mockResolvedValue([])
    renderGroupsPage()

    await waitFor(() => {
      expect(screen.getByText('Nenhum grupo ainda')).toBeInTheDocument()
    })
  })

  it('shows existing groups', async () => {
    vi.mocked(api.getGroups).mockResolvedValue([
      { id: 'g1', name: 'Grupo da Família' },
      { id: 'g2', name: 'Colegas de Trabalho' },
    ] as api.Group[])

    renderGroupsPage()

    await waitFor(() => {
      expect(screen.getByText('Grupo da Família')).toBeInTheDocument()
      expect(screen.getByText('Colegas de Trabalho')).toBeInTheDocument()
    })
  })

  it('opens create group modal/form when clicking header button', async () => {
    vi.mocked(api.getGroups).mockResolvedValue([])
    renderGroupsPage()

    await waitFor(() => screen.getByText('Meus Grupos'))

    // Click the "Criar grupo" button in the header
    fireEvent.click(screen.getByText('Criar grupo'))

    // Expect a name input to appear
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/nome do grupo/i)).toBeInTheDocument()
    })
  })

  it('calls createGroup API with correct name', async () => {
    vi.mocked(api.getGroups).mockResolvedValue([])
    vi.mocked(api.createGroup).mockResolvedValue({ id: 'new-g', name: 'Novo Grupo' } as api.Group)

    renderGroupsPage()
    await waitFor(() => screen.getByText('Meus Grupos'))

    // Open form
    fireEvent.click(screen.getByText('Criar grupo'))

    await waitFor(() => screen.getByPlaceholderText(/nome do grupo/i))

    const input = screen.getByPlaceholderText(/nome do grupo/i)
    fireEvent.change(input, { target: { value: 'Novo Grupo' } })

    // Submit — the form submit fires the handler directly
    const form = input.closest('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(api.createGroup).toHaveBeenCalledWith('Novo Grupo')
    })
  })
})
