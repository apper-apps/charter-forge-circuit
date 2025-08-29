import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { responsesService } from "@/services/api/responsesService";
import { profileService } from "@/services/api/profileService";
import { PILLARS } from "@/services/mockData/pillars";
import { fetchResponsesFailure, fetchResponsesStart, fetchResponsesSuccess } from "@/store/slices/responsesSlice";
import { fetchProfileFailure, fetchProfileStart, fetchProfileSuccess } from "@/store/slices/profileSlice";
import ApperIcon from "@/components/ApperIcon";
import Profile from "@/components/pages/Profile";
import PillarCard from "@/components/organisms/PillarCard";
import Error from "@/components/ui/Error";
import Loading from "@/components/ui/Loading";

const Dashboard = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
const { user } = useSelector((state) => state.auth)
  const { responses, isLoading: responsesLoading, error: responsesError } = useSelector((state) => state.responses)
  const { profile, isLoading: profileLoading } = useSelector((state) => state.profile)
  const [charterCompletion, setCharterCompletion] = useState(null)
  const [completionLoading, setCompletionLoading] = useState(false)

  useEffect(() => {
    if (!user?.id) return

    const loadData = async () => {
      // Load profile
      dispatch(fetchProfileStart())
      try {
        const profileData = await profileService.getProfile(user.id)
        dispatch(fetchProfileSuccess(profileData))
      } catch (error) {
        dispatch(fetchProfileFailure(error.message))
      }

      // Load responses
      dispatch(fetchResponsesStart())
      try {
        const responsesData = await responsesService.getUserResponses(user.id)
        dispatch(fetchResponsesSuccess(responsesData))
      } catch (error) {
        dispatch(fetchResponsesFailure(error.message))
      }
    }

    loadData()
  }, [dispatch, user?.id])

  const handlePillarClick = (pillarId) => {
    navigate(`/pillar/${pillarId}`)
  }

  const handleRetry = () => {
    window.location.reload()
  }

  // Check if profile is complete
  const isProfileComplete = profile && profile.fullName && profile.businessName

// Helper function to check if a response is answered
  const isResponseAnswered = (response) => {
    if (!response) return false
    
    // Handle different response formats
    if (typeof response === 'string') {
      return response.replace(/<[^>]*>/g, '').trim().length > 0
    }
    
    if (typeof response === 'object') {
      // Handle response with content property
      if (response.content) {
        return response.content.replace(/<[^>]*>/g, '').trim().length > 0
      }
      
      // Handle individual responses array
      if (Array.isArray(response)) {
        return response.some(r => r && r.content && r.content.replace(/<[^>]*>/g, '').trim().length > 0)
      }
      
      // Handle individual response objects
      if (response.name || response.content) {
        const content = response.content || ''
        return content.replace(/<[^>]*>/g, '').trim().length > 0
      }
    }
    
    return false
  }

  // Calculate overall progress
const totalQuestions = PILLARS.reduce((sum, pillar) => sum + pillar.questions.length, 0)
  const completedQuestions = Object.values(responses).reduce((sum, pillarResponses) => {
    return sum + Object.values(pillarResponses).filter(isResponseAnswered).length
  }, 0)
  const calculatedProgress = totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0
  
  // Use persisted completion data if available, otherwise fall back to calculated progress
  const overallProgress = charterCompletion?.completionPercentage || calculatedProgress

  if (responsesLoading || profileLoading) {
    return <Loading type="dashboard" />
  }

  if (responsesError) {
    return <Error message={responsesError} onRetry={handleRetry} />
  }

  return (
    <div className="p-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to CILC Family Business Charter Builder
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          {profile?.businessName ? `Building the charter for ${profile.businessName}` : "Build your comprehensive family business charter through guided reflection"}
        </p>

        {/* Progress Overview */}
        <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-6 border border-primary-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-primary-900">Charter Progress</h3>
              <p className="text-primary-700">
{completedQuestions} of {totalQuestions} questions completed
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary-900">
{Math.round(overallProgress)}%
              </div>
              <div className="text-sm text-primary-700">Complete</div>
            </div>
          </div>
          <div className="w-full bg-primary-200 rounded-full h-3">
<motion.div
              className="bg-gradient-to-r from-accent-500 to-primary-600 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>

      {/* Profile Completion Warning */}
      {!isProfileComplete && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <ApperIcon name="AlertCircle" className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-amber-800 font-medium">Complete your profile first</p>
              <p className="text-amber-700 text-sm">
                Please complete your business profile to get the most out of your charter building experience.
              </p>
            </div>
            <button
              onClick={() => navigate("/profile")}
              className="ml-auto px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
            >
              Complete Profile
            </button>
          </div>
        </motion.div>
      )}

      {/* Four Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PILLARS.map((pillar, index) => (
          <motion.div
            key={pillar.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <PillarCard pillar={pillar} onClick={handlePillarClick} />
          </motion.div>
        ))}
      </div>

      {/* Help Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-12 text-center"
      >
        <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
          <ApperIcon name="HelpCircle" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-gray-600 mb-4">
            Take your time with each pillar. These questions are designed to help you think deeply about your family business's future.
          </p>
          <p className="text-sm text-gray-500">
            Your responses are automatically saved as you type. You can return to any pillar at any time to review or update your answers.
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default Dashboard