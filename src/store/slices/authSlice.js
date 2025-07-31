import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  user: null,
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
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout, 
  clearError,
  forgotPasswordStart,
  forgotPasswordSuccess,
  forgotPasswordFailure,
  clearForgotPasswordState
} = authSlice.actions
export default authSlice.reducer