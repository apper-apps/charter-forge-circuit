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
  },
  permissionUpdateLoading: false
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
    },
    updatePermissionsStart: (state) => {
      state.permissionUpdateLoading = true
      state.error = null
    },
    updatePermissionsSuccess: (state, action) => {
      state.permissionUpdateLoading = false
      // Update the participant in the list
      const participantIndex = state.participants.findIndex(p => p.id === action.payload.userId)
      if (participantIndex !== -1) {
        state.participants[participantIndex].permissions = action.payload.permissions
      }
      // Update selected participant if it matches
      if (state.selectedParticipant && state.selectedParticipant.id === action.payload.userId) {
        state.selectedParticipant.permissions = action.payload.permissions
      }
    },
    updatePermissionsFailure: (state, action) => {
      state.permissionUpdateLoading = false
      state.error = action.payload
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
clearError,
  updatePermissionsStart,
  updatePermissionsSuccess,
  updatePermissionsFailure
} = adminSlice.actions

export default adminSlice.reducer