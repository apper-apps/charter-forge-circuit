import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { motion } from "framer-motion"
import { fetchResponsesStart, fetchResponsesSuccess, fetchResponsesFailure, savePillarResponsesStart, savePillarResponsesSuccess, savePillarResponsesFailure } from "@/store/slices/responsesSlice"
import { responsesService } from "@/services/api/responsesService"
import { toast } from 'react-toastify'
import { PILLARS } from "@/services/mockData/pillars"
import QuestionCard from "@/components/organisms/QuestionCard"
import Button from "@/components/atoms/Button"
import Loading from "@/components/ui/Loading"
import Error from "@/components/ui/Error"
import ApperIcon from "@/components/ApperIcon"

const PillarQuestions = () => {
  const { pillarId } = useParams()
const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { responses, isLoading, error, savingPillar } = useSelector((state) => state.responses)

  const pillar = PILLARS.find(p => p.id === pillarId)

  useEffect(() => {
    if (!user?.id) return

    const loadResponses = async () => {
      dispatch(fetchResponsesStart())
      try {
        const responsesData = await responsesService.getUserResponses(user.id)
        dispatch(fetchResponsesSuccess(responsesData))
      } catch (error) {
        dispatch(fetchResponsesFailure(error.message))
      }
    }

    loadResponses()
  }, [dispatch, user?.id])

  const handleRetry = () => {
    window.location.reload()
  }

const handleBack = () => {
    navigate("/dashboard")
  }

  const handleSavePillarResponses = async () => {
    if (!user?.id) {
      toast.error("User not authenticated")
      return
    }

    dispatch(savePillarResponsesStart())
    
    try {
      const pillarResponses = responses[pillarId] || {}
      const allResponses = []
      
      // Collect all responses for this pillar
      Object.entries(pillarResponses).forEach(([questionId, questionResponses]) => {
        if (Array.isArray(questionResponses)) {
          questionResponses.forEach((response, index) => {
            if (response.name || response.content) {
              allResponses.push({
                questionId,
                responseIndex: index,
                name: response.name,
                content: response.content
              })
            }
          })
        }
      })

      if (allResponses.length === 0) {
        toast.info("No responses to save")
        dispatch(savePillarResponsesSuccess())
        return
      }

      await responsesService.savePillarResponses(user.id, pillarId, allResponses)
      dispatch(savePillarResponsesSuccess())
      toast.success("✔ Responses saved successfully")
      
    } catch (error) {
      dispatch(savePillarResponsesFailure(error.message))
      toast.error(`Failed to save responses: ${error.message}`)
    }
  }

  const getPreviousPillar = () => {
    const currentIndex = PILLARS.findIndex(p => p.id === pillarId)
    return currentIndex > 0 ? PILLARS[currentIndex - 1] : null
  }

  const handlePreviousPillar = () => {
    const previousPillar = getPreviousPillar()
    if (previousPillar) {
      navigate(`/pillar/${previousPillar.id}`)
    }
  }

const getNextPillar = () => {
    const currentIndex = PILLARS.findIndex(p => p.id === pillarId)
    return currentIndex < PILLARS.length - 1 ? PILLARS[currentIndex + 1] : null
  }

  const handleNextPillar = () => {
    const nextPillar = getNextPillar()
    if (nextPillar) {
      navigate(`/pillar/${nextPillar.id}`)
    } else {
      navigate("/dashboard")
    }
  }

  if (!pillar) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <Error message="Pillar not found" onRetry={handleBack} />
      </div>
    )
  }

  if (isLoading) {
    return <Loading type="questions" />
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <Error message={error} onRetry={handleRetry} />
      </div>
    )
  }

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

const pillarResponses = responses[pillarId] || {}
  const completedQuestions = Object.values(pillarResponses).filter(isResponseAnswered).length
  const progress = (completedQuestions / pillar.questions.length) * 100
  const nextPillar = getNextPillar()
  const previousPillar = getPreviousPillar()
  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center space-x-2"
          >
            <ApperIcon name="ArrowLeft" size={16} />
            <span>Back to Dashboard</span>
          </Button>
          
          <div className="text-right">
            <div className="text-sm text-gray-600">Progress</div>
            <div className="text-lg font-semibold text-primary-700">
              {completedQuestions} of {pillar.questions.length} completed
            </div>
          </div>
        </div>

        <div className={`p-8 rounded-xl bg-gradient-to-br ${pillar.gradient} text-white mb-6`}>
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <ApperIcon name="FileText" className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{pillar.title}</h1>
<p className="text-white text-opacity-90 text-left">{pillar.subtitle}</p>
            </div>
          </div>
          <p className="text-white text-opacity-90 text-lg leading-relaxed text-left">
            {pillar.description}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-200 rounded-full h-2 mb-8">
          <motion.div
            className="bg-gradient-to-r from-accent-500 to-primary-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </motion.div>

      {/* Questions */}
      <div className="space-y-8 mb-12">
        {pillar.questions.map((question, index) => (
          <QuestionCard
            key={index}
            question={question}
            pillarId={pillarId}
            questionIndex={index}
          />
        ))}
      </div>

{/* Save Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200 mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-green-900 mb-1 text-left">
              Save Your Progress
            </h3>
            <p className="text-green-700 text-sm text-left">
              Click "Save Answers" to permanently save all your responses for this pillar.
            </p>
          </div>
          
          <Button
            variant="primary"
            onClick={handleSavePillarResponses}
            disabled={savingPillar}
            className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
          >
            {savingPillar ? (
              <>
                <ApperIcon name="Loader2" size={16} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <ApperIcon name="Save" size={16} />
                <span>Save Answers</span>
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl"
      >
        <div>
          <h3 className="font-semibold text-gray-900 mb-1 text-left">
            {completedQuestions === pillar.questions.length ? "Pillar Complete!" : "Keep Going"}
          </h3>
          <p className="text-gray-600 text-sm text-left">
            {completedQuestions === pillar.questions.length
              ? "You've completed all questions in this pillar."
              : "Remember to save your answers before navigating away."
            }
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {previousPillar && (
            <Button
              variant="secondary"
              onClick={handlePreviousPillar}
              className="flex items-center space-x-2"
            >
              <ApperIcon name="ArrowLeft" size={16} />
              <span>Previous</span>
            </Button>
          )}
          
          {nextPillar && (
            <Button
              variant="primary"
              onClick={handleNextPillar}
              className="flex items-center space-x-2"
            >
              <span>Next: {nextPillar.title}</span>
              <ApperIcon name="ArrowRight" size={16} />
            </Button>
          )}
          
          <Button
            variant="secondary"
            onClick={handleBack}
            className="flex items-center space-x-2"
          >
            <ApperIcon name="Home" size={16} />
            <span>Dashboard</span>
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export default PillarQuestions