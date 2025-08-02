const { ApperClient } = window.ApperSDK;

const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

export const pillarCompletionService = {
  async getPillarCompletions(profileId) {
    try {
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "profileId" } },
          { field: { Name: "pillarId" } },
          { field: { Name: "completionPercentage" } },
          { field: { Name: "isComplete" } },
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

      const response = await apperClient.fetchRecords("pillarCompletion", params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      return response.data || [];
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error fetching pillar completions:", error?.response?.data?.message);
      } else {
        console.error("Error fetching pillar completions:", error.message);
      }
      throw error;
    }
  },

  async getPillarCompletion(profileId, pillarId) {
    try {
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "profileId" } },
          { field: { Name: "pillarId" } },
          { field: { Name: "completionPercentage" } },
          { field: { Name: "isComplete" } },
          { field: { Name: "lastUpdated" } }
        ],
        where: [
          {
            FieldName: "profileId",
            Operator: "EqualTo",
            Values: [parseInt(profileId)]
          },
          {
            FieldName: "pillarId",
            Operator: "EqualTo",
            Values: [parseInt(pillarId)]
          }
        ]
      };

      const response = await apperClient.fetchRecords("pillarCompletion", params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      return response.data && response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error fetching pillar completion:", error?.response?.data?.message);
      } else {
        console.error("Error fetching pillar completion:", error.message);
      }
      throw error;
    }
  },

  async updatePillarCompletion(profileId, pillarId, completionPercentage, isComplete = false) {
    try {
      // First check if pillar completion record exists
      const existingCompletion = await this.getPillarCompletion(profileId, pillarId);
      
      const updateableData = {
        Name: `Pillar Completion - Profile ${profileId} - Pillar ${pillarId}`,
        profileId: parseInt(profileId),
        pillarId: parseInt(pillarId),
        completionPercentage: Math.round(completionPercentage),
        isComplete: isComplete,
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

        const response = await apperClient.updateRecord("pillarCompletion", updateParams);
        
        if (!response.success) {
          console.error(response.message);
          throw new Error(response.message);
        }

        if (response.results) {
          const failedUpdates = response.results.filter(result => !result.success);
          
          if (failedUpdates.length > 0) {
            console.error(`Failed to update pillar completion ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
            
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

        const response = await apperClient.createRecord("pillarCompletion", createParams);
        
        if (!response.success) {
          console.error(response.message);
          throw new Error(response.message);
        }

        if (response.results) {
          const failedCreates = response.results.filter(result => !result.success);
          
          if (failedCreates.length > 0) {
            console.error(`Failed to create pillar completion ${failedCreates.length} records:${JSON.stringify(failedCreates)}`);
            
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
        console.error("Error updating pillar completion:", error?.response?.data?.message);
      } else {
        console.error("Error updating pillar completion:", error.message);
      }
      throw error;
    }
  },

  async updateMultiplePillarCompletions(profileId, pillarCompletions) {
    try {
      const promises = pillarCompletions.map(({ pillarId, completionPercentage, isComplete }) =>
        this.updatePillarCompletion(profileId, pillarId, completionPercentage, isComplete)
      );

      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(result => result.status === 'fulfilled').map(result => result.value);
      const failed = results.filter(result => result.status === 'rejected').map(result => result.reason);
      
      if (failed.length > 0) {
        console.error(`Failed to update ${failed.length} pillar completions:`, failed);
      }
      
      return {
        successful,
        failed,
        totalUpdated: successful.length
      };
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error updating multiple pillar completions:", error?.response?.data?.message);
      } else {
        console.error("Error updating multiple pillar completions:", error.message);
      }
      throw error;
    }
  }
};