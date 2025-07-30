const { ApperClient } = window.ApperSDK;

const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

export const adminService = {
  async getAllParticipants() {
    try {
      // Get all profiles
      const profileParams = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "fullName" } },
          { field: { Name: "phone" } },
          { field: { Name: "businessName" } },
          { field: { Name: "position" } },
          { field: { Name: "otherOwners" } },
          { field: { Name: "businessType" } },
          { field: { Name: "yearsInBusiness" } },
          { field: { Name: "annualRevenue" } },
          { field: { Name: "country" } },
          { field: { Name: "city" } },
          { field: { Name: "userId" } },
          { field: { Name: "CreatedOn" } },
          { field: { Name: "ModifiedOn" } }
        ]
      };

      const profilesResponse = await apperClient.fetchRecords("profile", profileParams);
      
if (!profilesResponse.success) {
        const errorMessage = profilesResponse.message || "Failed to fetch profiles data";
        console.error("Admin service profiles error:", errorMessage);
        throw new Error(errorMessage);
      }

      const profiles = profilesResponse.data || [];

      // Get all responses
      const responseParams = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "userId" } },
          { field: { Name: "pillarId" } },
          { field: { Name: "questionId" } },
          { field: { Name: "content" } },
          { field: { Name: "lastUpdated" } },
          { field: { Name: "CreatedOn" } },
          { field: { Name: "ModifiedOn" } }
        ]
      };

const responsesResponse = await apperClient.fetchRecords("response", responseParams);
      
      if (!responsesResponse.success) {
        const errorMessage = responsesResponse.message || "Failed to fetch responses data";
        console.error("Admin service responses error:", errorMessage);
        throw new Error(errorMessage);
      }

      const responses = responsesResponse.data || [];

      // Create participants map from profiles
      const participantsMap = new Map();
      
      profiles.forEach(profile => {
        if (profile.userId) {
          const userResponses = responses.filter(r => parseInt(r.userId) === parseInt(profile.userId));
          
          // Group responses by pillar
          const groupedResponses = {};
          userResponses.forEach(response => {
            if (!groupedResponses[response.pillarId]) {
              groupedResponses[response.pillarId] = {};
            }
            groupedResponses[response.pillarId][response.questionId] = response.content;
          });
          
          // Get last activity
          const lastActivity = userResponses.length > 0 
            ? Math.max(...userResponses.map(r => new Date(r.lastUpdated || r.CreatedOn).getTime()))
            : null;

          participantsMap.set(parseInt(profile.userId), {
            id: parseInt(profile.userId),
            email: `user${profile.userId}@example.com`, // Default email since we don't have user table
            role: "participant",
            profile,
            responses: groupedResponses,
            lastActivity: lastActivity ? new Date(lastActivity).toISOString() : null,
            createdAt: profile.CreatedOn
          });
        }
      });

      // Also include users who have responses but no profile
      responses.forEach(response => {
        const userId = parseInt(response.userId);
        if (!participantsMap.has(userId)) {
          const userResponses = responses.filter(r => parseInt(r.userId) === userId);
          
          // Group responses by pillar
          const groupedResponses = {};
          userResponses.forEach(resp => {
            if (!groupedResponses[resp.pillarId]) {
              groupedResponses[resp.pillarId] = {};
            }
            groupedResponses[resp.pillarId][resp.questionId] = resp.content;
          });
          
          // Get last activity
          const lastActivity = userResponses.length > 0 
            ? Math.max(...userResponses.map(r => new Date(r.lastUpdated || r.CreatedOn).getTime()))
            : null;

          participantsMap.set(userId, {
            id: userId,
            email: `user${userId}@example.com`, // Default email
            role: "participant",
            profile: null,
            responses: groupedResponses,
            lastActivity: lastActivity ? new Date(lastActivity).toISOString() : null,
            createdAt: response.CreatedOn
          });
        }
      });

      return Array.from(participantsMap.values());
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error fetching participants:", error?.response?.data?.message);
      } else {
        console.error("Error fetching participants:", error.message);
      }
      throw error;
    }
  },

  async getParticipantResponses(userId) {
    try {
      const userIdInt = parseInt(userId);

      // Get participant profile
      const profileParams = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "fullName" } },
          { field: { Name: "phone" } },
          { field: { Name: "businessName" } },
          { field: { Name: "position" } },
          { field: { Name: "otherOwners" } },
          { field: { Name: "businessType" } },
          { field: { Name: "yearsInBusiness" } },
          { field: { Name: "annualRevenue" } },
          { field: { Name: "country" } },
          { field: { Name: "city" } },
          { field: { Name: "userId" } },
          { field: { Name: "CreatedOn" } },
          { field: { Name: "ModifiedOn" } }
        ],
        where: [
          {
            FieldName: "userId",
            Operator: "EqualTo",
            Values: [userIdInt]
          }
        ]
      };

      const profileResponse = await apperClient.fetchRecords("profile", profileParams);
      
