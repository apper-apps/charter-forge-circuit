import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  isLoading: false,
  error: null,
  forgotPasswordLoading: false,
  forgotPasswordError: null,
  forgotPasswordSuccess: false
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    forgotPasswordStart: (state) => {
      state.forgotPasswordLoading = true
      state.forgotPasswordError = null
      state.forgotPasswordSuccess = false
    },
    forgotPasswordSuccess: (state) => {
      state.forgotPasswordLoading = false
      state.forgotPasswordError = null
      state.forgotPasswordSuccess = true
    },
    forgotPasswordFailure: (state, action) => {
      state.forgotPasswordLoading = false
      state.forgotPasswordError = action.payload
      state.forgotPasswordSuccess = false
    },
    clearForgotPasswordState: (state) => {
      state.forgotPasswordLoading = false
      state.forgotPasswordError = null
      state.forgotPasswordSuccess = false
    }
  }
})

export const { 
  clearError,
  forgotPasswordStart,
  forgotPasswordSuccess,
  forgotPasswordFailure,
  clearForgotPasswordState
} = authSlice.actions
export default authSlice.reducer