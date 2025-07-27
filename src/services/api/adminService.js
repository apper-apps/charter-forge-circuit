import users from "@/services/mockData/users.json"
import profiles from "@/services/mockData/profiles.json"
import responses from "@/services/mockData/responses.json"

export const adminService = {
  async getAllParticipants() {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const participants = users
      .filter(user => user.role === "participant")
      .map(user => {
        const profile = profiles.find(p => p.userId === user.Id)
        const userResponses = responses.filter(r => r.userId === user.Id)
        
        // Group responses by pillar
        const groupedResponses = {}
        userResponses.forEach(response => {
          if (!groupedResponses[response.pillarId]) {
            groupedResponses[response.pillarId] = {}
          }
          groupedResponses[response.pillarId][response.questionId] = response.content
        })
        
        // Get last activity
        const lastActivity = userResponses.length > 0 
          ? Math.max(...userResponses.map(r => new Date(r.lastUpdated).getTime()))
          : null
        
        return {
          id: user.Id,
          email: user.email,
          role: user.role,
          profile,
          responses: groupedResponses,
          lastActivity: lastActivity ? new Date(lastActivity).toISOString() : null,
          createdAt: user.createdAt
        }
      })
    
    return participants
  },

  async getParticipantResponses(userId) {
    await new Promise(resolve => setTimeout(resolve, 250))
    
    const user = users.find(u => u.Id === parseInt(userId))
    if (!user || user.role !== "participant") {
      throw new Error("Participant not found")
    }
    
    const profile = profiles.find(p => p.userId === user.Id)
    const userResponses = responses.filter(r => r.userId === user.Id)
    
    // Group responses by pillar
    const groupedResponses = {}
    userResponses.forEach(response => {
      if (!groupedResponses[response.pillarId]) {
        groupedResponses[response.pillarId] = {}
      }
      groupedResponses[response.pillarId][response.questionId] = response.content
    })
    
    // Get last activity
    const lastActivity = userResponses.length > 0 
      ? Math.max(...userResponses.map(r => new Date(r.lastUpdated).getTime()))
      : null
    
    return {
      participant: {
        id: user.Id,
        email: user.email,
        role: user.role,
        profile,
        lastActivity: lastActivity ? new Date(lastActivity).toISOString() : null,
        createdAt: user.createdAt
      },
      responses: groupedResponses
    }
  }
}