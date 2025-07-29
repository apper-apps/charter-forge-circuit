import { configureStore } from "@reduxjs/toolkit"
import authSlice from "@/store/slices/authSlice"
import profileSlice from "@/store/slices/profileSlice"
import responsesSlice from "@/store/slices/responsesSlice"
import adminSlice from "@/store/slices/adminSlice"
import userSlice from "@/store/slices/userSlice"

export const store = configureStore({
  reducer: {
    auth: authSlice,
    profile: profileSlice,
    responses: responsesSlice,
    admin: adminSlice,
    user: userSlice
  }
})