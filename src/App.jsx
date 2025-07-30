import { createContext, useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import { useSelector, useDispatch } from "react-redux"
import { loginSuccess, logout } from '@/store/slices/authSlice'
import Layout from "@/components/organisms/Layout"
import Login from "@/components/pages/Login"
import Dashboard from "@/components/pages/Dashboard"
import Onboarding from "@/components/pages/Onboarding"
import PillarQuestions from "@/components/pages/PillarQuestions"
import Export from "@/components/pages/Export"
import Profile from "@/components/pages/Profile"
import AdminDashboard from "@/components/pages/AdminDashboard"
import AdminParticipant from "@/components/pages/AdminParticipant"

// Create auth context for sharing authentication methods
export const AuthContext = createContext(null)

function App() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize Apper authentication system
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { ApperClient, ApperUI } = window.ApperSDK
        
        const client = new ApperClient({
          apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
          apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
        })

        ApperUI.setup(client, {
          target: '#authentication',
          clientId: import.meta.env.VITE_APPER_PROJECT_ID,
          view: 'both',
          onSuccess: function (user) {
            setIsInitialized(true)
            
            // CRITICAL: Preserve exact currentPath redirection logic
            let currentPath = window.location.pathname + window.location.search
            let redirectPath = new URLSearchParams(window.location.search).get('redirect')
            const isAuthPage = currentPath.includes('/login') || currentPath.includes('/signup') || 
                               currentPath.includes('/callback') || currentPath.includes('/error')
            
            if (user) {
              // User is authenticated - transform user data and store in Redux
              const transformedUser = {
                Id: user.userId || user.Id,
                email: user.emailAddress || user.email,
                fullName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.fullName,
                role: user.role || "participant", // Default role
                phone: user.phone,
                businessName: user.accounts?.[0]?.companyName,
                position: user.position,
                createdAt: user.createdAt || new Date().toISOString()
              }
              
              dispatch(loginSuccess(transformedUser))
              
              if (redirectPath) {
                navigate(redirectPath)
              } else if (!isAuthPage) {
                if (!currentPath.includes('/login') && !currentPath.includes('/signup')) {
                  navigate(currentPath)
                } else {
                  navigate('/dashboard')
                }
              } else {
                const isAdmin = transformedUser.role === "admin"
                navigate(isAdmin ? '/admin' : '/dashboard')
              }
            } else {
              // User is not authenticated
              dispatch(logout())
              if (!isAuthPage) {
                navigate(
                  currentPath.includes('/signup')
                    ? `/signup?redirect=${currentPath}`
                    : currentPath.includes('/login')
                    ? `/login?redirect=${currentPath}`
                    : '/login'
                )
              } else if (redirectPath) {
                if (!['error', 'signup', 'login', 'callback'].some((path) => currentPath.includes(path))) {
                  navigate(`/login?redirect=${redirectPath}`)
                } else {
                  navigate(currentPath)
                }
              } else if (isAuthPage) {
                navigate(currentPath)
              } else {
                navigate('/login')
              }
            }
          },
          onError: function(error) {
            console.error("Authentication error:", error)
            setIsInitialized(true)
          }
        })
      } catch (error) {
        console.error("Failed to initialize authentication:", error)
        setIsInitialized(true)
      }
    }

    initializeAuth()
  }, [navigate, dispatch])

  // Authentication methods to share via context
  const authMethods = {
    isInitialized,
    logout: async () => {
      try {
        const { ApperUI } = window.ApperSDK
        await ApperUI.logout()
        dispatch(logout())
        navigate('/login')
      } catch (error) {
        console.error("Logout failed:", error)
        dispatch(logout())
        navigate('/login')
      }
    }
  }

  // Don't render routes until initialization is complete
  if (!isInitialized) {
    return (
      <div className="loading flex items-center justify-center p-6 h-screen w-full">
        <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v4"></path>
          <path d="m16.2 7.8 2.9-2.9"></path>
          <path d="M18 12h4"></path>
          <path d="m16.2 16.2 2.9 2.9"></path>
          <path d="M12 18v4"></path>
          <path d="m4.9 19.1 2.9-2.9"></path>
          <path d="M2 12h4"></path>
          <path d="m4.9 4.9 2.9 2.9"></path>
        </svg>
      </div>
    )
  }

  if (!user) {
    return (
      <AuthContext.Provider value={authMethods}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          className="toast-container"
        />
      </AuthContext.Provider>
    )
  }

  const isAdmin = user.role === "admin"

  return (
    <AuthContext.Provider value={authMethods}>
      <Layout>
        <Routes>
          {isAdmin ? (
            <>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/participant/:userId" element={<AdminParticipant />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </>
          ) : (
            <>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/pillar/:pillarId" element={<PillarQuestions />} />
              <Route path="/export" element={<Export />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </>
          )}
        </Routes>
      </Layout>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        className="toast-container"
      />
    </AuthContext.Provider>
  )
}

export default App