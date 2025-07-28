const { ApperClient } = window.ApperSDK;

const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

export const responsesService = {
  async getUserResponses(userId) {
    try {
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "userId" } },
          { field: { Name: "pillarId" } },
          { field: { Name: "questionId" } },
          { field: { Name: "content" } },
          { field: { Name: "lastUpdated" } },
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

      const response = await apperClient.fetchRecords("response", params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      const userResponses = response.data || [];
      
      // Group responses by pillar and question
      const groupedResponses = {};
      userResponses.forEach(response => {
        if (!groupedResponses[response.pillarId]) {
          groupedResponses[response.pillarId] = {};
        }
        groupedResponses[response.pillarId][response.questionId] = response.content;
      });
      
      return groupedResponses;
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error fetching user responses:", error?.response?.data?.message);
      } else {
        console.error("Error fetching user responses:", error.message);
      }
      throw error;
    }
  },

  async saveResponse(userId, pillarId, questionId, content) {
    try {
      // First check if response exists
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "userId" } },
          { field: { Name: "pillarId" } },
          { field: { Name: "questionId" } },
          { field: { Name: "content" } }
        ],
        where: [
          {
            FieldName: "userId",
            Operator: "EqualTo",
            Values: [parseInt(userId)]
          },
          {
            FieldName: "pillarId",
            Operator: "EqualTo",
            Values: [pillarId]
          },
          {
            FieldName: "questionId",
            Operator: "EqualTo",
            Values: [questionId]
          }
        ]
      };

      const existingResponse = await apperClient.fetchRecords("response", params);
      
      if (!existingResponse.success) {
        console.error(existingResponse.message);
        throw new Error(existingResponse.message);
      }

      // Prepare data with only Updateable fields
      const updateableData = {
        userId: parseInt(userId),
        pillarId: pillarId,
        questionId: questionId,
        content: content,
        lastUpdated: new Date().toISOString()
      };

      if (existingResponse.data && existingResponse.data.length > 0) {
        // Update existing response
        const updateParams = {
          records: [
            {
              Id: existingResponse.data[0].Id,
              ...updateableData
            }
          ]
        };

        const response = await apperClient.updateRecord("response", updateParams);
        
        if (!response.success) {
          console.error(response.message);
          throw new Error(response.message);
        }

        if (response.results) {
          const failedUpdates = response.results.filter(result => !result.success);
          
          if (failedUpdates.length > 0) {
            console.error(`Failed to update response ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
            
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
        // Create new response
        const createParams = {
          records: [updateableData]
        };

        const response = await apperClient.createRecord("response", createParams);
        
        if (!response.success) {
          console.error(response.message);
          throw new Error(response.message);
        }

        if (response.results) {
          const failedCreates = response.results.filter(result => !result.success);
          
          if (failedCreates.length > 0) {
            console.error(`Failed to create response ${failedCreates.length} records:${JSON.stringify(failedCreates)}`);
            
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
        console.error("Error saving response:", error?.response?.data?.message);
      } else {
        console.error("Error saving response:", error.message);
      }
      throw error;
    }
  }
}