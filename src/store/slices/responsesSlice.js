import { createSlice } from '@reduxjs/toolkit'

// Centralized helper function to check if a response has content
// Used consistently across Dashboard, Export, AdminDashboard, and PillarCard components
const isResponseAnswered = (response) => {
  if (!response) return false
  
  // Handle different response formats consistently
  if (typeof response === 'string') {
    return response.replace(/<[^>]*>/g, '').trim().length > 0
  }
  
  if (typeof response === 'object') {
    // Handle response with content property
    if (response.content) {
      return response.content.replace(/<[^>]*>/g, '').trim().length > 0
    }
    
    // Handle individual responses array - support dynamic length
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

// Helper function to calculate completion statistics  
// Removed duplicate isResponseAnswered function declaration

// Centralized completion calculation used across Dashboard, Export, and AdminDashboard
const calculateCompletionStats = (responses, pillars) => {
  if (!pillars || !Array.isArray(pillars)) return { completed: 0, total: 0, percentage: 0 }

  const totalQuestions = pillars.reduce((sum, pillar) => {
    return sum + (pillar.questions ? pillar.questions.length : 0)
  }, 0)

  let completedQuestions = 0
  
  Object.values(responses).forEach(pillarResponses => {
    if (pillarResponses && typeof pillarResponses === 'object') {
      Object.values(pillarResponses).forEach(response => {
        if (isResponseAnswered(response)) {
          completedQuestions++
        }
      })
    }
  })

  return {
    completed: completedQuestions,
    total: totalQuestions,
    percentage: totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0
  }
}

const initialState = {
  responses: {},
  isLoading: false,
  error: null,
  savingQuestions: {},
  lastSaved: {},
  defaultFamilyMemberSlots: 3, // Configurable default number of family member slots
  familyMemberConfiguration: {
    allowAdd: true,
    allowRemove: true,
    minSlots: 1,
    maxSlots: 10
  }
}

// Import completion services for real-time progress updates
import { charterCompletionService } from '@/services/api/charterCompletionService'
import { pillarCompletionService } from '@/services/api/pillarCompletionService'
import { PILLARS } from '@/services/mockData/pillars'

const responsesSlice = createSlice({
  name: 'responses',
  initialState,
  reducers: {
    fetchResponsesStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    fetchResponsesSuccess: (state, action) => {
      state.isLoading = false
      state.responses = action.payload
    },
    fetchResponsesFailure: (state, action) => {
      state.isLoading = false
      state.error = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    saveResponseStart: (state, action) => {
      const { pillarId, questionId } = action.payload
      const key = `${pillarId}-${questionId}`
      state.savingQuestions[key] = true
      state.error = null
    },
saveResponseSuccess: (state, action) => {
      const { pillarId, questionId, content, responseNumber = 1, profileId, consolidatedAnswer } = action.payload
      const key = `${pillarId}-${questionId}`
      
      if (!state.responses[pillarId]) {
        state.responses[pillarId] = {}
      }
      if (!state.responses[pillarId][questionId]) {
        state.responses[pillarId][questionId] = []
      }
      
      // Handle both individual responses and consolidated answers
      if (consolidatedAnswer) {
        // Parse consolidated answer back into individual responses
        try {
          const sections = consolidatedAnswer.split('\n\n').filter(section => section.trim())
          const parsedResponses = sections.map(section => {
            const lines = section.split('\n')
            const nameMatch = lines[0].match(/\*\*(.*?):\*\*/)
            const name = nameMatch ? nameMatch[1] : ""
            const content = lines.slice(1).join('\n').trim()
            return { name, content }
          })
          state.responses[pillarId][questionId] = parsedResponses
        } catch (error) {
          console.warn('Failed to parse consolidated answer, storing as single response:', error)
          state.responses[pillarId][questionId] = [{ name: "", content: consolidatedAnswer }]
        }
      } else {
        // Ensure array has enough slots for individual response
        const arrayIndex = responseNumber - 1
        while (state.responses[pillarId][questionId].length <= arrayIndex) {
          state.responses[pillarId][questionId].push({ name: "", content: "" })
        }
        
        // Update the specific response
        if (typeof content === 'string') {
          state.responses[pillarId][questionId][arrayIndex] = { name: "", content }
        } else {
          state.responses[pillarId][questionId][arrayIndex] = content
        }
      }
      
      state.savingQuestions[key] = false
      state.lastSaved[key] = new Date().toISOString()
      state.error = null
      
      // Calculate and update completion percentages in real-time
      if (profileId) {
        calculateAndUpdateCompletions(state, profileId, pillarId)
      }
    },
    saveResponseFailure: (state, action) => {
      const { pillarId, questionId, error } = action.payload
      const key = `${pillarId}-${questionId}`
      state.savingQuestions[key] = false
      state.error = error
    },
updateResponseLocal: (state, action) => {
      const { pillarId, questionId, content, responseNumber = 1, individualResponses, profileId } = action.payload
      
      // CRITICAL: Validate pillar ID to prevent cross-pillar contamination
      const validPillarIds = ["raison-detre", "type-of-business", "expectations", "extinction"]
      if (!validPillarIds.includes(pillarId)) {
        console.error(`CRITICAL: Invalid pillar ID in updateResponseLocal: ${pillarId}. Preventing response corruption.`)
        return // Do not update state with invalid pillar ID
      }
      
      console.log(`Updating local response for pillar: ${pillarId}, question: ${questionId}`)
      
      if (!state.responses[pillarId]) {
        state.responses[pillarId] = {}
      }
      if (!state.responses[pillarId][questionId]) {
        state.responses[pillarId][questionId] = []
      }
      
      // Handle individual responses - support dynamic array length
      if (individualResponses) {
        state.responses[pillarId][questionId] = individualResponses
      } else {
        // Legacy support - ensure array has enough slots based on actual usage
        const arrayIndex = responseNumber - 1
        while (state.responses[pillarId][questionId].length <= arrayIndex) {
          state.responses[pillarId][questionId].push({ name: "", content: "" })
        }
        
        if (content !== undefined) {
          state.responses[pillarId][questionId][arrayIndex] = typeof content === 'string' 
            ? { name: "", content } 
            : content
        }
      }
      
      // Recalculate completion percentages in real-time as user types
      if (profileId) {
        calculateAndUpdateCompletions(state, profileId, pillarId)
      }
    },
    updateIndividualResponse: (state, action) => {
      const { pillarId, questionId, responseIndex, field, value } = action.payload
      
      if (!state.responses[pillarId]) {
        state.responses[pillarId] = {}
      }
      if (!state.responses[pillarId][questionId]) {
        state.responses[pillarId][questionId] = []
      }
      
      // Support dynamic array sizing - only ensure slots for existing responses
      if (field === 'delete') {
        if (responseIndex < state.responses[pillarId][questionId].length) {
          state.responses[pillarId][questionId][responseIndex] = { name: "", content: "" }
        }
      } else if (field === 'remove') {
        // Completely remove the response slot and reindex
        state.responses[pillarId][questionId].splice(responseIndex, 1)
      } else {
        // Ensure array has enough slots for the specific index being updated
        while (state.responses[pillarId][questionId].length <= responseIndex) {
          state.responses[pillarId][questionId].push({ name: "", content: "" })
        }
        state.responses[pillarId][questionId][responseIndex][field] = value
      }
    },
    saveIndividualResponseStart: (state, action) => {
      const { pillarId, questionId, responseIndex } = action.payload
      const key = `${pillarId}-${questionId}-${responseIndex}`
      state.savingQuestions[key] = true
      state.error = null
    },
    saveIndividualResponseSuccess: (state, action) => {
      const { pillarId, questionId, responseIndex, name, content } = action.payload
      const key = `${pillarId}-${questionId}-${responseIndex}`
      
      if (!state.responses[pillarId]) {
        state.responses[pillarId] = {}
      }
      if (!state.responses[pillarId][questionId]) {
        state.responses[pillarId][questionId] = []
      }
      
      // Ensure array has enough slots for the specific index
      while (state.responses[pillarId][questionId].length <= responseIndex) {
        state.responses[pillarId][questionId].push({ name: "", content: "" })
      }
      
      state.responses[pillarId][questionId][responseIndex] = { name, content }
      state.savingQuestions[key] = false
      state.error = null
    },
    saveIndividualResponseFailure: (state, action) => {
      const { pillarId, questionId, responseIndex, error } = action.payload
      const key = `${pillarId}-${questionId}-${responseIndex}`
      state.savingQuestions[key] = false
      state.error = error
    },
    updateFamilyMemberConfiguration: (state, action) => {
      const { defaultFamilyMemberSlots } = action.payload
      state.defaultFamilyMemberSlots = defaultFamilyMemberSlots
    },
    clearResponses: (state) => {
      state.responses = {}
      state.savingQuestions = {}
      state.lastSaved = {}
      state.error = null
    }
  }
})

// Selectors
// Helper function to calculate and update completion percentages
const calculateAndUpdateCompletions = async (state, profileId, updatedPillarId = null) => {
  try {
    const responses = state.responses
    
    // Calculate pillar completion percentages
    if (updatedPillarId) {
      const pillar = PILLARS.find(p => p.id === updatedPillarId)
      if (pillar) {
const pillarResponses = responses[updatedPillarId] || {}
        const completedQuestions = Object.values(pillarResponses).filter(isResponseAnswered).length
        const pillarCompletion = Math.round((completedQuestions / pillar.questions.length) * 100)
        const isComplete = pillarCompletion === 100
        
        // Update pillar completion in database (async - don't block UI)
        pillarCompletionService.updatePillarCompletion(
          profileId, 
          updatedPillarId, 
          pillarCompletion, 
          isComplete
        ).catch(error => {
          console.error('Error updating pillar completion:', error)
        })
      }
    }
    
    // Calculate overall charter completion using consistent rounding
    const totalQuestions = PILLARS.reduce((sum, pillar) => sum + pillar.questions.length, 0)
    const completedQuestions = Object.values(responses).reduce((sum, pillarResponses) => {
      return sum + Object.values(pillarResponses).filter(isResponseAnswered).length
    }, 0)
    const overallProgress = totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0
    
    // Update charter completion in database (async - don't block UI)
    charterCompletionService.updateCharterCompletion(profileId, overallProgress).catch(error => {
      console.error('Error updating charter completion:', error)
    })
    
  } catch (error) {
    console.error('Error calculating completions:', error)
  }
}

// Centralized selectors using standardized completion logic
export const selectCompletionStats = (state, pillars) => {
  return calculateCompletionStats(state.responses.responses, pillars)
}

export const selectOverallCompletion = (state, pillars) => {
  const stats = calculateCompletionStats(state.responses.responses, pillars)
  return stats.percentage
}

// Centralized pillar completion selector ensuring consistent percentage calculation
export const selectPillarCompletion = (state, pillarId, pillar) => {
  const responses = state.responses.responses
  const pillarResponses = responses[pillarId] || {}
  
  if (!pillar || !pillar.questions) return 0
  
  const totalQuestions = pillar.questions.length
  const answeredQuestions = Object.values(pillarResponses).filter(isResponseAnswered).length
  
  return totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
}

// Export the standardized response validation and completion functions for use in components
export { isResponseAnswered }

export const {
  fetchResponsesStart,
  fetchResponsesSuccess, 
  fetchResponsesFailure,
  clearError,
  saveResponseStart,
  saveResponseSuccess,
  saveResponseFailure,
  updateResponseLocal,
  updateIndividualResponse,
  saveIndividualResponseStart,
  saveIndividualResponseSuccess,
  saveIndividualResponseFailure,
  updateFamilyMemberConfiguration,
  clearResponses
} = responsesSlice.actions

export default responsesSlice.reducer