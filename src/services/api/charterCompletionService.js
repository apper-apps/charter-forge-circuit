const { ApperClient } = window.ApperSDK;

const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

export const charterCompletionService = {
  async getCharterCompletion(profileId) {
    try {
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "profileId" } },
          { field: { Name: "completionPercentage" } },
          { field: { Name: "lastUpdated" } },
          { field: { Name: "CreatedOn" } },
          { field: { Name: "ModifiedOn" } }
        ],
        where: [
          {
            FieldName: "profileId",
            Operator: "EqualTo",
            Values: [parseInt(profileId)]
          }
        ]
      };

      const response = await apperClient.fetchRecords("charterCompletion", params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      return response.data && response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error fetching charter completion:", error?.response?.data?.message);
      } else {
        console.error("Error fetching charter completion:", error.message);
      }
      throw error;
    }
  },

  async updateCharterCompletion(profileId, completionPercentage) {
    try {
      // First check if charter completion record exists
      const existingCompletion = await this.getCharterCompletion(profileId);
      
      const updateableData = {
        Name: `Charter Completion - Profile ${profileId}`,
        profileId: parseInt(profileId),
        completionPercentage: Math.round(completionPercentage),
        lastUpdated: new Date().toISOString()
      };

      if (existingCompletion) {
        // Update existing record
        const updateParams = {
          records: [
            {
              Id: existingCompletion.Id,
              ...updateableData
            }
          ]
        };

        const response = await apperClient.updateRecord("charterCompletion", updateParams);
        
        if (!response.success) {
          console.error(response.message);
          throw new Error(response.message);
        }

        if (response.results) {
          const failedUpdates = response.results.filter(result => !result.success);
          
          if (failedUpdates.length > 0) {
            console.error(`Failed to update charter completion ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
            
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
        // Create new record
        const createParams = {
          records: [updateableData]
        };

        const response = await apperClient.createRecord("charterCompletion", createParams);
        
        if (!response.success) {
          console.error(response.message);
          throw new Error(response.message);
        }

        if (response.results) {
          const failedCreates = response.results.filter(result => !result.success);
          
          if (failedCreates.length > 0) {
            console.error(`Failed to create charter completion ${failedCreates.length} records:${JSON.stringify(failedCreates)}`);
            
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
      if (error?.response?.data?.message) {
        console.error("Error updating charter completion:", error?.response?.data?.message);
      } else {
        console.error("Error updating charter completion:", error.message);
      }
      throw error;
    }
  }
};