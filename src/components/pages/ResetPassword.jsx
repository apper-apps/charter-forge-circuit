import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { resetPasswordStart, resetPasswordSuccess, resetPasswordFailure, clearResetPasswordState } from '@/store/slices/authSlice'
import Button from '@/components/atoms/Button'
import FormField from '@/components/molecules/FormField'
import { toast } from 'react-toastify'

const { ApperClient } = window.ApperSDK;

const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

const ResetPassword = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { resetPasswordLoading, resetPasswordError, resetPasswordSuccess } = useSelector((state) => state.auth)
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [tokenValid, setTokenValid] = useState(null)
  const [validatingToken, setValidatingToken] = useState(true)

  useEffect(() => {
    // Clear any previous reset password state
    dispatch(clearResetPasswordState())
    
    // Validate the reset token
    validateToken()
  }, [token, dispatch])

  const validateToken = async () => {
    try {
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "reset_token" } },
          { field: { Name: "expiration_time" } },
          { field: { Name: "user_id" } }
        ],
        where: [
          {
            FieldName: "reset_token",
            Operator: "EqualTo",
            Values: [token]
          }
        ]
      };

      const response = await apperClient.fetchRecords("password_reset_requests", params);
      
      if (response.success && response.data && response.data.length > 0) {
        const resetRequest = response.data[0];
        const expirationTime = new Date(resetRequest.expiration_time);
        const currentTime = new Date();
        
        if (currentTime <= expirationTime) {
          setTokenValid(true)
        } else {
          setTokenValid(false)
          toast.error("Password reset link has expired. Please request a new one.")
        }
      } else {
        setTokenValid(false)
        toast.error("Invalid password reset link.")
      }
    } catch (error) {
      console.error("Error validating reset token:", error?.response?.data?.message || error.message)
      setTokenValid(false)
      toast.error("Error validating reset link. Please try again.")
    } finally {
      setValidatingToken(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.newPassword) {
      toast.error("Please enter a new password")
      return
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    
    if (formData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long")
      return
    }

    dispatch(resetPasswordStart())
    
    try {
      // Get the reset request details to find the user
      const tokenParams = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "reset_token" } },
          { field: { Name: "user_id" } }
        ],
        where: [
          {
            FieldName: "reset_token",
            Operator: "EqualTo",
            Values: [token]
          }
        ]
      };

      const tokenResponse = await apperClient.fetchRecords("password_reset_requests", tokenParams);
      
      if (!tokenResponse.success || !tokenResponse.data || tokenResponse.data.length === 0) {
        throw new Error("Invalid reset token")
      }

      const resetRequest = tokenResponse.data[0];
      const userId = resetRequest.user_id;

      if (userId) {
        // Update password in profile table
        const updateParams = {
          records: [
            {
              Id: parseInt(userId),
              password: formData.newPassword
            }
          ]
        };

        const updateResponse = await apperClient.updateRecord("profile", updateParams);
        
        if (!updateResponse.success) {
          throw new Error("Failed to update password")
        }

        if (updateResponse.results) {
          const failedUpdates = updateResponse.results.filter(result => !result.success);
          
          if (failedUpdates.length > 0) {
            console.error(`Failed to update password ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
            
            failedUpdates.forEach(record => {
              record.errors?.forEach(error => {
                throw new Error(`${error.fieldLabel}: ${error.message}`);
              });
              if (record.message) throw new Error(record.message);
            });
          }
        }
      }

      // Delete the used reset token
      const deleteParams = {
        RecordIds: [resetRequest.Id]
      };

      await apperClient.deleteRecord("password_reset_requests", deleteParams);

      dispatch(resetPasswordSuccess())
      toast.success("Password reset successfully! You can now login with your new password.")
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate('/login')
      }, 2000)
      
    } catch (error) {
      dispatch(resetPasswordFailure(error.message))
      toast.error(error.message)
    }
  }

  if (validatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Validating reset link...</p>
          </div>
        </div>
      </div>
    )
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="max-w-md w-full mx-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8 text-center"
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Reset Link</h2>
            <p className="text-gray-600 mb-6">This password reset link is invalid or has expired.</p>
            <Button
              variant="primary"
              onClick={() => navigate('/login')}
              className="w-full"
            >
              Back to Login
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
      <div className="max-w-md w-full mx-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2m0 0V7a2 2 0 012-2m-2 2h2" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Your Password</h1>
            <p className="text-gray-600">Enter your new password below</p>
          </div>

          {resetPasswordSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Password Reset Successful!</h2>
              <p className="text-gray-600">Redirecting you to login...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormField
                label="New Password"
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter your new password"
                required
              />

              <FormField
                label="Confirm New Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your new password"
                required
              />

              {resetPasswordError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{resetPasswordError}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                loading={resetPasswordLoading}
                disabled={resetPasswordLoading}
                className="w-full"
              >
                Update Password
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default ResetPassword