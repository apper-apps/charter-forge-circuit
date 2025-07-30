import { useState } from "react"
import { motion } from "framer-motion"
import { useDispatch, useSelector } from "react-redux"
import { loginStart, loginSuccess, loginFailure } from "@/store/slices/authSlice"
import { authService } from "@/services/api/authService"
import ApperIcon from "@/components/ApperIcon"
import Button from "@/components/atoms/Button"
import FormField from "@/components/molecules/FormField"
import { toast } from "react-toastify"

const Login = () => {
  const dispatch = useDispatch()
  const { isLoading, error } = useSelector((state) => state.auth)
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields")
      return
    }

    dispatch(loginStart())
    
    try {
      const user = await authService.login(formData.email, formData.password)
dispatch(loginSuccess(user))
      toast.success(`Welcome ${user.role === "admin" ? "back, Admin" : "back"}!`)
    } catch (error) {
      dispatch(loginFailure(error.message))
      toast.error(error.message)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
<div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <ApperIcon name="FileText" className="w-8 h-8 text-white" />
</div>
<h1 className="text-2xl font-bold text-gray-900 mb-2 text-left">Welcome to Family Business Charter</h1>
            <p className="text-gray-600 text-left">Build your Family Business Charter</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />

            <FormField
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />

            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              disabled={isLoading}
className="w-full"
            >
              Sign In
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

export default Login