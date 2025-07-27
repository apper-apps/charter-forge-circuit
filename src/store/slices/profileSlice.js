import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  profile: null,
  isLoading: false,
  error: null,
  isSaving: false
}

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    fetchProfileStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    fetchProfileSuccess: (state, action) => {
      state.isLoading = false
      state.profile = action.payload
      state.error = null
    },
    fetchProfileFailure: (state, action) => {
      state.isLoading = false
      state.error = action.payload
    },
    saveProfileStart: (state) => {
      state.isSaving = true
      state.error = null
    },
    saveProfileSuccess: (state, action) => {
      state.isSaving = false
      state.profile = action.payload
      state.error = null
    },
    saveProfileFailure: (state, action) => {
      state.isSaving = false
      state.error = action.payload
    },
    clearError: (state) => {
      state.error = null
    }
  }
})

export const {
  fetchProfileStart,
  fetchProfileSuccess,
  fetchProfileFailure,
  saveProfileStart,
  saveProfileSuccess,
  saveProfileFailure,
  clearError
} = profileSlice.actions

export default profileSlice.reducer