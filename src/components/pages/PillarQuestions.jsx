import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { motion } from "framer-motion"
import { fetchResponsesStart, fetchResponsesSuccess, fetchResponsesFailure } from "@/store/slices/responsesSlice"
import { responsesService } from "@/services/api/responsesService"
import { pillarService } from "@/services/api/pillarService"
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
  const { responses, isLoading, error } = useSelector((state) => state.responses)
  
  const [pillar, setPillar] = useState(null)
  const [pillarLoading, setPillarLoading] = useState(true)
  const [pillarError, setPillarError] = useState(null)

useEffect(() => {
    if (!user?.id) return

    const loadData = async () => {
      // Load pillar data from database
      setPillarLoading(true)
      try {
        const pillarData = await pillarService.getPillarById(pillarId)
        if (pillarData) {
          // Map database pillar to expected format with mock questions
          const mockPillar = PILLARS.find(p => p.id === pillarId)
          setPillar({
            id: pillarData.Id,
            title: pillarData.Name,
            subtitle: mockPillar?.subtitle || `Pillar ${pillarData.Id}`,
            description: pillarData.description || mockPillar?.description || '',
            gradient: mockPillar?.gradient || "from-primary-600 to-primary-700",
            questions: mockPillar?.questions || []
          })
        } else {
          setPillarError("Pillar not found")
        }
      } catch (error) {
        setPillarError(error.message)
      } finally {
        setPillarLoading(false)
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
  }, [dispatch, user?.id, pillarId])

  const handleRetry = () => {
    window.location.reload()
  }

  const handleBack = () => {
    navigate("/dashboard")
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

if (pillarLoading || isLoading) {
    return <Loading type="questions" />
  }

  if (pillarError) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <Error message={pillarError} onRetry={handleBack} />
      </div>
    )
  }

  if (!pillar) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <Error message="Pillar not found" onRetry={handleBack} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <Error message={error} onRetry={handleRetry} />
      </div>
    )
  }

const pillarResponses = responses[pillar.id] || {}
  const completedQuestions = Object.values(pillarResponses).filter(response => 
    response && response.trim().length > 0
  ).length
  const progress = pillar.questions ? (completedQuestions / pillar.questions.length) * 100 : 0
  const nextPillar = getNextPillar()

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
{pillar.questions && pillar.questions.map((question, index) => (
          <QuestionCard
            key={index}
            question={question}
            pillarId={pillar.id}
            questionIndex={index}
          />
        ))}
      </div>

      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl"
      >
        <div>
<h3 className="font-semibold text-gray-900 mb-1 text-left">
            {pillar.questions && completedQuestions === pillar.questions.length ? "Pillar Complete!" : "Keep Going"}
          </h3>
          <p className="text-gray-600 text-sm text-left">
            {pillar.questions && completedQuestions === pillar.questions.length
              ? "You've completed all questions in this pillar."
              : "Take your time to thoughtfully answer each question."
            }
          </p>
        </div>

        <div className="flex items-center space-x-4">
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