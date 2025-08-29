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
      
      // Group responses by pillar, question, and response number with proper pillar ID validation
      const groupedResponses = {};
// Load individual responses from individual_response table
      const individualResponsesMap = {};
      try {
        const individualParams = {
          fields: [
            { field: { Name: "responseId" } },
            { field: { Name: "individualName" } },
            { field: { Name: "responseContent" } },
            { field: { Name: "CreatedOn" } }
          ],
          where: [
            {
              FieldName: "responseId",
              Operator: "HasValue",
              Values: []
            }
          ]
        };
        
        const individualResponse = await apperClient.fetchRecords("individual_response", individualParams);
        if (individualResponse.success && individualResponse.data) {
          individualResponse.data.forEach(item => {
            const responseId = item.responseId?.Id || item.responseId;
            if (!individualResponsesMap[responseId]) {
              individualResponsesMap[responseId] = [];
            }
            individualResponsesMap[responseId].push({
              name: item.individualName || "",
              content: item.responseContent || ""
            });
          });
        }
      } catch (error) {
        console.warn("Could not load individual responses:", error.message);
      }

      // Load consolidated answers from answer table  
      const consolidatedAnswersMap = {};
      try {
        const answerParams = {
          fields: [
            { field: { Name: "profileId" } },
            { field: { Name: "pillarId" } },
            { field: { Name: "questionId" } },
            { field: { Name: "answerContent" } }
          ],
          where: [
            {
              FieldName: "profileId",
              Operator: "EqualTo", 
              Values: [parseInt(userId)]
            }
          ]
        };
        
        const answersResponse = await apperClient.fetchRecords("answer", answerParams);
        if (answersResponse.success && answersResponse.data) {
          answersResponse.data.forEach(answer => {
            const pillarId = answer.pillarId?.Name || answer.pillarId;
            const questionId = `q${answer.questionId?.Id || answer.questionId}`;
            const key = `${pillarId}-${questionId}`;
            consolidatedAnswersMap[key] = answer.answerContent || "";
          });
        }
      } catch (error) {
        console.warn("Could not load consolidated answers:", error.message);
      }

      userResponses.forEach(response => {
        // Ensure pillarId is properly formatted and matches expected pillar identifiers
        const pillarId = String(response.pillarId).trim();
        const questionId = String(response.questionId).trim();
        
        // CRITICAL: Validate pillar ID against known valid pillars to prevent cross-pillar contamination
        const validPillarIds = ["raison-detre", "type-of-business", "expectations", "extinction"];
        if (!validPillarIds.includes(pillarId)) {
          console.warn(`Invalid pillar ID found in response: ${pillarId}. Skipping to prevent cross-pillar contamination. Valid pillars: ${validPillarIds.join(', ')}`);
          return;
        }
        
        // Validate pillar ID format - ensure it matches the expected pillar identifiers
        if (!pillarId || !questionId) {
          console.warn(`Invalid pillar or question ID found: pillarId=${pillarId}, questionId=${questionId}`);
          return;
        }
        
        if (!groupedResponses[pillarId]) {
          groupedResponses[pillarId] = {};
        }
        if (!groupedResponses[pillarId][questionId]) {
          groupedResponses[pillarId][questionId] = [];
        }
        
        // Check for individual responses first
        const individualResponses = individualResponsesMap[response.Id] || [];
        if (individualResponses.length > 0) {
          groupedResponses[pillarId][questionId] = individualResponses;
        } else {
          // Check for consolidated answer
          const consolidatedKey = `${pillarId}-${questionId}`;
          const consolidatedAnswer = consolidatedAnswersMap[consolidatedKey];
          if (consolidatedAnswer) {
            // Parse consolidated answer into individual responses
            try {
              const sections = consolidatedAnswer.split('\n\n').filter(section => section.trim());
              const parsedResponses = sections.map(section => {
                const lines = section.split('\n');
                const nameMatch = lines[0].match(/\*\*(.*?):\*\*/);
                const name = nameMatch ? nameMatch[1] : "";
                const content = lines.slice(1).join('\n').trim();
                return { name, content };
              });
              groupedResponses[pillarId][questionId] = parsedResponses.length > 0 ? parsedResponses : [{ name: "", content: consolidatedAnswer }];
            } catch (error) {
              groupedResponses[pillarId][questionId] = [{ name: "", content: consolidatedAnswer }];
            }
          } else {
            // Fall back to original response format
            const responseNumber = response.responseNumber || 1;
            const arrayIndex = responseNumber - 1; // Convert to 0-based index
            
            // Ensure array has enough slots
            while (groupedResponses[pillarId][questionId].length <= arrayIndex) {
              groupedResponses[pillarId][questionId].push({ name: "", content: "" });
            }
            
            const responseContent = response.content || "";
            if (typeof responseContent === 'string') {
              groupedResponses[pillarId][questionId][arrayIndex] = { name: "", content: responseContent };
            } else {
              groupedResponses[pillarId][questionId][arrayIndex] = responseContent;
            }
          }
        }
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
      // Ensure consistent string formatting for pillar and question IDs
      const cleanPillarId = String(pillarId).trim();
      const cleanQuestionId = String(questionId).trim();
      
      // Validate pillar ID against known valid pillars to prevent misrouting
      const validPillarIds = ["raison-detre", "type-of-business", "expectations", "extinction"];
      if (!validPillarIds.includes(cleanPillarId)) {
        console.error(`Invalid pillar ID in getMainResponse: ${cleanPillarId}. Valid pillars: ${validPillarIds.join(', ')}`);
        throw new Error(`Invalid pillar ID: ${cleanPillarId}`);
      }
      
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
            Values: [cleanPillarId]
          },
          {
            FieldName: "questionId",
            Operator: "EqualTo",
            Values: [cleanQuestionId]
          }
        ]
      };

      const response = await apperClient.fetchRecords("response", params);
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      // Additional validation: ensure returned response matches requested pillar/question
      const result = response.data && response.data.length > 0 ? response.data[0] : null;
      if (result && (result.pillarId !== cleanPillarId || result.questionId !== cleanQuestionId)) {
        console.error(`Response mismatch! Requested: ${cleanPillarId}/${cleanQuestionId}, Got: ${result.pillarId}/${result.questionId}`);
        return null;
      }

      return result;
    } catch (error) {
      console.error("Error getting main response:", error.message);
      throw error;
    }
  },

