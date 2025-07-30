import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  participants: [],
  selectedParticipant: null,
  participantResponses: {},
  isLoading: false,
  error: null,
  filters: {
    search: "",
    completionStatus: "all"
  }
}

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    fetchParticipantsStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    fetchParticipantsSuccess: (state, action) => {
      state.isLoading = false
      state.participants = action.payload
      state.error = null
    },
    fetchParticipantsFailure: (state, action) => {
      state.isLoading = false
      state.error = action.payload
    },
    fetchParticipantResponsesStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    fetchParticipantResponsesSuccess: (state, action) => {
      state.isLoading = false
      state.selectedParticipant = action.payload.participant
      state.participantResponses = action.payload.responses
      state.error = null
    },
    fetchParticipantResponsesFailure: (state, action) => {
      state.isLoading = false
      state.error = action.payload
    },
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearSelectedParticipant: (state) => {
      state.selectedParticipant = null
      state.participantResponses = {}
    },
    clearError: (state) => {
      state.error = null
    }
  }
})

export const {
  fetchParticipantsStart,
  fetchParticipantsSuccess,
  fetchParticipantsFailure,
  fetchParticipantResponsesStart,
  fetchParticipantResponsesSuccess,
  fetchParticipantResponsesFailure,
  updateFilters,
  clearSelectedParticipant,
  clearError
} = adminSlice.actions

export default adminSlice.reducer