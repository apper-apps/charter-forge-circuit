const { ApperClient } = window.ApperSDK;

const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

export const individualResponseService = {
  async getIndividualResponsesForResponse(responseId) {
    try {
      const params = {
        fields: [
{ field: { Name: "Name" } },
          { field: { Name: "responseId" } },
          { field: { Name: "individualName" } },
          { field: { Name: "responseContent" } },
          { field: { Name: "CreatedOn" } },
          { field: { Name: "ModifiedOn" } }
        ],
        where: [
          {
            FieldName: "responseId",
            Operator: "EqualTo",
            Values: [parseInt(responseId)]
          }
        ],
        orderBy: [
          {
            fieldName: "CreatedOn",
            sorttype: "ASC"
          }
        ]
      };

      const response = await apperClient.fetchRecords("individual_response", params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      const individualResponses = response.data || [];
      
      // Convert to array format with up to 5 slots
// Return dynamic array based on actual database records instead of fixed size
      const responseArray = individualResponses.map((item, index) => ({
        name: item.individualName || "",
        content: item.responseContent || "",
        id: item.Id,
        createdOn: item.CreatedOn,
        modifiedOn: item.ModifiedOn,
        relationship: item.relationship_c || ""
      }));
      
      // If no responses exist, return empty array (let UI determine initial size)
      return responseArray.length > 0 ? responseArray : [];
    } catch (error) {
      console.error("Error fetching individual responses:", error.message);
      throw error;
    }
  },

async saveIndividualResponse(responseId, name, content, responseIndex) {
    try {
      // Ensure proper response ID handling to maintain correct pillar associations
      const cleanResponseId = parseInt(responseId);
      
      // Check if individual response exists for this response and index
      const params = {
        fields: [
{ field: { Name: "Name" } },
          { field: { Name: "responseId" } },
          { field: { Name: "individualName" } },
          { field: { Name: "responseContent" } },
          { field: { Name: "CreatedOn" } },
          { field: { Name: "ModifiedOn" } }
        ],
        where: [
          {
            FieldName: "responseId",
            Operator: "EqualTo",
            Values: [cleanResponseId]
          }
        ],
        orderBy: [
          {
            fieldName: "CreatedOn",
            sorttype: "ASC"
          }
        ]
      };

      const existingResponses = await apperClient.fetchRecords("individual_response", params);
      if (!existingResponses.success) {
        console.error(existingResponses.message);
        throw new Error(existingResponses.message);
      }

      // Ensure proper data association with parent response to maintain pillar integrity
// Enhanced data structure to support family member relationships
const updateableData = {
        Name: `Individual Response - ${cleanResponseId} - ${responseIndex} - ${name || 'Anonymous'}`,
        responseId: cleanResponseId, // Use correct field name from individual_response table
        individualName: name || '',
        responseContent: content || '',
        relationship_c: name || '' // Store relationship information
      };

      const existingData = existingResponses.data || [];
      const existingResponse = existingData[responseIndex];

      if (existingResponse) {
        // Update existing individual response with proper association
        const updateParams = {
          records: [
            {
              Id: existingResponse.Id,
              ...updateableData
            }
          ]
        };

        const response = await apperClient.updateRecord("individual_response", updateParams);
        
        if (!response.success) {
          console.error(response.message);
          throw new Error(response.message);
        }

        if (response.results) {
          const failedUpdates = response.results.filter(result => !result.success);
          
          if (failedUpdates.length > 0) {
            console.error(`Failed to update individual response ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
            
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
        // Create new individual response with proper parent association
        const createParams = {
          records: [updateableData]
        };

        const response = await apperClient.createRecord("individual_response", createParams);
        
        if (!response.success) {
          console.error(response.message);
          throw new Error(response.message);
        }

        if (response.results) {
          const failedCreates = response.results.filter(result => !result.success);
          
          if (failedCreates.length > 0) {
            console.error(`Failed to create individual response ${failedCreates.length} records:${JSON.stringify(failedCreates)}`);
            
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
      console.error("Error saving individual response:", error.message);
      throw error;
    }
  },

  async deleteIndividualResponse(responseId, responseIndex) {
    try {
      // Get all individual responses for this response
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "responseId" } }
        ],
        where: [
          {
            FieldName: "responseId",
            Operator: "EqualTo",
            Values: [parseInt(responseId)]
          }
        ],
        orderBy: [
          {
            fieldName: "CreatedOn",
            sorttype: "ASC"
          }
        ]
      };

      const existingResponses = await apperClient.fetchRecords("individual_response", params);
      if (!existingResponses.success) {
        console.error(existingResponses.message);
        throw new Error(existingResponses.message);
      }

      const existingData = existingResponses.data || [];
      const responseToDelete = existingData[responseIndex];

      if (responseToDelete) {
        const deleteParams = {
          RecordIds: [responseToDelete.Id]
        };

        const response = await apperClient.deleteRecord("individual_response", deleteParams);
        
        if (!response.success) {
          console.error(response.message);
          throw new Error(response.message);
        }

        if (response.results) {
          const failedDeletions = response.results.filter(result => !result.success);
          
          if (failedDeletions.length > 0) {
            console.error(`Failed to delete individual response ${failedDeletions.length} records:${JSON.stringify(failedDeletions)}`);
            
            failedDeletions.forEach(record => {
              if (record.message) throw new Error(record.message);
            });
          }
          
          return failedDeletions.length === 0;
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error deleting individual response:", error.message);
      throw error;
    }
  }
};