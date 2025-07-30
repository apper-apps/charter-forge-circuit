const { ApperClient } = window.ApperSDK;
const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

export const profileService = {
  async getProfile(userId) {
    try {
      const params = {
        fields: [
          { field: { Name: "Name" } },
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
          { field: { Name: "userId" } },
          { field: { Name: "CreatedOn" } },
          { field: { Name: "ModifiedOn" } }
        ],
        where: [
          {
            FieldName: "userId",
            Operator: "EqualTo",
            Values: [parseInt(userId)]
          }
        ]
      };

      const response = await apperClient.fetchRecords("profile", params);
      
if (!response.success) {
        const errorMessage = response.message || "Failed to fetch profile data";
        console.error("Profile service error:", errorMessage);
        throw new Error(errorMessage);
      }

      return response.data && response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error fetching profile:", error?.response?.data?.message);
      } else {
        console.error("Error fetching profile:", error.message);
      }
      throw error;
    }
},

  async saveProfile(userId, profileData) {
    try {
      // First, check if profile already exists
      const existingProfile = await this.getProfile(userId);
      
      // Filter data to only include Updateable fields based on schema
      const allowedFields = {
        fullName: profileData.fullName,
        phone: profileData.phone,
        businessName: profileData.businessName,
        position: profileData.position,
        otherOwners: profileData.otherOwners,
        businessType: profileData.businessType,
        yearsInBusiness: profileData.yearsInBusiness,
        annualRevenue: profileData.annualRevenue,
        country: profileData.country,
        city: profileData.city,
        userId: parseInt(userId)
      };

      // Remove undefined fields
      const filteredData = Object.fromEntries(
        Object.entries(allowedFields).filter(([_, value]) => value !== undefined)
      );

      let response;
      
      if (existingProfile) {
        // Update existing profile
        const params = {
          records: [{
            Id: existingProfile.Id,
            ...filteredData
          }]
        };
        
        response = await apperClient.updateRecord("profile", params);
      } else {
        // Create new profile
        const params = {
          records: [filteredData]
        };
        
        response = await apperClient.createRecord("profile", params);
      }

      if (!response.success) {
        const errorMessage = response.message || "Failed to save profile data";
        console.error("Profile service error:", errorMessage);
        throw new Error(errorMessage);
      }

      if (response.results) {
        const successfulRecords = response.results.filter(result => result.success);
        const failedRecords = response.results.filter(result => !result.success);
        
        if (failedRecords.length > 0) {
          console.error(`Failed to save profile ${failedRecords.length} records:${JSON.stringify(failedRecords)}`);
          throw new Error(failedRecords[0].message || "Failed to save profile");
        }
        
        return successfulRecords.length > 0 ? successfulRecords[0].data : null;
      }

      return null;
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error saving profile:", error?.response?.data?.message);
      } else {
        console.error("Error saving profile:", error.message);
      }
      throw error;
}
  }
};