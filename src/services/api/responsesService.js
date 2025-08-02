import React from "react";
import Error from "@/components/ui/Error";
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
          { field: { Name: "responseNumber" } },
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
      
      // Group responses by pillar, question, and response number
      const groupedResponses = {};
      userResponses.forEach(response => {
        if (!groupedResponses[response.pillarId]) {
          groupedResponses[response.pillarId] = {};
        }
        if (!groupedResponses[response.pillarId][response.questionId]) {
          groupedResponses[response.pillarId][response.questionId] = [];
        }
        
        // Handle responseNumber (default to 1 for backward compatibility)
        const responseNumber = response.responseNumber || 1;
        const arrayIndex = responseNumber - 1; // Convert to 0-based index
        
        // Ensure array has enough slots
        while (groupedResponses[response.pillarId][response.questionId].length <= arrayIndex) {
          groupedResponses[response.pillarId][response.questionId].push("");
        }
        
        groupedResponses[response.pillarId][response.questionId][arrayIndex] = response.content || "";
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

async getMainResponse(userId, pillarId, questionId) {
    try {
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "userId" } },
          { field: { Name: "pillarId" } },
          { field: { Name: "questionId" } }
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

      const response = await apperClient.fetchRecords("response", params);
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      return response.data && response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      console.error("Error getting main response:", error.message);
      throw error;
    }
  },

  async ensureMainResponse(userId, pillarId, questionId) {
    try {
      // Check if main response exists
      let mainResponse = await this.getMainResponse(userId, pillarId, questionId);
      
      if (!mainResponse) {
        // Create main response if it doesn't exist
        const createParams = {
          records: [{
            Name: `Response - ${pillarId} - ${questionId} - User ${userId}`,
            userId: parseInt(userId),
            pillarId: pillarId,
            questionId: questionId,
            responseNumber: 1,
            content: "",
            lastUpdated: new Date().toISOString()
          }]
        };

        const response = await apperClient.createRecord("response", createParams);
        
        if (!response.success) {
          console.error(response.message);
          throw new Error(response.message);
        }

        if (response.results && response.results.length > 0 && response.results[0].success) {
          mainResponse = response.results[0].data;
        } else {
          throw new Error("Failed to create main response");
        }
      }
      
      return mainResponse;
    } catch (error) {
      console.error("Error ensuring main response:", error.message);
      throw error;
    }
  },

async saveResponse(userId, pillarId, questionId, content, responseNumber = 1) {
    try {
      // First check if response exists for this specific response number
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "userId" } },
          { field: { Name: "pillarId" } },
          { field: { Name: "questionId" } },
          { field: { Name: "responseNumber" } },
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
          },
          {
            FieldName: "responseNumber",
            Operator: "EqualTo",
            Values: [responseNumber]
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
        Name: `Response - ${pillarId} - ${questionId} - ${responseNumber} - User ${userId}`,
        userId: parseInt(userId),
        pillarId: pillarId,
        questionId: questionId,
        responseNumber: responseNumber,
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