import React from "react";
import { individualResponseService } from "@/services/api/individualResponseService";
import Error from "@/components/ui/Error";

const { ApperClient } = window.ApperSDK

class ResponsesService {
  constructor() {
    this.apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    })
  }

  async getResponsesByUser(userId) {
    try {
      const params = {
        fields: [
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
            Values: [userId.toString()]
          }
        ]
      }

      const response = await this.apperClient.fetchRecords('response', params)
      
if (!response.success) {
        console.error("Error fetching user responses:", response.message)
        throw new Error(`Failed to fetch user responses: ${response.message}`)
      }

      // Process and organize responses by pillar and question
      const organizedResponses = {}
      if (response.data && response.data.length > 0) {
        response.data.forEach(responseItem => {
          const pillarId = responseItem.pillarId
          const questionId = responseItem.questionId
          
          if (!organizedResponses[pillarId]) {
            organizedResponses[pillarId] = {}
          }
          if (!organizedResponses[pillarId][questionId]) {
            organizedResponses[pillarId][questionId] = []
          }
          
          organizedResponses[pillarId][questionId].push(responseItem)
        })
      }

      return organizedResponses
    } catch (error) {
      console.error("Error in getUserResponses service:", error.message)
      throw error
    }
  }

  async getUserResponses(userId) {
    return await this.getResponsesByUser(userId);
  }

  async ensureMainResponse(userId, pillarId, questionId) {
    try {
      // Check if main response exists
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "userId" } },
          { field: { Name: "pillarId" } },
          { field: { Name: "questionId" } }
        ],
        where: [
          { FieldName: "userId", Operator: "EqualTo", Values: [userId.toString()] },
          { FieldName: "pillarId", Operator: "EqualTo", Values: [pillarId] },
          { FieldName: "questionId", Operator: "EqualTo", Values: [questionId] }
        ]
      }

      const response = await this.apperClient.fetchRecords('response', params)
      
if (!response.success) {
        throw new Error(`Failed to get responses by user: ${response.message}`)
      }

      if (response.data && response.data.length > 0) {
        return response.data[0]
      }

      // Create main response if it doesn't exist
      const createParams = {
        records: [{
          Name: `Response-${pillarId}-${questionId}`,
          userId: parseInt(userId),
          pillarId: pillarId,
          questionId: questionId,
          content: "",
          lastUpdated: new Date().toISOString(),
          responseNumber: 0
        }]
      }

      const createResponse = await this.apperClient.createRecord('response', createParams)
      
if (!createResponse.success) {
        throw new Error(`Failed to create main response: ${createResponse.message}`)
      }

      if (createResponse.results && createResponse.results.length > 0) {
        const successfulResult = createResponse.results.find(result => result.success)
        if (successfulResult) {
          return successfulResult.data
        }
      }

      throw new Error("Failed to create main response")
    } catch (error) {
console.error("Error in ensureMainResponse service:", error.message)
      throw error
    }
  }

  async savePillarResponses(userId, pillarId, allResponses) {
    try {
      const results = []
      
      // Process each response
      for (const responseData of allResponses) {
        const { questionId, responseIndex, name, content } = responseData
        
        try {
          // Ensure main response exists
          const mainResponse = await this.ensureMainResponse(userId, pillarId, questionId)
          
          // Save individual response
          await individualResponseService.saveIndividualResponse(
            mainResponse.Id, 
            name, 
            content, 
            responseIndex
          )
          
          results.push({ success: true, questionId, responseIndex })
        } catch (error) {
          console.error(`Error saving response ${questionId}-${responseIndex}:`, error.message)
          results.push({ success: false, questionId, responseIndex, error: error.message })
        }
      }
      
      // Check if any saves failed
      const failedSaves = results.filter(r => !r.success)
      if (failedSaves.length > 0) {
        console.error(`Failed to save ${failedSaves.length} responses:`, JSON.stringify(failedSaves))
        throw new Error(`${failedSaves.length} responses failed to save`)
      }
      
      return results
} catch (error) {
      console.error("Error in savePillarResponses service:", error.message)
      throw error
    }
  }
}

export const responsesService = new ResponsesService()