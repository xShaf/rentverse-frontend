import { create } from 'zustand'
import type { User, AuthState } from '@/types/auth'
import { AuthApiClient } from '@/utils/authApiClient'
import { setCookie, deleteCookie } from '@/utils/cookies'

interface AuthActions {
  setPassword: (password: string) => void
  submitLogIn: () => Promise<{ success: boolean; requireMFA?: boolean; message?: string }>
  submitOtp: (otp: string) => Promise<{ success: boolean; message?: string }>
  setFirstName: (firstName: string) => void
  setLastName: (lastName: string) => void
  setBirthdate: (birthdate: string) => void
  setEmail: (email: string) => void
  setPhone: (phone: string) => void
  setSignUpPassword: (password: string) => void
  submitSignUp: () => Promise<void>
  validateEmail: (email: string) => boolean
  submitEmailCheck: () => Promise<{ exists: boolean; isActive: boolean; role: string | null } | null>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  logout: () => void
  resetForm: () => void
  isLoginFormValid: () => boolean
  isSignUpFormValid: () => boolean
  initializeAuth: () => void
  validateToken: () => Promise<boolean>
  refreshUserData: () => Promise<boolean>
  checkAuthStatusOnLoad: () => Promise<void>
  // ✅ Added Email OTP method
  sendEmailOtp: () => Promise<{ success: boolean; message?: string }>
}

interface AuthFormState {
  password: string
  firstName: string
  lastName: string
  birthdate: string
  email: string
  phone: string
  signUpPassword: string
}

type AuthStore = AuthState & AuthFormState & AuthActions & { 
  tempToken: string | null;
  isAuthLoading: boolean;
  token: string | null; 
}

