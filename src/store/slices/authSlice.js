import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  user: null,
  isLoading: false,
  error: null,
  resetPasswordLoading: false,
  resetPasswordError: null,
  resetPasswordSuccess: false
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    loginSuccess: (state, action) => {
      state.isLoading = false
      state.user = action.payload
      state.error = null
    },
    loginFailure: (state, action) => {
      state.isLoading = false
      state.error = action.payload
      state.user = null
    },
    logout: (state) => {
      state.user = null
      state.error = null
      state.isLoading = false
    },
clearError: (state) => {
      state.error = null
    },
    resetPasswordStart: (state) => {
      state.resetPasswordLoading = true
      state.resetPasswordError = null
      state.resetPasswordSuccess = false
    },
    resetPasswordSuccess: (state) => {
      state.resetPasswordLoading = false
      state.resetPasswordError = null
      state.resetPasswordSuccess = true
    },
    resetPasswordFailure: (state, action) => {
      state.resetPasswordLoading = false
      state.resetPasswordError = action.payload
      state.resetPasswordSuccess = false
    },
    clearResetPasswordState: (state) => {
      state.resetPasswordLoading = false
      state.resetPasswordError = null
      state.resetPasswordSuccess = false
    }
  }
})
export const { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout, 
  clearError,
  resetPasswordStart,
  resetPasswordSuccess, 
  resetPasswordFailure,
  clearResetPasswordState
} = authSlice.actions
export default authSlice.reducer