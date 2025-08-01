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
          { field: { Name: "ModifiedOn" } },
          { field: { Name: "Tags" } }
        ]
      };

      const profilesResponse = await apperClient.fetchRecords("profile", profileParams);
      
      if (!profilesResponse.success) {
        console.error(profilesResponse.message);
        throw new Error(profilesResponse.message);
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
        console.error(responsesResponse.message);
        throw new Error(responsesResponse.message);
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
            permissions: profile?.Tags || "participant",
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
          { field: { Name: "ModifiedOn" } },
          { field: { Name: "Tags" } }
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
        console.error(profileResponse.message);
        throw new Error(profileResponse.message);
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
        console.error(responsesResponse.message);
        throw new Error(responsesResponse.message);
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
          permissions: profile?.Tags || "participant",
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

  async updateParticipantPermissions(userId, permissions) {
    try {
      const userIdInt = parseInt(userId);
      
      // First get the profile record
      const profileParams = {
        fields: [{ field: { Name: "Name" } }],
        where: [
          {
            FieldName: "userId",
            Operator: "EqualTo", 
            Values: [userIdInt]
          }
        ]
      };

      const profileResponse = await apperClient.fetchRecords("profile", profileParams);
      
      if (!profileResponse.success || !profileResponse.data || profileResponse.data.length === 0) {
        throw new Error("Profile not found");
      }

      const profileId = profileResponse.data[0].Id;

      // Update the profile with new permissions in Tags field
      const updateParams = {
        records: [
          {
            Id: profileId,
            Tags: permissions
          }
        ]
      };

      const updateResponse = await apperClient.updateRecord("profile", updateParams);
      
      if (!updateResponse.success) {
        console.error(updateResponse.message);
        throw new Error(updateResponse.message);
      }

      if (updateResponse.results) {
        const failedUpdates = updateResponse.results.filter(result => !result.success);
        
        if (failedUpdates.length > 0) {
          console.error(`Failed to update permissions ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
          throw new Error("Failed to update permissions");
        }
      }

      return { success: true };
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error updating participant permissions:", error?.response?.data?.message);
      } else {
        console.error("Error updating participant permissions:", error.message);
      }
      throw error;
    }
  }
}