const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoggedIn: false,
  isLoading: false,
  isAuthLoading: true,
  error: null,
  password: '',
  firstName: '',
  lastName: '',
  birthdate: '',
  email: '',
  phone: '',
  signUpPassword: '',
  tempToken: null,
  token: null,

  setPassword: (password: string) => set({ password }),
  setFirstName: (firstName: string) => set({ firstName }),
  setLastName: (lastName: string) => set({ lastName }),
  setBirthdate: (birthdate: string) => set({ birthdate }),
  setEmail: (email: string) => set({ email }),
  setPhone: (phone: string) => set({ phone }),
  setSignUpPassword: (signUpPassword: string) => set({ signUpPassword }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),

  validateEmail: (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  isLoginFormValid: () => {
    const { password } = get()
    return password.length >= 6
  },

  isSignUpFormValid: () => {
    const { firstName, lastName, email, signUpPassword, birthdate, phone } = get()
    const { validateEmail } = get()
    return (
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      validateEmail(email) &&
      signUpPassword.length >= 6 &&
      birthdate.length > 0 &&
      phone.trim().length > 0
    )
  },

  submitLogIn: async () => {
    const { email, password, setLoading, setError } = get()
    
    if (!get().isLoginFormValid()) {
      setError('Please enter a valid password')
      return { success: false, message: 'Invalid password' }
    }

    if (!email) {
      setError('Email is required')
      return { success: false, message: 'Email required' }
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      
      const result = await response.json()

      // ✅ STEP 1: Check if MFA is required
      if (result.requireMFA) {
        set({ tempToken: result.tempToken })
        setLoading(false)
        return { success: false, requireMFA: true, message: 'Please enter 2FA code' }
      }

      // ✅ STEP 2: Standard Login Success
      if (response.ok && result.success) {
        const backendUser = result.data.user
        
        const user: User = {
          id: backendUser.id,
          email: backendUser.email,
          firstName: backendUser.firstName || '',
          lastName: backendUser.lastName || '',
          name: backendUser.name || `${backendUser.firstName || ''} ${backendUser.lastName || ''}`.trim(),
          dateOfBirth: backendUser.dateOfBirth || '',
          phone: backendUser.phone || '',
          role: backendUser.role || 'user',
          twoFactorEnabled: backendUser.isTwoFactorEnabled ?? backendUser.twoFactorEnabled ?? false,
          birthdate: backendUser.dateOfBirth || undefined,
        }

        set({
          user,
          isLoggedIn: true,
          token: result.data.token, 
          password: '',
          email: '',
          error: null,
        })

        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', result.data.token)
          localStorage.setItem('authUser', JSON.stringify(user))
          setCookie('authToken', result.data.token, 7)
        }

        window.location.href = '/'
        return { success: true }
      } else {
        const msg = result.message || 'Login failed. Please check your credentials.'
        setError(msg)
        return { success: false, message: msg }
      }
    } catch (error) {
      console.error('Login error:', error)
      const msg = 'Login failed. Please try again.'
      setError(msg)
      return { success: false, message: msg }
    } finally {
      setLoading(false)
    }
  },

  submitOtp: async (otp: string) => {
    const { tempToken, setLoading, setError } = get()

    if (!tempToken) {
      setError('No temporary token found')
      return { success: false, message: 'No temporary token found' }
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, otp }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        const backendUser = result.data.user
        const user: User = {
          id: backendUser.id,
          email: backendUser.email,
          firstName: backendUser.firstName || '',
          lastName: backendUser.lastName || '',
          name: backendUser.name || `${backendUser.firstName || ''} ${backendUser.lastName || ''}`.trim(),
          dateOfBirth: backendUser.dateOfBirth || '',
          phone: backendUser.phone || '',
          role: backendUser.role || 'user',
          twoFactorEnabled: backendUser.isTwoFactorEnabled ?? backendUser.twoFactorEnabled ?? false,
          birthdate: backendUser.dateOfBirth || undefined,
        }

        set({
          user,
          isLoggedIn: true,
          token: result.data.token,
          password: '',
          email: '',
          error: null,
          tempToken: null,
        })

        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', result.data.token)
          localStorage.setItem('authUser', JSON.stringify(user))
          setCookie('authToken', result.data.token, 7)
        }

        window.location.href = '/'
        return { success: true }
      } else {
        const msg = result.message || 'OTP verification failed. Please try again.'
        setError(msg)
        return { success: false, message: msg }
      }
    } catch (error) {
      console.error('OTP verification error:', error)
      const msg = 'OTP verification failed. Please try again.'
      setError(msg)
      return { success: false, message: msg }
    } finally {
      setLoading(false)
    }
  },

  // ✅ New Action: Send Email OTP
  sendEmailOtp: async () => {
    const { tempToken, setLoading, setError } = get()
    if (!tempToken) return { success: false, message: 'Session expired' }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/mfa/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken }),
      })
      const result = await res.json()
      
      if (!result.success) setError(result.message)
      return result
    } catch (error) {
      return { success: false, message: 'Failed to send email' }
    } finally {
      setLoading(false)
    }
  },

  submitSignUp: async () => {
    const { firstName, lastName, email, signUpPassword, birthdate, phone, setLoading, setError } = get()

    if (!get().isSignUpFormValid()) {
      setError('Please fill in all fields correctly')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await AuthApiClient.register({
        email,
        password: signUpPassword,
        firstName,
        lastName,
        dateOfBirth: birthdate,
        phone,
      })

      if (result.success) {
        const backendUser = result.data.user
        const user: User = {
          id: backendUser.id,
          email: backendUser.email,
          firstName: backendUser.firstName || '',
          lastName: backendUser.lastName || '',
          name: backendUser.name || `${backendUser.firstName || ''} ${backendUser.lastName || ''}`.trim(),
          dateOfBirth: backendUser.dateOfBirth || birthdate,
          phone: backendUser.phone || phone,
          role: backendUser.role || 'user',
          twoFactorEnabled: false,
          birthdate: backendUser.dateOfBirth || birthdate,
        }

        set({
          user,
          isLoggedIn: true,
          token: result.data.token,
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          signUpPassword: '',
          birthdate: '',
          error: null,
        })

        if (typeof window !== 'undefined' && result.data.token) {
          localStorage.setItem('authToken', result.data.token)
          localStorage.setItem('authUser', JSON.stringify(user))
          setCookie('authToken', result.data.token, 7)
        }

        window.location.href = '/'
      } else {
        setError(result.message || 'Sign up failed. Please try again.')
      }
    } catch (error) {
      console.error('Sign up error:', error)
      setError(error instanceof Error ? error.message : 'Sign up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  },

  submitEmailCheck: async () => {
    const { email, validateEmail, setLoading, setError } = get()

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        return result.data
      } else {
        setError(result.message || 'Email check failed. Please try again.')
        return null
      }
    } catch (error) {
      console.error('Email check error:', error)
      setError('Email check failed. Please try again.')
      return null
    } finally {
      setLoading(false)
    }
  },

  logout: () => {
    set({
      user: null,
      isLoggedIn: false,
      token: null,
      error: null,
      password: '',
      email: '',
      phone: '',
      signUpPassword: '',
      tempToken: null,
    })
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken')
      localStorage.removeItem('authUser')
      deleteCookie('authToken')
    }
  },

  resetForm: () => set({
    password: '',
    firstName: '',
    lastName: '',
    birthdate: '',
    email: '',
    phone: '',
    signUpPassword: '',
    error: null,
  }),

  checkAuthStatusOnLoad: async () => {
    if (typeof window === 'undefined') {
      set({ isAuthLoading: false });
      return;
    }
    
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await get().validateToken();
      }
    } catch (error) {
      console.error("Auth status check failed", error);
      get().logout();
    } finally {
      set({ isAuthLoading: false });
    }
  },

  initializeAuth: () => {
    if (typeof window === 'undefined') return

    try {
      const storedToken = localStorage.getItem('authToken')
      const storedUser = localStorage.getItem('authUser')

      if (storedToken && storedUser) {
        const user = JSON.parse(storedUser) as User
        set({
          user,
          isLoggedIn: true,
          token: storedToken,
          error: null,
        })
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
      localStorage.removeItem('authToken')
      localStorage.removeItem('authUser')
      deleteCookie('authToken')
    }
  },

  validateToken: async () => {
    if (typeof window === 'undefined') return false

    const token = localStorage.getItem('authToken')
    if (!token) {
      get().logout()
      return false
    }

    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        
        if (result.success && result.data?.user) {
          const backendUser = result.data.user
          const user: User = {
            id: backendUser.id,
            email: backendUser.email,
            firstName: backendUser.firstName || '',
            lastName: backendUser.lastName || '',
            name: backendUser.name || `${backendUser.firstName || ''} ${backendUser.lastName || ''}`.trim(),
            dateOfBirth: backendUser.dateOfBirth || '',
            phone: backendUser.phone || '',
            role: backendUser.role || 'user',
            twoFactorEnabled: backendUser.isTwoFactorEnabled ?? backendUser.twoFactorEnabled ?? false,
            birthdate: backendUser.dateOfBirth || undefined,
          }

          set({
            user,
            isLoggedIn: true,
            token, 
            error: null,
          })

          localStorage.setItem('authUser', JSON.stringify(user))
          return true
        }
      }
      
      get().logout()
      return false
    } catch (error) {
      console.error('Token validation error:', error)
      get().logout()
      return false
    }
  },

  refreshUserData: async () => {
    if (typeof window === 'undefined') return false

    const token = localStorage.getItem('authToken')
    if (!token) return false

    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        
        if (result.success && result.data?.user) {
          const backendUser = result.data.user
          const user: User = {
            id: backendUser.id,
            email: backendUser.email,
            firstName: backendUser.firstName || '',
            lastName: backendUser.lastName || '',
            name: backendUser.name || `${backendUser.firstName || ''} ${backendUser.lastName || ''}`.trim(),
            dateOfBirth: backendUser.dateOfBirth || '',
            phone: backendUser.phone || '',
            role: backendUser.role || 'user',
            twoFactorEnabled: backendUser.isTwoFactorEnabled ?? backendUser.twoFactorEnabled ?? false,
            birthdate: backendUser.dateOfBirth || undefined,
          }

          set({
            user,
            isLoggedIn: true,
            error: null,
          })

          localStorage.setItem('authUser', JSON.stringify(user))
          return true
        }
      }
      
      return false
    } catch (error) {
      console.error('Error refreshing user data:', error)
      return false
    }
  },
}))

export default useAuthStore