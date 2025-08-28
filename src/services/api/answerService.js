import React from "react";
import Error from "@/components/ui/Error";
const { ApperClient } = window.ApperSDK;

const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

export const answerService = {
  async getAnswersByPillar(profileId, pillarId) {
    try {
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "questionId" } },
          { field: { Name: "profileId" } },
          { field: { Name: "pillarId" } },
          { field: { Name: "answerContent" } },
          { field: { Name: "CreatedOn" } },
          { field: { Name: "ModifiedOn" } }
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

      const response = await apperClient.fetchRecords("answer", params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      return response.data || [];
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error fetching answers:", error?.response?.data?.message);
      } else {
        console.error("Error fetching answers:", error.message);
      }
      throw error;
    }
  },

  async saveAnswer(profileId, pillarId, questionId, answerContent) {
    try {
      // First check if answer already exists
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "questionId" } },
          { field: { Name: "profileId" } },
          { field: { Name: "pillarId" } },
          { field: { Name: "answerContent" } }
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
          },
          {
            FieldName: "questionId",
            Operator: "EqualTo",
            Values: [parseInt(questionId)]
          }
        ]
      };

      const existingAnswer = await apperClient.fetchRecords("answer", params);
      
      if (!existingAnswer.success) {
        console.error(existingAnswer.message);
        throw new Error(existingAnswer.message);
      }

// Prepare data with only Updateable fields
      const updateableData = {
        Name: `Answer - Pillar ${pillarId} - Question ${questionId} - Profile ${profileId}`,
        questionId: parseInt(questionId),
        profileId: parseInt(profileId), 
        pillarId: parseInt(pillarId),
        answerContent: answerContent
      };

      if (existingAnswer.data && existingAnswer.data.length > 0) {
        // Update existing answer
        const existing = existingAnswer.data[0];
const updateParams = {
          records: [
            {
              Id: existing.Id,
              ...updateableData
            }
          ]
        };

        const response = await apperClient.updateRecord("answer", updateParams);
        
        if (!response.success) {
          console.error(response.message);
          throw new Error(response.message);
        }

        if (response.results) {
          const failedUpdates = response.results.filter(result => !result.success);
          
          if (failedUpdates.length > 0) {
            console.error(`Failed to update answer ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
            
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
        // Create new answer
        const createParams = {
          records: [updateableData]
        };

        const response = await apperClient.createRecord("answer", createParams);
        
        if (!response.success) {
          console.error(response.message);
          throw new Error(response.message);
        }

        if (response.results) {
          const failedCreates = response.results.filter(result => !result.success);
          
          if (failedCreates.length > 0) {
            console.error(`Failed to create answer ${failedCreates.length} records:${JSON.stringify(failedCreates)}`);
            
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
        console.error("Error saving answer:", error?.response?.data?.message);
      } else {
        console.error("Error saving answer:", error.message);
      }
      throw error;
    }
  }
};