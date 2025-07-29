import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { motion } from "framer-motion"
import { fetchResponsesStart, fetchResponsesSuccess, fetchResponsesFailure } from "@/store/slices/responsesSlice"
import { fetchProfileStart, fetchProfileSuccess, fetchProfileFailure } from "@/store/slices/profileSlice"
import { responsesService } from "@/services/api/responsesService"
import { profileService } from "@/services/api/profileService"
import { exportService } from "@/services/api/exportService"
import { PILLARS } from "@/services/mockData/pillars"
import Button from "@/components/atoms/Button"
import Card from "@/components/atoms/Card"
import Loading from "@/components/ui/Loading"
import Error from "@/components/ui/Error"
import ApperIcon from "@/components/ApperIcon"
import { toast } from "react-toastify"

const Export = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { responses, isLoading: responsesLoading, error: responsesError } = useSelector((state) => state.responses)
  const { profile, isLoading: profileLoading, error: profileError } = useSelector((state) => state.profile)
  
  const [isExporting, setIsExporting] = useState(false)

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

  const handleRetry = () => {
    window.location.reload()
  }

  const calculateCompletionStats = () => {
    const totalQuestions = PILLARS.reduce((sum, pillar) => sum + pillar.questions.length, 0)
    const completedQuestions = Object.values(responses).reduce((sum, pillarResponses) => {
      return sum + Object.values(pillarResponses).filter(response => 
        response && response.trim().length > 0
      ).length
    }, 0)
    
    return {
      total: totalQuestions,
      completed: completedQuestions,
      percentage: totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0
    }
  }

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      const charterData = {
        profile,
        responses,
        pillars: PILLARS
      }
      
      await exportService.exportToPDF(charterData)
      toast.success("Charter exported to PDF successfully!")
    } catch (error) {
      toast.error("Failed to export charter")
      console.error("Export error:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportWord = async () => {
    setIsExporting(true)
    try {
      const charterData = {
        profile,
        responses,
        pillars: PILLARS
      }
      
      await exportService.exportToWord(charterData)
      toast.success("Charter exported to Word successfully!")
    } catch (error) {
      toast.error("Failed to export charter")
      console.error("Export error:", error)
    } finally {
      setIsExporting(false)
    }
  }

  if (responsesLoading || profileLoading) {
    return <Loading />
  }

  if (responsesError || profileError) {
    return <Error message={responsesError || profileError} onRetry={handleRetry} />
  }

  const stats = calculateCompletionStats()
  const isReady = stats.completed > 0

  return (
    <div className="max-w-4xl mx-auto p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-accent-600 to-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <ApperIcon name="Download" className="w-8 h-8 text-white" />
          </div>
<h1 className="text-3xl font-bold text-gray-900 mb-2 text-left">Export Your Charter</h1>
          <p className="text-lg text-gray-600 text-left">
            Download your Family Business Charter as a professional document
          </p>
        </div>

        {/* Completion Status */}
        <Card className="p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
<h2 className="text-xl font-semibold text-gray-900 mb-2 text-left">Charter Completion Status</h2>
              <p className="text-gray-600 text-left">
                You've completed {stats.completed} of {stats.total} questions
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary-700">
                {Math.round(stats.percentage)}%
              </div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
            <motion.div
              className="bg-gradient-to-r from-accent-500 to-primary-600 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${stats.percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>

          {/* Pillar Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PILLARS.map((pillar) => {
              const pillarResponses = responses[pillar.id] || {}
              const completed = Object.values(pillarResponses).filter(response => 
                response && response.trim().length > 0
              ).length
              const pillarProgress = (completed / pillar.questions.length) * 100

              return (
                <div key={pillar.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
<h3 className="font-medium text-gray-900 text-left">{pillar.title}</h3>
                    <p className="text-sm text-gray-600 text-left">
                      {completed} of {pillar.questions.length} questions
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-700">
                      {Math.round(pillarProgress)}%
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Export Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ApperIcon name="FileText" className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">PDF Export</h3>
<p className="text-gray-600 mb-6 text-left">
              Download a professional PDF version of your charter, perfect for sharing and printing.
            </p>
            <Button
              variant="primary"
              onClick={handleExportPDF}
              loading={isExporting}
              disabled={!isReady || isExporting}
              className="w-full flex items-center justify-center space-x-2"
            >
              <ApperIcon name="FileText" size={16} />
              <span>Export to PDF</span>
            </Button>
          </Card>

          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ApperIcon name="FileEdit" className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Word Document</h3>
            <p className="text-gray-600 mb-6">
Download as a Microsoft Word document for easy editing and customization.
            </p>
            <Button
              variant="secondary"
              onClick={handleExportWord}
              loading={isExporting}
              disabled={!isReady || isExporting}
              className="w-full flex items-center justify-center space-x-2"
            >
              <ApperIcon name="FileEdit" size={16} />
              <span>Export to Word</span>
            </Button>
          </Card>
        </div>

        {/* Export Info */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-primary-50 border border-blue-200">
          <div className="flex items-start space-x-4">
            <ApperIcon name="Info" className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">About Your Charter Export</h3>
<ul className="text-blue-800 text-sm space-y-1 text-left">
                <li>• Your charter includes all completed responses organized by the four pillars</li>
                <li>• Business profile information is included as a header</li>
                <li>• Documents are formatted professionally for business use</li>
                <li>• You can export at any time, even with partial completion</li>
                <li>• Your responses are always saved and can be updated anytime</li>
              </ul>
            </div>
          </div>
        </Card>

        {!isReady && (
          <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 mt-6">
            <div className="flex items-center space-x-4">
              <ApperIcon name="AlertCircle" className="w-6 h-6 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">No responses yet</h3>
<p className="text-amber-800 text-sm text-left">
                  Start answering questions in the four pillars to create your charter. 
                  You can export at any time once you begin.
                </p>
              </div>
            </div>
          </Card>
        )}
      </motion.div>
    </div>
  )
}

export default Export