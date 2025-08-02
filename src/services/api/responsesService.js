// Response Service - Handles user responses to pillar questions
import { individualResponseService } from "@/services/api/individualResponseService";
import Error from "@/components/ui/Error";
// Response Service - Handles user responses to pillar questions
class ResponsesService {
  constructor() {
    const { ApperClient } = window.ApperSDK;
    this.apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
  }

  async getUserResponses(userId) {
    try {
      const params = {
        fields: [
          { field: { Name: "Id" } },
          { field: { Name: "Name" } },
          { field: { Name: "userId" } },
          { field: { Name: "pillarId" } },
          { field: { Name: "questionId" } },
          { field: { Name: "content" } },
          { field: { Name: "lastUpdated" } },
          { field: { Name: "responseNumber" } }
        ],
        where: [
          {
            FieldName: "userId",
            Operator: "EqualTo",
            Values: [parseInt(userId)]
          }
        ],
        orderBy: [
          {
            fieldName: "lastUpdated",
            sorttype: "DESC"
          }
        ]
      };

      const response = await this.apperClient.fetchRecords("response", params);
      
      if (!response.success) {
        console.error("Error fetching user responses:", response.message);
        throw new Error(response.message);
      }

      return response.data || [];
    } catch (error) {
      console.error("Error in getUserResponses service:", error.message);
      throw new Error(`Failed to fetch user responses: ${error.message}`);
    }
  }

  async getResponsesByUser(userId) {
    try {
      return await this.getUserResponses(userId);
    } catch (error) {
      console.error("Error in getResponsesByUser service:", error.message);
      throw error;
    }
  }

  async ensureMainResponse(userId, pillarId, questionId) {
    try {
      // First, check if response already exists
      const params = {
        fields: [
          { field: { Name: "Id" } },
          { field: { Name: "content" } },
          { field: { Name: "responseNumber" } }
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
            Values: [pillarId.toString()]
          },
          {
            FieldName: "questionId",
            Operator: "EqualTo",
            Values: [questionId.toString()]
          }
        ]
      };

      const existingResponse = await this.apperClient.fetchRecords("response", params);
      
      if (!existingResponse.success) {
        throw new Error(existingResponse.message);
      }

      if (existingResponse.data && existingResponse.data.length > 0) {
        return existingResponse.data[0];
      }

      // Create new response if none exists
      const createParams = {
        records: [
          {
            Name: `Response - User ${userId} - Pillar ${pillarId} - Question ${questionId}`,
            userId: parseInt(userId),
            pillarId: pillarId.toString(),
            questionId: questionId.toString(),
            content: "",
            lastUpdated: new Date().toISOString(),
            responseNumber: 1
          }
        ]
      };

      const createResponse = await this.apperClient.createRecord("response", createParams);
      
      if (!createResponse.success) {
        throw new Error(createResponse.message);
      }

      if (createResponse.results && createResponse.results.length > 0) {
        const successfulResult = createResponse.results.find(result => result.success);
        if (successfulResult) {
          return successfulResult.data;
        }
      }

      throw new Error("Failed to create response record");
    } catch (error) {
      console.error("Error in ensureMainResponse service:", error.message);
      throw error;
    }
  }

  async savePillarResponses(userId, pillarId, allResponses) {
    try {
      const updatePromises = Object.entries(allResponses).map(async ([questionId, responseContent]) => {
        const response = await this.ensureMainResponse(userId, pillarId, questionId);
        
        const updateParams = {
          records: [
            {
              Id: response.Id,
              content: responseContent,
              lastUpdated: new Date().toISOString()
            }
          ]
        };

        return await this.apperClient.updateRecord("response", updateParams);
      });

      const results = await Promise.all(updatePromises);
      
      const failedUpdates = results.filter(result => !result.success);
      if (failedUpdates.length > 0) {
        console.error(`Failed to save ${failedUpdates.length} responses:${JSON.stringify(failedUpdates)}`);
        throw new Error(`Failed to save ${failedUpdates.length} responses`);
      }

      return { success: true, saved: results.length };
    } catch (error) {
      console.error("Error in savePillarResponses service:", error.message);
      throw error;
    }
  }
}

export const responsesService = new ResponsesService();
