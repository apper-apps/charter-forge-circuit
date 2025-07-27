import responses from "@/services/mockData/responses.json"

let responsesData = [...responses]

export const responsesService = {
  async getUserResponses(userId) {
    await new Promise(resolve => setTimeout(resolve, 250))
    
    const userResponses = responsesData.filter(r => r.userId === userId)
    
    // Group responses by pillar and question
    const groupedResponses = {}
    userResponses.forEach(response => {
      if (!groupedResponses[response.pillarId]) {
        groupedResponses[response.pillarId] = {}
      }
      groupedResponses[response.pillarId][response.questionId] = response.content
    })
    
    return groupedResponses
  },

  async saveResponse(userId, pillarId, questionId, content) {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const existingIndex = responsesData.findIndex(
      r => r.userId === userId && r.pillarId === pillarId && r.questionId === questionId
    )
    
    if (existingIndex >= 0) {
      // Update existing response
      responsesData[existingIndex] = {
        ...responsesData[existingIndex],
        content,
        lastUpdated: new Date().toISOString()
      }
      return responsesData[existingIndex]
    } else {
      // Create new response
      const newResponse = {
        Id: Math.max(...responsesData.map(r => r.Id), 0) + 1,
        userId,
        pillarId,
        questionId,
        content,
        lastUpdated: new Date().toISOString()
      }
      responsesData.push(newResponse)
      return newResponse
    }
  }
}