import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from './LoginPage'
import * as api from '../lib/api'
import { AuthContext } from '../contexts/AuthContext'

// Mock the api module
vi.mock('../lib/api', () => ({
  authMagicLink: vi.fn(),
  devLogin: vi.fn(),
  authMe: vi.fn(),
}))

// Mock react-router-dom navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  }
})

const mockAuthContext = {
  authenticated: false,
  user: null,
  loading: false,
  refresh: vi.fn(),
  logout: vi.fn(),
}

function renderLoginPage() {
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders magic link form and Google button', () => {
    renderLoginPage()
    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument()
    expect(screen.getByText('Enviar link mágico')).toBeInTheDocument()
    expect(screen.getByText('Entrar com Google')).toBeInTheDocument()
  })

  it('shows success state after sending magic link', async () => {
    vi.mocked(api.authMagicLink).mockResolvedValue({})

    renderLoginPage()

    const emailInput = screen.getByPlaceholderText('seu@email.com')
    const submitBtn = screen.getByText('Enviar link mágico')

    fireEvent.change(emailInput, { target: { value: 'user@test.com' } })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Link enviado!')).toBeInTheDocument()
    })

    expect(api.authMagicLink).toHaveBeenCalledWith('user@test.com', undefined)
    expect(screen.getByText(/Verifique seu e-mail/)).toBeInTheDocument()
  })

  it('shows loading state while sending magic link', async () => {
    let resolvePromise: () => void
    const pendingPromise = new Promise<void>((resolve) => { resolvePromise = resolve })
    vi.mocked(api.authMagicLink).mockReturnValue(pendingPromise as any)

    renderLoginPage()

    const emailInput = screen.getByPlaceholderText('seu@email.com')
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } })
    fireEvent.click(screen.getByText('Enviar link mágico'))

    await waitFor(() => {
      expect(screen.getByText('Enviando...')).toBeInTheDocument()
    })

    resolvePromise!()
  })

  it('shows error when magic link fails', async () => {
    vi.mocked(api.authMagicLink).mockRejectedValue({
      response: { data: { error: 'e-mail inválido' } },
    })

    renderLoginPage()

    const emailInput = screen.getByPlaceholderText('seu@email.com')
    fireEvent.change(emailInput, { target: { value: 'bad@test.com' } })
    fireEvent.click(screen.getByText('Enviar link mágico'))

    await waitFor(() => {
      expect(screen.getByText('e-mail inválido')).toBeInTheDocument()
    })
  })

  it('allows trying another email after success', async () => {
    vi.mocked(api.authMagicLink).mockResolvedValue({})

    renderLoginPage()

    const emailInput = screen.getByPlaceholderText('seu@email.com')
    fireEvent.change(emailInput, { target: { value: 'user@test.com' } })
    fireEvent.click(screen.getByText('Enviar link mágico'))

    await waitFor(() => screen.getByText('Link enviado!'))

    fireEvent.click(screen.getByText('Usar outro e-mail'))

    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument()
  })

  it('redirects authenticated user with display_name to /', async () => {
    const authedContext = {
      ...mockAuthContext,
      authenticated: true,
      user: { id: '1', email: 'a@b.com', display_name: 'João', photo_path: '', is_superadmin: false },
    }

    render(
      <AuthContext.Provider value={authedContext}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthContext.Provider>
    )

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
    })
  })

  it('redirects authenticated user without display_name to profile setup', async () => {
    const authedContext = {
      ...mockAuthContext,
      authenticated: true,
      user: { id: '1', email: 'a@b.com', display_name: '', photo_path: '', is_superadmin: false },
    }

    render(
      <AuthContext.Provider value={authedContext}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthContext.Provider>
    )

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/profile/setup', { replace: true })
    })
  })
})
