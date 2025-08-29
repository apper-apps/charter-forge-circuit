import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { responsesService } from "@/services/api/responsesService";
import { individualResponseService } from "@/services/api/individualResponseService";
import { answerService } from "@/services/api/answerService";
import { toast } from "react-toastify";
import { saveIndividualResponseFailure, saveIndividualResponseStart, saveIndividualResponseSuccess, saveResponseFailure, saveResponseStart, saveResponseSuccess, updateIndividualResponse, updateResponseLocal } from "@/store/slices/responsesSlice";
import ApperIcon from "@/components/ApperIcon";
import RichTextEditor from "@/components/molecules/RichTextEditor";
import AutoSaveIndicator from "@/components/molecules/AutoSaveIndicator";
import Card from "@/components/atoms/Card";
import Button from "@/components/atoms/Button";
import Error from "@/components/ui/Error";
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
  const [familyMembers, setFamilyMembers] = useState([])
  const [lastSaved, setLastSaved] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  
  // Get default number of family member slots from Redux configuration
  const defaultFamilyMemberSlots = useSelector((state) => state.responses.defaultFamilyMemberSlots || 3)

  // Load individual responses when component mounts
// Initialize family members based on existing responses or default
  useEffect(() => {
    if (individualResponses.length > 0) {
      // Use existing responses to populate family members
      const members = individualResponses.map((response, index) => ({
        id: `member-${index}`,
        name: response.name || "",
        content: response.content || "",
        index: index
      }))
      setFamilyMembers(members)
    } else {
      // Initialize with default number of empty family member slots
      const defaultMembers = Array(defaultFamilyMemberSlots).fill(null).map((_, index) => ({
        id: `member-${index}`,
        name: "",
        content: "",
        index: index
      }))
      setFamilyMembers(defaultMembers)
    }
  }, [individualResponses.length, defaultFamilyMemberSlots])

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
          
          const loadedResponses = await individualResponseService.getIndividualResponsesForResponse(mainResponse.Id)
          dispatch(updateResponseLocal({ pillarId, questionId, individualResponses: loadedResponses }))
        } else {
          // If no main response exists, check if there are existing answers and load them
          try {
            const existingAnswers = await answerService.getAnswersByPillar(user.id, pillarId)
            const questionAnswer = existingAnswers.find(answer => 
              String(answer.questionId?.Id || answer.questionId) === String(questionId)
            )
            
            if (questionAnswer && questionAnswer.answerContent) {
              // Parse existing answer content and populate individual responses
              const answerContent = questionAnswer.answerContent
              if (answerContent.trim()) {
                console.log(`Loading existing answer for ${pillarId}/${questionId}`)
                // Initialize with existing consolidated answer
                const initialResponse = [{ name: "", content: answerContent }]
                dispatch(updateResponseLocal({ pillarId, questionId, individualResponses: initialResponse }))
              }
            }
          } catch (answerError) {
            console.log(`No existing answers found for ${pillarId}/${questionId}:`, answerError.message)
          }
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
      
      // CRITICAL: After saving individual response, consolidate and save as answer
      // This ensures data persistence across sessions and proper data retrieval
      try {
        await handleSaveAnswers()
        console.log(`Successfully consolidated and saved answer for ${pillarId}/${questionId}`)
      } catch (consolidationError) {
        console.warn(`Individual response saved but consolidation failed for ${pillarId}/${questionId}:`, consolidationError.message)
        // Don't fail the individual save if consolidation fails
      }
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

  const handleAddFamilyMember = () => {
    const newIndex = familyMembers.length
    const newMember = {
      id: `member-${newIndex}`,
      name: "",
      content: "",
      index: newIndex
    }
    setFamilyMembers(prev => [...prev, newMember])
    
    // Update Redux state to include new empty slot
    const updatedResponses = [...individualResponses]
    updatedResponses[newIndex] = { name: "", content: "" }
    dispatch(updateResponseLocal({ pillarId, questionId, individualResponses: updatedResponses }))
  }

  const handleRemoveFamilyMember = async (responseIndex) => {
    if (familyMembers.length <= 1) {
      toast.warning("At least one family member response slot is required")
      return
    }

    // If there's content, confirm removal
    const member = familyMembers[responseIndex]
    if (member && (member.name || member.content)) {
      if (!confirm(`Remove ${member.name || 'this family member'}? This will permanently delete their response.`)) {
        return
      }
    }

    try {
      // Delete from backend if it exists
      if (user?.id) {
        const mainResponse = await responsesService.getMainResponse(user.id, pillarId, questionId)
        if (mainResponse) {
          await individualResponseService.deleteIndividualResponse(mainResponse.Id, responseIndex)
        }
      }
      
      // Remove from local state
      const updatedMembers = familyMembers.filter((_, index) => index !== responseIndex)
        .map((member, newIndex) => ({ ...member, index: newIndex, id: `member-${newIndex}` }))
      
      setFamilyMembers(updatedMembers)
// Update Redux state using the 'remove' action to properly handle array removal and reindexing
      dispatch(updateIndividualResponse({ pillarId, questionId, responseIndex, field: 'remove' }))
      
      toast.success("Family member removed successfully")
    } catch (error) {
      toast.error("Failed to remove family member")
      console.error("Remove error:", error.message)
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
const hasResponsesToSave = useMemo(() => {
    return individualResponses.some(response => 
      response && (response.name || response.content || 
        (typeof response.content === 'string' && response.content.replace(/<[^>]*>/g, '').trim().length > 0))
    ) || familyMembers.some(member => 
      member && (member.name || member.content)
    )
  }, [individualResponses, familyMembers])
  
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
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              {familyMembers.length} family member{familyMembers.length !== 1 ? 's' : ''} can respond separately to this question. Each response will be saved automatically.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddFamilyMember}
              className="flex items-center space-x-1"
            >
              <ApperIcon name="Plus" size={16} />
              <span>Add Family Member</span>
            </Button>
          </div>
          
{familyMembers.map((member, responseIndex) => {
            const response = getIndividualResponse(responseIndex)
            const hasContent = response.name || response.content
            
            return (
              <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700">
                    Family Member {responseIndex + 1}
                    {response.name && ` - ${response.name}`}
                  </h4>
                  <div className="flex items-center space-x-2">
                    {hasContent && (
                      <button
                        onClick={() => handleDeleteIndividualResponse(responseIndex)}
                        className="text-orange-500 hover:text-orange-700 text-sm"
                        title="Clear this response"
                      >
                        Clear
                      </button>
                    )}
                    {familyMembers.length > 1 && (
                      <button
                        onClick={() => handleRemoveFamilyMember(responseIndex)}
                        className="text-red-500 hover:text-red-700 text-sm"
                        title="Remove this family member slot"
                      >
                        <ApperIcon name="Trash2" size={14} />
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
                      Name & Relationship
                    </label>
                    <input
                      type="text"
                      value={response.name}
                      onChange={(e) => {
                        handleIndividualResponseChange(responseIndex, 'name', e.target.value)
                        // Update family member name in local state
                        setFamilyMembers(prev => prev.map((m, i) => 
                          i === responseIndex ? { ...m, name: e.target.value } : m
                        ))
                      }}
                      onBlur={() => {
                        if (response.name || response.content) {
                          saveIndividualResponse(responseIndex, response.name, response.content)
                        }
                      }}
                      placeholder="e.g., Aunt Joan, Uncle Rick, Father John"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Response
                    </label>
                    <RichTextEditor
                      value={response.content}
                      onChange={(content) => {
                        handleIndividualResponseChange(responseIndex, 'content', content)
                        // Update family member content in local state
                        setFamilyMembers(prev => prev.map((m, i) => 
                          i === responseIndex ? { ...m, content: content } : m
                        ))
                      }}
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
                {hasResponsesToSave ? `Save all ${familyMembers.length} family member responses for this question` : "No responses to save"}
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