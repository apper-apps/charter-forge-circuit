import { configureStore } from "@reduxjs/toolkit"
import authSlice from "@/store/slices/authSlice"
import userSlice from "@/store/slices/userSlice"
import profileSlice from "@/store/slices/profileSlice"
import responsesSlice from "@/store/slices/responsesSlice"
import adminSlice from "@/store/slices/adminSlice"

export const store = configureStore({
  reducer: {
    auth: authSlice,
    user: userSlice,
    profile: profileSlice,
    responses: responsesSlice,
    admin: adminSlice
  }
})