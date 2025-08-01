import { Routes, Route, Navigate } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import { useSelector } from "react-redux"
import Layout from "@/components/organisms/Layout"
import Login from "@/components/pages/Login"
import Dashboard from "@/components/pages/Dashboard"
import Onboarding from "@/components/pages/Onboarding"
import PillarQuestions from "@/components/pages/PillarQuestions"
import Export from "@/components/pages/Export"
import Profile from "@/components/pages/Profile"
import AdminDashboard from "@/components/pages/AdminDashboard"
import AdminParticipant from "@/components/pages/AdminParticipant"
import ResetPassword from "@/components/pages/ResetPassword"

function App() {
  const { user } = useSelector((state) => state.auth)

  if (!user) {
    return (
      <>
<Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
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
      </>
    )
  }

  const isAdmin = user.role === "admin"

  return (
    <>
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
    </>
  )
}

export default App