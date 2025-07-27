import { useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { motion } from "framer-motion"
import { fetchParticipantResponsesStart, fetchParticipantResponsesSuccess, fetchParticipantResponsesFailure, clearSelectedParticipant } from "@/store/slices/adminSlice"
import { adminService } from "@/services/api/adminService"
import { PILLARS } from "@/services/mockData/pillars"
import Button from "@/components/atoms/Button"
import Card from "@/components/atoms/Card"
import Loading from "@/components/ui/Loading"
import Error from "@/components/ui/Error"
import ApperIcon from "@/components/ApperIcon"

const AdminParticipant = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { selectedParticipant, participantResponses, isLoading, error } = useSelector((state) => state.admin)

  useEffect(() => {
    const loadParticipantData = async () => {
      dispatch(fetchParticipantResponsesStart())
      try {
        const data = await adminService.getParticipantResponses(userId)
        dispatch(fetchParticipantResponsesSuccess(data))
      } catch (error) {
        dispatch(fetchParticipantResponsesFailure(error.message))
      }
    }

    loadParticipantData()

    return () => {
      dispatch(clearSelectedParticipant())
    }
  }, [dispatch, userId])

  const handleBack = () => {
    navigate("/admin")
  }

  const handleRetry = () => {
    window.location.reload()
  }

  const getCompletionStatus = () => {
    if (!participantResponses) return { completed: 0, total: 0, percentage: 0 }
    
    const totalQuestions = PILLARS.reduce((sum, pillar) => sum + pillar.questions.length, 0)
    const completedQuestions = Object.values(participantResponses).reduce((sum, pillarResponses) => {
      return sum + Object.values(pillarResponses).filter(response => 
        response && response.trim().length > 0
      ).length
    }, 0)
    
    return {
      completed: completedQuestions,
      total: totalQuestions,
      percentage: totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0
    }
  }

  const stripHtml = (html) => {
    const div = document.createElement("div")
    div.innerHTML = html
    return div.textContent || div.innerText || ""
  }

  if (isLoading) {
    return <Loading />
  }

  if (error) {
    return <Error message={error} onRetry={handleRetry} />
  }

  if (!selectedParticipant) {
    return <Error message="Participant not found" onRetry={handleBack} />
  }

  const status = getCompletionStatus()

  return (
    <div className="max-w-6xl mx-auto p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center space-x-2"
          >
            <ApperIcon name="ArrowLeft" size={16} />
            <span>Back to Dashboard</span>
          </Button>
        </div>

        {/* Participant Info */}
        <Card className="p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-gradient-to-br from-heritage-200 to-heritage-300 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-heritage-800">
                  {selectedParticipant.profile?.fullName?.charAt(0)?.toUpperCase() || selectedParticipant.email?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {selectedParticipant.profile?.fullName || "No name provided"}
                </h1>
                <p className="text-gray-600 mb-2">{selectedParticipant.email}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Last activity: {selectedParticipant.lastActivity ? new Date(selectedParticipant.lastActivity).toLocaleDateString() : "Never"}</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold text-primary-700 mb-1">
                {Math.round(status.percentage)}%
              </div>
              <p className="text-gray-600">Complete</p>
              <p className="text-sm text-gray-500">
                {status.completed} of {status.total} questions
              </p>
            </div>
          </div>

          {/* Business Info */}
          {selectedParticipant.profile && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Business Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Business Name</p>
                  <p className="text-gray-900">{selectedParticipant.profile.businessName || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Position</p>
                  <p className="text-gray-900">{selectedParticipant.profile.position || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Business Type</p>
                  <p className="text-gray-900">{selectedParticipant.profile.businessType || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Years in Business</p>
                  <p className="text-gray-900">{selectedParticipant.profile.yearsInBusiness || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Annual Revenue</p>
                  <p className="text-gray-900">{selectedParticipant.profile.annualRevenue || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Location</p>
                  <p className="text-gray-900">
                    {selectedParticipant.profile.city && selectedParticipant.profile.country
                      ? `${selectedParticipant.profile.city}, ${selectedParticipant.profile.country}`
                      : "Not specified"
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Pillar Responses */}
        <div className="space-y-8">
          {PILLARS.map((pillar) => {
            const pillarResponses = participantResponses[pillar.id] || {}
            const pillarCompleted = Object.values(pillarResponses).filter(response => 
              response && response.trim().length > 0
            ).length
            const pillarProgress = (pillarCompleted / pillar.questions.length) * 100

            return (
              <motion.div
                key={pillar.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: PILLARS.indexOf(pillar) * 0.1 }}
              >
                <Card className="overflow-hidden">
                  <div className={`p-6 bg-gradient-to-r ${pillar.gradient} text-white`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold mb-1">{pillar.title}</h2>
                        <p className="text-white text-opacity-90">{pillar.subtitle}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {Math.round(pillarProgress)}%
                        </div>
                        <p className="text-white text-opacity-90 text-sm">
                          {pillarCompleted} of {pillar.questions.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="space-y-6">
                      {pillar.questions.map((question, index) => {
                        const questionId = `q${index + 1}`
                        const response = pillarResponses[questionId] || ""
                        const hasResponse = response && response.trim().length > 0

                        return (
                          <div key={questionId} className="border-l-4 border-gray-200 pl-6">
                            <div className="flex items-start space-x-3 mb-3">
                              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                                hasResponse 
                                  ? "bg-gradient-to-br from-green-100 to-green-200 text-green-700"
                                  : "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600"
                              }`}>
                                {index + 1}
                              </span>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 mb-2">
                                  {question}
                                </h4>
                                {hasResponse ? (
                                  <div className="prose prose-sm max-w-none">
                                    <div 
                                      className="text-gray-700 bg-gray-50 rounded-lg p-4"
                                      dangerouslySetInnerHTML={{ __html: response }}
                                    />
                                  </div>
                                ) : (
                                  <div className="text-gray-500 italic bg-gray-50 rounded-lg p-4">
                                    No response provided yet
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}

export default AdminParticipant