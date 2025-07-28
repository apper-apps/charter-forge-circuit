export const responsesService = {
  async getUserResponses(userId) {
    try {
      const { ApperClient } = window.ApperSDK
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      })

      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "Tags" } },
          { field: { Name: "Owner" } },
          { field: { Name: "userId" } },
          { field: { Name: "pillarId" } },
          { field: { Name: "questionId" } },
          { field: { Name: "content" } },
          { field: { Name: "lastUpdated" } }
        ],
        where: [
          {
            FieldName: "userId",
            Operator: "EqualTo",
            Values: [parseInt(userId)]
          }
        ],
        pagingInfo: {
          limit: 1000,
          offset: 0
        }
      }

      const response = await apperClient.fetchRecords("response", params)
      
      if (!response.success) {
        console.error(response.message)
        throw new Error(response.message)
      }

      const userResponses = response.data || []
      
      // Group responses by pillar and question
      const groupedResponses = {}
      userResponses.forEach(response => {
        if (!groupedResponses[response.pillarId]) {
          groupedResponses[response.pillarId] = {}
        }
        groupedResponses[response.pillarId][response.questionId] = response.content
      })
      
      return groupedResponses
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error fetching user responses:", error?.response?.data?.message)
      } else {
        console.error(error.message)
      }
      throw error
    }
  },

  async saveResponse(userId, pillarId, questionId, content) {
    try {
      const { ApperClient } = window.ApperSDK
      const apperClient = new ApperClient({
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
      })

      // Check if response exists
      const params = {
        fields: [
          { field: { Name: "Id" } },
          { field: { Name: "Name" } }
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
        ],
        pagingInfo: {
          limit: 1,
          offset: 0
        }
      }

      const existingResponse = await apperClient.fetchRecords("response", params)
      
      // Prepare data with only updateable fields
      const updateableData = {
        Name: `Response ${pillarId}-${questionId}`,
        Tags: "",
        Owner: null,
        userId: parseInt(userId),
        pillarId: pillarId,
        questionId: questionId,
        content: content,
        lastUpdated: new Date().toISOString()
      }

      let response
      if (existingResponse.success && existingResponse.data && existingResponse.data.length > 0) {
        // Update existing response
        const updateParams = {
          records: [{
            Id: existingResponse.data[0].Id,
            ...updateableData
          }]
        }
        response = await apperClient.updateRecord("response", updateParams)
      } else {
        // Create new response
        const createParams = {
          records: [updateableData]
        }
        response = await apperClient.createRecord("response", createParams)
      }

      if (!response.success) {
        console.error(response.message)
        throw new Error(response.message)
      }

      if (response.results) {
        const successfulRecords = response.results.filter(result => result.success)
        const failedRecords = response.results.filter(result => !result.success)
        
        if (failedRecords.length > 0) {
          console.error(`Failed to save response ${failedRecords.length} records:${JSON.stringify(failedRecords)}`)
          throw new Error(failedRecords[0].message || "Failed to save response")
        }
        
        return successfulRecords.length > 0 ? successfulRecords[0].data : null
      }

      return null
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error saving response:", error?.response?.data?.message)
      } else {
        console.error(error.message)
      }
      throw error
    }
  }
}