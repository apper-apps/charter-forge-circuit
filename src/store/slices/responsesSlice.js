import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  responses: {},
  isLoading: false,
  error: null,
  savingQuestions: {},
  completionStats: {
    overall: { completed: 0, total: 0, percentage: 0 },
    pillars: {}
  }
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

// Helper function to calculate completion statistics
const calculateCompletionStats = (responses, pillars) => {
  const stats = {
    overall: { completed: 0, total: 0, percentage: 0 },
    pillars: {}
  }
  
  // Import PILLARS if not provided
  if (!pillars) {
    // This will be handled by the component calling this
    return stats
  }
  
  let totalQuestions = 0
  let totalCompleted = 0
  
  pillars.forEach(pillar => {
    const pillarResponses = responses[pillar.id] || {}
    const completedQuestions = Object.values(pillarResponses).filter(isResponseAnswered).length
    const pillarTotal = pillar.questions.length
    const pillarPercentage = pillarTotal > 0 ? (completedQuestions / pillarTotal) * 100 : 0
    
    stats.pillars[pillar.id] = {
      completed: completedQuestions,
      total: pillarTotal,
      percentage: pillarPercentage,
      isComplete: completedQuestions === pillarTotal
    }
    
    totalQuestions += pillarTotal
    totalCompleted += completedQuestions
  })
  
  stats.overall = {
    completed: totalCompleted,
    total: totalQuestions,
    percentage: totalQuestions > 0 ? (totalCompleted / totalQuestions) * 100 : 0
  }
  
  return stats
}

const responsesSlice = createSlice({
  name: "responses",
  initialState,
  reducers: {
    fetchResponsesStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    fetchResponsesSuccess: (state, action) => {
      state.isLoading = false
      state.responses = action.payload
      state.error = null
    },
    fetchResponsesFailure: (state, action) => {
      state.isLoading = false
      state.error = action.payload
    },
    saveResponseStart: (state, action) => {
      const { pillarId, questionId, responseNumber = 1 } = action.payload
      const key = `${pillarId}-${questionId}-${responseNumber}`
      state.savingQuestions[key] = true
      state.error = null
    },
    saveResponseSuccess: (state, action) => {
      const { pillarId, questionId, content, responseNumber = 1 } = action.payload
      const key = `${pillarId}-${questionId}-${responseNumber}`
      
      if (!state.responses[pillarId]) {
        state.responses[pillarId] = {}
      }
      if (!state.responses[pillarId][questionId]) {
        state.responses[pillarId][questionId] = []
      }
      
      // For individual responses, store as array of objects with name and content
      if (typeof content === 'object' && content.individualResponses) {
        state.responses[pillarId][questionId] = content.individualResponses
      } else {
        // Legacy support - ensure array has enough slots
        const arrayIndex = responseNumber - 1
        while (state.responses[pillarId][questionId].length <= arrayIndex) {
          state.responses[pillarId][questionId].push("")
        }
        state.responses[pillarId][questionId][arrayIndex] = content
      }
      
      state.savingQuestions[key] = false
      state.error = null
    },
    saveResponseFailure: (state, action) => {
      const { pillarId, questionId, responseNumber = 1, error } = action.payload
      const key = `${pillarId}-${questionId}-${responseNumber}`
      state.savingQuestions[key] = false
      state.error = error
    },
    updateResponseLocal: (state, action) => {
      const { pillarId, questionId, content, responseNumber = 1, individualResponses } = action.payload
      
      if (!state.responses[pillarId]) {
        state.responses[pillarId] = {}
      }
      if (!state.responses[pillarId][questionId]) {
        state.responses[pillarId][questionId] = []
      }
      
      // Handle individual responses
      if (individualResponses) {
        state.responses[pillarId][questionId] = individualResponses
      } else {
        // Legacy support - ensure array has enough slots
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
    },
    updateIndividualResponse: (state, action) => {
      const { pillarId, questionId, responseIndex, field, value } = action.payload
      
      if (!state.responses[pillarId]) {
        state.responses[pillarId] = {}
      }
      if (!state.responses[pillarId][questionId]) {
        state.responses[pillarId][questionId] = []
      }
      
      // Ensure array has enough slots
      while (state.responses[pillarId][questionId].length <= responseIndex) {
        state.responses[pillarId][questionId].push({ name: "", content: "" })
      }
      
      if (field === 'delete') {
        state.responses[pillarId][questionId][responseIndex] = { name: "", content: "" }
      } else {
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
      
      // Ensure array has enough slots
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
    updateCompletionStats: (state, action) => {
      const { pillars } = action.payload
      state.completionStats = calculateCompletionStats(state.responses, pillars)
    },
    clearError: (state) => {
      state.error = null
    }
  }
})

// Selectors
export const selectCompletionStats = (state) => state.responses.completionStats
export const selectPillarCompletion = (state, pillarId) => state.responses.completionStats.pillars[pillarId]
export const selectOverallCompletion = (state) => state.responses.completionStats.overall

export const {
  fetchResponsesStart,
  fetchResponsesSuccess,
  fetchResponsesFailure,
  saveResponseStart,
  saveResponseSuccess,
  saveResponseFailure,
  updateResponseLocal,
  updateIndividualResponse,
  saveIndividualResponseStart,
  saveIndividualResponseSuccess,
  saveIndividualResponseFailure,
  updateCompletionStats,
  clearError
} = responsesSlice.actions

export default responsesSlice.reducer