async ensureMainResponse(userId, pillarId, questionId) {
    try {
      // Ensure consistent string formatting for pillar and question IDs
      const cleanPillarId = String(pillarId).trim();
      const cleanQuestionId = String(questionId).trim();
      
      // Validate pillar ID against known valid pillars to prevent misrouting
      const validPillarIds = ["raison-detre", "type-of-business", "expectations", "extinction"];
      if (!validPillarIds.includes(cleanPillarId)) {
        console.error(`Invalid pillar ID in ensureMainResponse: ${cleanPillarId}. Valid pillars: ${validPillarIds.join(', ')}`);
        throw new Error(`Invalid pillar ID: ${cleanPillarId}`);
      }
      
      // Check if main response exists
      let mainResponse = await this.getMainResponse(userId, cleanPillarId, cleanQuestionId);
      
      if (!mainResponse) {
        // Create main response if it doesn't exist with properly formatted IDs
        console.log(`Creating new response for pillar: ${cleanPillarId}, question: ${cleanQuestionId}`);
        
        const createParams = {
          records: [{
            Name: `Response - ${cleanPillarId} - ${cleanQuestionId} - User ${userId}`,
            userId: parseInt(userId),
            pillarId: cleanPillarId,
            questionId: cleanQuestionId,
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
          // Verify the created response has correct pillar/question association
          if (mainResponse.pillarId !== cleanPillarId || mainResponse.questionId !== cleanQuestionId) {
            console.error(`Created response has incorrect association! Expected: ${cleanPillarId}/${cleanQuestionId}, Got: ${mainResponse.pillarId}/${mainResponse.questionId}`);
            throw new Error("Response creation resulted in incorrect pillar/question association");
          }
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
      // Ensure consistent string formatting for pillar and question IDs to prevent misalignment
      const cleanPillarId = String(pillarId).trim();
      const cleanQuestionId = String(questionId).trim();
      
      // CRITICAL: Validate pillar ID against known valid pillars to prevent misrouting
      const validPillarIds = ["raison-detre", "type-of-business", "expectations", "extinction"];
      if (!validPillarIds.includes(cleanPillarId)) {
        console.error(`CRITICAL: Invalid pillar ID in saveResponse: ${cleanPillarId}. This could cause response misrouting!`);
        throw new Error(`Invalid pillar ID: ${cleanPillarId}. Valid pillars: ${validPillarIds.join(', ')}`);
      }
      
      console.log(`Saving response - Pillar: ${cleanPillarId}, Question: ${cleanQuestionId}, Response: ${responseNumber}`);
      
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
            Values: [cleanPillarId]
          },
          {
            FieldName: "questionId",
            Operator: "EqualTo",
            Values: [cleanQuestionId]
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

      // Prepare data with only Updateable fields and ensure proper pillar/question association
      const updateableData = {
        Name: `Response - ${cleanPillarId} - ${cleanQuestionId} - ${responseNumber} - User ${userId}`,
        userId: parseInt(userId),
        pillarId: cleanPillarId,
        questionId: cleanQuestionId,
        responseNumber: responseNumber,
        content: content,
        lastUpdated: new Date().toISOString()
      };

      if (existingResponse.data && existingResponse.data.length > 0) {
        // Verify existing response has correct pillar/question before updating
        const existing = existingResponse.data[0];
        if (existing.pillarId !== cleanPillarId || existing.questionId !== cleanQuestionId) {
          console.error(`CRITICAL: Existing response has wrong pillar/question! Expected: ${cleanPillarId}/${cleanQuestionId}, Found: ${existing.pillarId}/${existing.questionId}`);
          throw new Error("Response pillar/question mismatch detected - preventing data corruption");
        }
        
        // Update existing response
        const updateParams = {
          records: [
            {
              Id: existing.Id,
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
          const result = successfulUpdates.length > 0 ? successfulUpdates[0].data : null;
          
          // Final verification of saved response
          if (result && (result.pillarId !== cleanPillarId || result.questionId !== cleanQuestionId)) {
            console.error(`CRITICAL: Saved response has incorrect association! Expected: ${cleanPillarId}/${cleanQuestionId}, Saved: ${result.pillarId}/${result.questionId}`);
            throw new Error("Response save resulted in incorrect pillar/question association");
          }
          
          return result;
        }
      } else {
        // Create new response with properly formatted identifiers
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
          const result = successfulCreates.length > 0 ? successfulCreates[0].data : null;
          
          // Final verification of created response
          if (result && (result.pillarId !== cleanPillarId || result.questionId !== cleanQuestionId)) {
            console.error(`CRITICAL: Created response has incorrect association! Expected: ${cleanPillarId}/${cleanQuestionId}, Created: ${result.pillarId}/${result.questionId}`);
            throw new Error("Response creation resulted in incorrect pillar/question association");
          }
          
          return result;
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