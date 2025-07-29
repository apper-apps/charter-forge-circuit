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
  const responseContent = responses[pillarId]?.[questionId] || ""
  const isSaving = savingQuestions[`${pillarId}-${questionId}`]
  const [lastSaved, setLastSaved] = useState(null)

  const saveResponse = useCallback(async (content) => {
    if (!user?.id) return

    dispatch(saveResponseStart({ pillarId, questionId }))
    
    try {
      await responsesService.saveResponse(user.id, pillarId, questionId, content)
      dispatch(saveResponseSuccess({ pillarId, questionId, content }))
      setLastSaved(new Date())
    } catch (error) {
      dispatch(saveResponseFailure({ pillarId, questionId, error: error.message }))
      toast.error("Failed to save response")
    }
  }, [dispatch, pillarId, questionId, user?.id])

  const handleContentChange = (content) => {
    dispatch(updateResponseLocal({ pillarId, questionId, content }))
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
          <AutoSaveIndicator isSaving={isSaving} lastSaved={lastSaved} />
        </div>

        <RichTextEditor
          value={responseContent}
          onChange={handleContentChange}
          onAutoSave={saveResponse}
          autoSave={true}
          placeholder="Share your thoughts here... Take your time to reflect on this important question."
          className="mt-4"
        />
      </Card>
    </motion.div>
  )
}

export default QuestionCard