if (!profileResponse.success) {
        const errorMessage = profileResponse.message || "Failed to fetch participant profile";
        console.error("Admin service participant profile error:", errorMessage);
        throw new Error(errorMessage);
      }

      const profile = profileResponse.data && profileResponse.data.length > 0 ? profileResponse.data[0] : null;

      // Get participant responses
      const responseParams = {
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
            Values: [userIdInt]
          }
        ]
      };

const responsesResponse = await apperClient.fetchRecords("response", responseParams);
      
      if (!responsesResponse.success) {
        const errorMessage = responsesResponse.message || "Failed to fetch participant responses";
        console.error("Admin service participant responses error:", errorMessage);
        throw new Error(errorMessage);
      }

      const userResponses = responsesResponse.data || [];

      // Group responses by pillar
      const groupedResponses = {};
      userResponses.forEach(response => {
        if (!groupedResponses[response.pillarId]) {
          groupedResponses[response.pillarId] = {};
        }
        groupedResponses[response.pillarId][response.questionId] = response.content;
      });

      // Get last activity
      const lastActivity = userResponses.length > 0 
        ? Math.max(...userResponses.map(r => new Date(r.lastUpdated || r.CreatedOn).getTime()))
        : null;

      return {
        participant: {
          id: userIdInt,
          email: `user${userIdInt}@example.com`, // Default email
          role: "participant",
          profile,
          lastActivity: lastActivity ? new Date(lastActivity).toISOString() : null,
          createdAt: profile?.CreatedOn || (userResponses.length > 0 ? userResponses[0].CreatedOn : null)
        },
        responses: groupedResponses
      };
} catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error fetching participant responses:", error?.response?.data?.message);
      } else {
        console.error("Error fetching participant responses:", error.message);
      }
      throw error;
    }
  },

  async createParticipant(participantData) {
    try {
      const params = {
        records: [{
          // Use Name field for email as per requirement
          Name: participantData.email,
          fullName: participantData.name,
password: participantData.password
        }]
      };
const response = await apperClient.createRecord('profile', params);
      
      if (!response.success) {
        const errorMessage = response.message || "Failed to create participant";
        console.error("Admin service create participant error:", errorMessage);
        throw new Error(errorMessage);
      }

      if (response.results) {
        const failedRecords = response.results.filter(result => !result.success);
        
        if (failedRecords.length > 0) {
          console.error(`Failed to create participant records:${JSON.stringify(failedRecords)}`);
          
          // Return first error for user feedback
          const firstError = failedRecords[0];
          if (firstError.errors && firstError.errors.length > 0) {
            throw new Error(`${firstError.errors[0].fieldLabel}: ${firstError.errors[0].message}`);
          }
          if (firstError.message) {
            throw new Error(firstError.message);
          }
        }

        const successfulRecords = response.results.filter(result => result.success);
        return successfulRecords.map(result => result.data);
      }

      return [];
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error creating participant:", error?.response?.data?.message);
      } else {
        console.error("Error creating participant:", error.message);
      }
      throw error;
    }
  }
}