import { useState, useEffect, useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"
import { motion } from "framer-motion"
import { updateResponseLocal, saveResponseStart, saveResponseSuccess, saveResponseFailure, updateIndividualResponse, saveIndividualResponseStart, saveIndividualResponseSuccess, saveIndividualResponseFailure } from "@/store/slices/responsesSlice"
import { responsesService } from "@/services/api/responsesService"
import { individualResponseService } from "@/services/api/individualResponseService"
import { answerService } from "@/services/api/answerService"
import Card from "@/components/atoms/Card"
import RichTextEditor from "@/components/molecules/RichTextEditor"
import AutoSaveIndicator from "@/components/molecules/AutoSaveIndicator"
import Button from "@/components/atoms/Button"
import ApperIcon from "@/components/ApperIcon"
import { toast } from "react-toastify"
const QuestionCard = ({ question, pillarId, questionIndex }) => {
  const dispatch = useDispatch()
  const { responses, savingQuestions } = useSelector((state) => state.responses)
  const { user } = useSelector((state) => state.auth)
  
  // Validate pillar ID format to prevent misrouting
  const validPillarIds = ["raison-detre", "type-of-business", "expectations", "extinction"]
  const isValidPillar = validPillarIds.includes(pillarId)
  
  if (!isValidPillar) {
    console.error(`Invalid pillar ID detected: ${pillarId}. Valid pillars: ${validPillarIds.join(', ')}`)
  }
  
  const questionId = `q${questionIndex + 1}`
  const individualResponses = isValidPillar ? (responses[pillarId]?.[questionId] || []) : []
  const [lastSaved, setLastSaved] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  // Load individual responses when component mounts
useEffect(() => {
    const loadIndividualResponses = async () => {
      if (!user?.id || !isValidPillar) {
        if (!isValidPillar) {
          console.warn(`Skipping response loading for invalid pillar: ${pillarId}`)
        }
        return
      }
      
      try {
        // Validate pillar-question combination before loading responses
        console.log(`Loading responses for pillar: ${pillarId}, question: ${questionId}`)
        
        // First get the main response to get its ID
        const mainResponse = await responsesService.getMainResponse(user.id, pillarId, questionId)
        if (mainResponse) {
          // Verify the returned response matches our pillar/question
          if (mainResponse.pillarId !== pillarId || mainResponse.questionId !== questionId) {
            console.error(`Response pillar/question mismatch! Expected: ${pillarId}/${questionId}, Got: ${mainResponse.pillarId}/${mainResponse.questionId}`)
            return
          }
          
          const individualResponses = await individualResponseService.getIndividualResponsesForResponse(mainResponse.Id)
          dispatch(updateResponseLocal({ pillarId, questionId, individualResponses }))
        }
      } catch (error) {
        console.error(`Error loading individual responses for ${pillarId}/${questionId}:`, error.message)
      }
    }

    loadIndividualResponses()
  }, [user?.id, pillarId, questionId, dispatch, isValidPillar])

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

  // Consolidate all individual responses into a single answer content
  const consolidateResponses = () => {
    const nonEmptyResponses = individualResponses.filter(response => 
      response && (response.name || response.content)
    )
    
    if (nonEmptyResponses.length === 0) {
      return ""
    }
    
    return nonEmptyResponses.map((response, index) => {
      const name = response.name || `Response ${index + 1}`
      const content = response.content || ""
      return `**${name}:**\n${content}\n`
    }).join('\n')
  }

// Save consolidated answers to the answer table
const handleSaveAnswers = async () => {
    // Check for user authentication - user should have userId or Id
    const userId = user?.userId || user?.Id
    if (!userId || !isValidPillar) {
      toast.error("Unable to save: Missing user profile or invalid pillar")
      return
    }

    // CRITICAL: Validate pillar ID to prevent cross-pillar contamination in consolidated answer saving
    const validPillarIds = ["raison-detre", "type-of-business", "expectations", "extinction"];
    if (!validPillarIds.includes(pillarId)) {
      console.error(`CRITICAL: Invalid pillar ID in handleSaveAnswers: ${pillarId}. Preventing consolidated answer save to avoid cross-pillar contamination.`);
      toast.error(`Invalid pillar ID: ${pillarId}. Cannot save answers.`);
      return;
    }

    setIsSaving(true)
    setSaveError(null)
    
    try {
      const consolidatedContent = consolidateResponses()
      
      if (!consolidatedContent.trim()) {
        toast.warning("No responses to save")
        setIsSaving(false)
        return
      }

      // Map pillar and question IDs to their database lookup field values
      // These IDs ensure proper association with the specific pillar and question in the database
      const pillarLookupId = pillarId // Use the pillar identifier as lookup value
      const questionLookupId = questionIndex + 1 // Map question index to question lookup ID
      
      await answerService.saveAnswer(
        userId,
        pillarLookupId,
        questionLookupId,
        consolidatedContent
      )
      
      toast.success("Answers saved successfully!")
      setLastSaved(prev => ({ ...prev, consolidated: new Date() }))
    } catch (error) {
      console.error("Error saving consolidated answers:", error.message)
      setSaveError(error.message)
      toast.error("Failed to save answers: " + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  // Check if there are any responses to save
  const hasResponsesToSave = individualResponses.some(response => 
    response && (response.name || response.content)
  )
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

        {/* Save Answers Button */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {hasResponsesToSave ? "Save all responses for this question" : "No responses to save"}
            </div>
            <Button
              onClick={handleSaveAnswers}
              disabled={!hasResponsesToSave || isSaving}
              variant="primary"
              className="flex items-center space-x-2"
            >
              {isSaving ? (
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
          {saveError && (
            <div className="mt-2 text-sm text-red-600">
              Error: {saveError}
            </div>
          )}
          {lastSaved.consolidated && !isSaving && (
            <div className="mt-2 text-sm text-green-600">
              Last saved: {lastSaved.consolidated.toLocaleTimeString()}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
export default QuestionCard