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
          { field: { Name: "email" } },
          { field: { Name: "phone" } },
          { field: { Name: "businessName" } },
          { field: { Name: "position" } },
          { field: { Name: "otherOwners" } },
{ field: { Name: "businessType" } },
          { field: { Name: "yearsInBusiness" } },
          { field: { Name: "employeeNumber" } },
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
        console.error(response.message);
        throw new Error(response.message);
      }

      return response.data && response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
if (error?.response?.status === 401) {
        console.error("Authentication failed - user may need to login again");
        throw new Error("Authentication required. Please login again.");
      }
      if (error?.response?.data?.message) {
        console.error("Error fetching profile:", error?.response?.data?.message);
      } else {
        console.error("Error fetching profile:", error?.message || error);
      }
      throw error;
    }
  },

  async saveProfile(userId, profileData) {
    try {
      // First check if profile exists
      const existingProfile = await this.getProfile(userId);
      
      // Prepare data with only Updateable fields
// Prepare data with only Updateable fields
      const updateableData = {
        fullName: profileData.fullName,
        email: profileData.email,
        phone: profileData.phone,
        businessName: profileData.businessName,
        position: profileData.position,
        otherOwners: profileData.otherOwners,
        businessType: profileData.businessType,
yearsInBusiness: parseInt(profileData.yearsInBusiness),
        employeeNumber: parseInt(profileData.employeeNumber),
        annualRevenue: profileData.annualRevenue,
        country: profileData.country,
        city: profileData.city,
        userId: parseInt(userId)
      };

if (existingProfile) {
        // Update existing profile
        const params = {
          records: [
            {
              Id: existingProfile.Id,
              ...updateableData
            }
          ]
        };

        const response = await apperClient.updateRecord("profile", params);
        
        if (!response.success) {
          console.error(response.message);
          throw new Error(response.message);
        }

        if (response.results) {
          const failedUpdates = response.results.filter(result => !result.success);
          
          if (failedUpdates.length > 0) {
            console.error(`Failed to update profile ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
            
            failedUpdates.forEach(record => {
              record.errors?.forEach(error => {
                throw new Error(`${error.fieldLabel}: ${error.message}`);
              });
              if (record.message) throw new Error(record.message);
            });
          }
          
          const successfulUpdates = response.results.filter(result => result.success);
          return successfulUpdates.length > 0 ? successfulUpdates[0].data : null;
        }
      } else {
        // Create new profile
        const params = {
          records: [updateableData]
        };

        const response = await apperClient.createRecord("profile", params);
        
        if (!response.success) {
          console.error(response.message);
          throw new Error(response.message);
        }

        if (response.results) {
          const failedCreates = response.results.filter(result => !result.success);
          
          if (failedCreates.length > 0) {
            console.error(`Failed to create profile ${failedCreates.length} records:${JSON.stringify(failedCreates)}`);
            
            failedCreates.forEach(record => {
              record.errors?.forEach(error => {
                throw new Error(`${error.fieldLabel}: ${error.message}`);
              });
              if (record.message) throw new Error(record.message);
            });
          }
          
          const successfulCreates = response.results.filter(result => result.success);
          return successfulCreates.length > 0 ? successfulCreates[0].data : null;
        }
      }
    } catch (error) {
if (error?.response?.status === 401) {
        console.error("Authentication failed during profile save - user may need to login again");
        throw new Error("Authentication required. Please login again.");
      }
      if (error?.response?.data?.message) {
        console.error("Error saving profile:", error?.response?.data?.message);
      } else {
        console.error("Error saving profile:", error?.message || error);
      }
      throw error;
    }
  }
}