import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { pillarService } from "@/services/api/pillarService";
import { profileService } from "@/services/api/profileService";
import { responsesService } from "@/services/api/responsesService";
import ApperIcon from "@/components/ApperIcon";
import PillarCard from "@/components/organisms/PillarCard";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import Profile from "@/components/pages/Profile";
import { fetchProfileFailure, fetchProfileStart, fetchProfileSuccess } from "@/store/slices/profileSlice";
import { fetchResponsesFailure, fetchResponsesStart, fetchResponsesSuccess } from "@/store/slices/responsesSlice";

const Dashboard = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { responses, isLoading: responsesLoading, error: responsesError } = useSelector((state) => state.responses)
  const { profile, isLoading: profileLoading } = useSelector((state) => state.profile)
  
  const [pillars, setPillars] = useState([])
  const [pillarsLoading, setPillarsLoading] = useState(true)
  const [pillarsError, setPillarsError] = useState(null)
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

      // Load pillars
      setPillarsLoading(true)
      try {
        const pillarsData = await pillarService.getAllPillars()
        setPillars(pillarsData)
      } catch (error) {
        setPillarsError(error.message)
      } finally {
        setPillarsLoading(false)
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

// Calculate overall progress (using estimated questions per pillar since questions aren't in database)
  const estimatedQuestionsPerPillar = 5 // Average questions per pillar
  const totalQuestions = pillars.length * estimatedQuestionsPerPillar
  const completedQuestions = Object.values(responses).reduce((sum, pillarResponses) => {
    return sum + Object.values(pillarResponses).filter(response => 
      response && response.trim().length > 0
    ).length
  }, 0)
  const overallProgress = totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0

if (responsesLoading || profileLoading || pillarsLoading) {
    return <Loading type="dashboard" />
  }

if (responsesError || pillarsError) {
return <Error message={responsesError || pillarsError} onRetry={handleRetry} />
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
{/* Four Pillars */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pillars.map((pillar, index) => (
          <motion.div
            key={pillar.Id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <PillarCard 
              pillar={{
                id: String(pillar.Id), // Convert to string for consistent navigation
                title: pillar.Name,
                subtitle: `Pillar ${index + 1}`,
                description: pillar.description || `Explore the ${pillar.Name} pillar of your family business charter`,
                gradient: index === 0 ? "from-blue-500 to-blue-600" : 
                         index === 1 ? "from-green-500 to-green-600" :
                         index === 2 ? "from-purple-500 to-purple-600" :
                         "from-orange-500 to-orange-600",
                questions: Array(estimatedQuestionsPerPillar).fill(null).map((_, i) => ({ 
                  id: `${pillar.Id}-${i + 1}`,
                  pillarId: pillar.Id,
                  questionNumber: i + 1
                }))
              }} 
              onClick={handlePillarClick} 
            />
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