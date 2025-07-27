import profiles from "@/services/mockData/profiles.json"

let profilesData = [...profiles]

export const profileService = {
  async getProfile(userId) {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const profile = profilesData.find(p => p.userId === userId)
    return profile || null
  },

  async saveProfile(userId, profileData) {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const existingIndex = profilesData.findIndex(p => p.userId === userId)
    
    if (existingIndex >= 0) {
      // Update existing profile
      profilesData[existingIndex] = {
        ...profilesData[existingIndex],
        ...profileData,
        userId
      }
      return profilesData[existingIndex]
    } else {
      // Create new profile
      const newProfile = {
        Id: Math.max(...profilesData.map(p => p.Id), 0) + 1,
        userId,
        ...profileData
      }
      profilesData.push(newProfile)
      return newProfile
    }
  }
}