import { configureStore } from '@reduxjs/toolkit'
import userSlice from '@/store/slices/userSlice'
import authSlice from '@/store/slices/authSlice'
import profileSlice from '@/store/slices/profileSlice'
import responsesSlice from '@/store/slices/responsesSlice'
import adminSlice from '@/store/slices/adminSlice'

export const store = configureStore({
  reducer: {
    user: userSlice,
    auth: authSlice,
    profile: profileSlice,
    responses: responsesSlice,
    admin: adminSlice
  },
})