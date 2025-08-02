import { useState, useEffect, useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"
import { motion } from "framer-motion"
import { updateResponseLocal, saveResponseStart, saveResponseSuccess, saveResponseFailure, updateIndividualResponse, saveIndividualResponseStart, saveIndividualResponseSuccess, saveIndividualResponseFailure } from "@/store/slices/responsesSlice"
import { responsesService } from "@/services/api/responsesService"
import { individualResponseService } from "@/services/api/individualResponseService"
import Card from "@/components/atoms/Card"
import RichTextEditor from "@/components/molecules/RichTextEditor"
import AutoSaveIndicator from "@/components/molecules/AutoSaveIndicator"
import { toast } from "react-toastify"

const QuestionCard = ({ question, pillarId, questionIndex }) => {
  const dispatch = useDispatch()
  const { responses, savingQuestions } = useSelector((state) => state.responses)
  const { user } = useSelector((state) => state.auth)
  
  const questionId = `q${questionIndex + 1}`
const individualResponses = responses[pillarId]?.[questionId] || []
  const [lastSaved, setLastSaved] = useState({})

  // Load individual responses when component mounts
  useEffect(() => {
    const loadIndividualResponses = async () => {
      if (!user?.id) return
      
      try {
        // First get the main response to get its ID
        const mainResponse = await responsesService.getMainResponse(user.id, pillarId, questionId)
        if (mainResponse) {
          const individualResponses = await individualResponseService.getIndividualResponsesForResponse(mainResponse.Id)
          dispatch(updateResponseLocal({ pillarId, questionId, individualResponses }))
        }
      } catch (error) {
        console.error("Error loading individual responses:", error.message)
      }
    }

    loadIndividualResponses()
  }, [user?.id, pillarId, questionId, dispatch])

  const saveIndividualResponse = useCallback(async (responseIndex, name, content) => {
    if (!user?.id) return

    const saveKey = `${pillarId}-${questionId}-${responseIndex}`
    dispatch(saveIndividualResponseStart({ pillarId, questionId, responseIndex }))
    
    try {
      // First ensure main response exists
      const mainResponse = await responsesService.ensureMainResponse(user.id, pillarId, questionId)
      
      // Save individual response
      await individualResponseService.saveIndividualResponse(mainResponse.Id, name, content, responseIndex)
      
      dispatch(saveIndividualResponseSuccess({ pillarId, questionId, responseIndex, name, content }))
      setLastSaved(prev => ({ ...prev, [responseIndex]: new Date() }))
    } catch (error) {
      dispatch(saveIndividualResponseFailure({ pillarId, questionId, responseIndex, error: error.message }))
      toast.error(`Failed to save response ${responseIndex + 1}`)
    }
  }, [dispatch, pillarId, questionId, user?.id])

  const handleIndividualResponseChange = (responseIndex, field, value) => {
    dispatch(updateIndividualResponse({ pillarId, questionId, responseIndex, field, value }))
  }

  const getIndividualResponse = (responseIndex) => {
    return individualResponses[responseIndex] || { name: "", content: "" }
  }

  const isSavingIndividualResponse = (responseIndex) => {
    const saveKey = `${pillarId}-${questionId}-${responseIndex}`
    return savingQuestions[saveKey]
  }

  const handleDeleteIndividualResponse = async (responseIndex) => {
    if (!user?.id) return
    
    try {
      const mainResponse = await responsesService.getMainResponse(user.id, pillarId, questionId)
      if (mainResponse) {
        await individualResponseService.deleteIndividualResponse(mainResponse.Id, responseIndex)
        dispatch(updateIndividualResponse({ pillarId, questionId, responseIndex, field: 'delete' }))
        toast.success("Response deleted successfully")
      }
    } catch (error) {
      toast.error("Failed to delete response")
      console.error("Delete error:", error.message)
    }
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: questionIndex * 0.1 }}
    >
      <Card className="p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <span className="w-8 h-8 bg-gradient-to-br from-primary-100 to-accent-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold">
                {questionIndex + 1}
              </span>
              <h3 className="text-lg font-semibold text-gray-900">
                Question {questionIndex + 1}
              </h3>
            </div>
            <p className="text-gray-700 text-base leading-relaxed">
              {question}
            </p>
          </div>
        </div>

<div className="space-y-6">
          <p className="text-sm text-gray-600 mb-4">
            5 different family members can respond separately to this question. Each response will be saved automatically.
          </p>
          
{[0, 1, 2, 3, 4].map((responseIndex) => {
            const response = getIndividualResponse(responseIndex)
            const hasContent = response.name || response.content
            
            return (
              <div key={responseIndex} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700">
                    Response {responseIndex + 1}
                  </h4>
                  <div className="flex items-center space-x-2">
                    {hasContent && (
                      <button
                        onClick={() => handleDeleteIndividualResponse(responseIndex)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                    <AutoSaveIndicator 
                      isSaving={isSavingIndividualResponse(responseIndex)} 
                      lastSaved={lastSaved[responseIndex]} 
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={response.name}
                      onChange={(e) => handleIndividualResponseChange(responseIndex, 'name', e.target.value)}
                      onBlur={() => {
                        if (response.name || response.content) {
                          saveIndividualResponse(responseIndex, response.name, response.content)
                        }
                      }}
                      placeholder="e.g., Aunt Joan, Uncle Rick"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Response
                    </label>
                    <RichTextEditor
                      value={response.content}
                      onChange={(content) => handleIndividualResponseChange(responseIndex, 'content', content)}
                      onAutoSave={(content) => {
                        if (response.name || content) {
                          saveIndividualResponse(responseIndex, response.name, content)
                        }
                      }}
                      autoSave={true}
                      placeholder={`Enter ${response.name ? response.name + "'s" : "their"} response...`}
                      className="min-h-[120px]"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </motion.div>
  )
}

export default QuestionCard