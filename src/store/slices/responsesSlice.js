import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  responses: {},
  isLoading: false,
  error: null,
  savingQuestions: {}
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
      
      // Ensure array has enough slots
      const arrayIndex = responseNumber - 1
      while (state.responses[pillarId][questionId].length <= arrayIndex) {
        state.responses[pillarId][questionId].push("")
      }
      
      state.responses[pillarId][questionId][arrayIndex] = content
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
      const { pillarId, questionId, content, responseNumber = 1 } = action.payload
      
      if (!state.responses[pillarId]) {
        state.responses[pillarId] = {}
      }
      if (!state.responses[pillarId][questionId]) {
        state.responses[pillarId][questionId] = []
      }
      
      // Ensure array has enough slots
      const arrayIndex = responseNumber - 1
      while (state.responses[pillarId][questionId].length <= arrayIndex) {
        state.responses[pillarId][questionId].push("")
      }
      
      state.responses[pillarId][questionId][arrayIndex] = content
    },
    clearError: (state) => {
      state.error = null
    }
  }
})

export const {
  fetchResponsesStart,
  fetchResponsesSuccess,
  fetchResponsesFailure,
  saveResponseStart,
  saveResponseSuccess,
  saveResponseFailure,
  updateResponseLocal,
  clearError
} = responsesSlice.actions

export default responsesSlice.reducer