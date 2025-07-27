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
      const { pillarId, questionId } = action.payload
      const key = `${pillarId}-${questionId}`
      state.savingQuestions[key] = true
      state.error = null
    },
    saveResponseSuccess: (state, action) => {
      const { pillarId, questionId, content } = action.payload
      const key = `${pillarId}-${questionId}`
      
      if (!state.responses[pillarId]) {
        state.responses[pillarId] = {}
      }
      state.responses[pillarId][questionId] = content
      state.savingQuestions[key] = false
      state.error = null
    },
    saveResponseFailure: (state, action) => {
      const { pillarId, questionId, error } = action.payload
      const key = `${pillarId}-${questionId}`
      state.savingQuestions[key] = false
      state.error = error
    },
    updateResponseLocal: (state, action) => {
      const { pillarId, questionId, content } = action.payload
      
      if (!state.responses[pillarId]) {
        state.responses[pillarId] = {}
      }
      state.responses[pillarId][questionId] = content
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