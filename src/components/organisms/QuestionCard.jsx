import { useState, useEffect, useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"
import { motion } from "framer-motion"
import { updateResponseLocal, saveResponseStart, saveResponseSuccess, saveResponseFailure } from "@/store/slices/responsesSlice"
import { responsesService } from "@/services/api/responsesService"
import Card from "@/components/atoms/Card"
import RichTextEditor from "@/components/molecules/RichTextEditor"
import AutoSaveIndicator from "@/components/molecules/AutoSaveIndicator"
import { toast } from "react-toastify"

const QuestionCard = ({ question, pillarId, questionIndex }) => {
  const dispatch = useDispatch()
  const { responses, savingQuestions } = useSelector((state) => state.responses)
  const { user } = useSelector((state) => state.auth)
  
  const questionId = `q${questionIndex + 1}`
  const responseArray = responses[pillarId]?.[questionId] || []
  const [lastSaved, setLastSaved] = useState({})

  const saveResponse = useCallback(async (content, responseNumber) => {
    if (!user?.id) return

    const saveKey = `${pillarId}-${questionId}-${responseNumber}`
    dispatch(saveResponseStart({ pillarId, questionId, responseNumber }))
    
    try {
      await responsesService.saveResponse(user.id, pillarId, questionId, content, responseNumber)
      dispatch(saveResponseSuccess({ pillarId, questionId, content, responseNumber }))
      setLastSaved(prev => ({ ...prev, [responseNumber]: new Date() }))
    } catch (error) {
      dispatch(saveResponseFailure({ pillarId, questionId, responseNumber, error: error.message }))
      toast.error(`Failed to save response ${responseNumber}`)
    }
  }, [dispatch, pillarId, questionId, user?.id])

  const handleContentChange = (content, responseNumber) => {
    dispatch(updateResponseLocal({ pillarId, questionId, content, responseNumber }))
  }

  const getResponseContent = (responseNumber) => {
    const arrayIndex = responseNumber - 1
    return responseArray[arrayIndex] || ""
  }

  const isSavingResponse = (responseNumber) => {
    const saveKey = `${pillarId}-${questionId}-${responseNumber}`
    return savingQuestions[saveKey]
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
            You can provide up to 5 different responses to this question. Each response will be saved automatically.
          </p>
          
          {[1, 2, 3, 4, 5].map((responseNumber) => (
            <div key={responseNumber} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700">
                  Response {responseNumber}
                </h4>
                <AutoSaveIndicator 
                  isSaving={isSavingResponse(responseNumber)} 
                  lastSaved={lastSaved[responseNumber]} 
                />
              </div>
              
              <RichTextEditor
                value={getResponseContent(responseNumber)}
                onChange={(content) => handleContentChange(content, responseNumber)}
                onAutoSave={(content) => saveResponse(content, responseNumber)}
                autoSave={true}
                placeholder={`Share your thoughts for response ${responseNumber}... Each response is saved independently.`}
                className="min-h-[120px]"
              />
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  )
}

export default QuestionCard