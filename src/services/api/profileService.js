export const profileService = {
  async getProfile(userId) {
    try {
      const { ApperClient } = window.ApperSDK
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      })

      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "Tags" } },
          { field: { Name: "Owner" } },
          { field: { Name: "fullName" } },
          { field: { Name: "phone" } },
          { field: { Name: "businessName" } },
          { field: { Name: "position" } },
          { field: { Name: "otherOwners" } },
          { field: { Name: "businessType" } },
          { field: { Name: "yearsInBusiness" } },
          { field: { Name: "annualRevenue" } },
          { field: { Name: "country" } },
          { field: { Name: "city" } },
{ field: { Name: "userId" } }
        ],
        where: [
          {
            FieldName: "userId",
            Operator: "EqualTo",
            Values: [parseInt(userId)]
          }
        ],
        pagingInfo: {
          limit: 1,
          offset: 0
        }
      }

      const response = await apperClient.fetchRecords("profile", params)
      
      if (!response.success) {
        console.error(response.message)
        throw new Error(response.message)
      }
return response.data && response.data.length > 0 ? response.data[0] : null
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error fetching profile:", error?.response?.data?.message)
      } else {
        console.error(error.message)
      }
      throw error
    }
  },

async saveProfile(userId, profileData) {
    try {
      const { ApperClient } = window.ApperSDK
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      })

      // Check if profile exists
      const existingProfile = await this.getProfile(userId)
      
      // Prepare data with only updateable fields that exist in the database schema
      const updateableData = {
        Name: profileData.fullName || profileData.Name || "",
        Tags: profileData.Tags || "",
        Owner: profileData.Owner,
        fullName: profileData.fullName || "",
        phone: profileData.phone || "",
        businessName: profileData.businessName || "",
        position: profileData.position || "",
        otherOwners: profileData.otherOwners || "",
        businessType: profileData.businessType || "",
        yearsInBusiness: parseInt(profileData.yearsInBusiness) || 0,
        annualRevenue: profileData.annualRevenue || "",
        country: profileData.country || "",
        city: profileData.city || "",
userId: parseInt(userId)
      }

      let response
      if (existingProfile) {
        // Update existing profile
        const params = {
          records: [{
            Id: existingProfile.Id,
            ...updateableData
          }]
        }
        response = await apperClient.updateRecord("profile", params)
      } else {
        // Create new profile
        const params = {
          records: [updateableData]
        }
        response = await apperClient.createRecord("profile", params)
      }

      if (!response.success) {
        console.error(response.message)
        throw new Error(response.message)
      }

      if (response.results) {
        const successfulRecords = response.results.filter(result => result.success)
        const failedRecords = response.results.filter(result => !result.success)
        
        if (failedRecords.length > 0) {
          console.error(`Failed to save profile ${failedRecords.length} records:${JSON.stringify(failedRecords)}`)
          throw new Error(failedRecords[0].message || "Failed to save profile")
        }
        
return successfulRecords.length > 0 ? successfulRecords[0].data : null
      }

      return null
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error saving profile:", error?.response?.data?.message)
      } else {
        console.error(error.message)
      }
      throw error
    }
  }
}