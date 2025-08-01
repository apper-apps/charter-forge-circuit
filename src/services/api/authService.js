import users from "@/services/mockData/users.json"

// Initialize ApperClient for database operations
const { ApperClient } = window.ApperSDK;
const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

export const authService = {
  async login(email, password) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // First check mock users
    let user = users.find(u => u.email === email && u.password === password)
    
    if (!user) {
      // Check database profile table for users with username/password or email/password
      try {
        const params = {
          fields: [
            { field: { Name: "Name" } },
            { field: { Name: "fullName" } },
            { field: { Name: "username" } },
            { field: { Name: "email" } },
            { field: { Name: "password" } },
            { field: { Name: "userId" } },
            { field: { Name: "phone" } },
            { field: { Name: "businessName" } },
            { field: { Name: "position" } }
          ],
          whereGroups: [
            {
              operator: "OR",
              subGroups: [
                {
                  conditions: [
                    {
                      fieldName: "username",
                      operator: "EqualTo",
                      values: [email]
                    }
                  ],
                  operator: "OR"
                },
                {
                  conditions: [
                    {
                      fieldName: "email",
                      operator: "EqualTo",
                      values: [email]
                    }
                  ],
                  operator: "OR"
                }
              ]
            }
          ]
        };

        const response = await apperClient.fetchRecords("profile", params);
        
        if (response.success && response.data && response.data.length > 0) {
          const profileUser = response.data[0];
          
          // Check password match
          if (profileUser.password === password) {
            user = {
              id: profileUser.userId || profileUser.Id,
              Id: profileUser.userId || profileUser.Id,
              email: profileUser.email || profileUser.username,
              role: "participant", // Default role for database users
              fullName: profileUser.fullName,
              phone: profileUser.phone,
              businessName: profileUser.businessName,
              position: profileUser.position,
              createdAt: profileUser.CreatedOn || new Date().toISOString()
            };
          }
        }
      } catch (error) {
        console.error("Error checking database users:", error?.response?.data?.message || error.message);
      }
    }
    
    if (!user) {
      throw new Error("Invalid email/username or password")
    }
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  },

async forgotPassword(email) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Check if user exists in mock data or database
    let user = users.find(u => u.email === email)
    let userId = null;
    let userEmail = email;
    
    if (!user) {
      // Check database profile table for users by username or email
      try {
        const params = {
          fields: [
            { field: { Name: "Name" } },
            { field: { Name: "username" } },
            { field: { Name: "email" } },
            { field: { Name: "userId" } }
          ],
          whereGroups: [
            {
              operator: "OR",
              subGroups: [
                {
                  conditions: [
                    {
                      fieldName: "username",
                      operator: "EqualTo",
                      values: [email]
                    }
                  ],
                  operator: "OR"
                },
                {
                  conditions: [
                    {
                      fieldName: "email",
                      operator: "EqualTo",
                      values: [email]
                    }
                  ],
                  operator: "OR"
                }
              ]
            }
          ]
        };

        const response = await apperClient.fetchRecords("profile", params);
        
        if (response.success && response.data && response.data.length > 0) {
          const profileData = response.data[0];
          user = { email: profileData.email || profileData.username };
          userId = profileData.userId || profileData.Id;
          userEmail = profileData.email || profileData.username;
        }
      } catch (error) {
        console.error("Error checking database users:", error?.response?.data?.message || error.message);
      }
    } else {
      // For mock users, use their Id as userId
      userId = user.Id;
    }
    
    if (!user) {
      throw new Error("No account found with this email address or username")
    }

    // Generate secure reset token
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
    const expirationTime = new Date()
    expirationTime.setHours(expirationTime.getHours() + 1) // 1 hour expiration

    // Create password reset request record using only Updateable fields
    const resetRecord = {
      Name: `Password Reset Request - ${userEmail}`,
      reset_token: resetToken,
      expiration_time: expirationTime.toISOString(),
      request_time: new Date().toISOString()
    };

    // Add user_id if available (Lookup field)
    if (userId) {
      resetRecord.user_id = parseInt(userId);
    }

    const createParams = {
      records: [resetRecord]
    };

    try {
      const response = await apperClient.createRecord('password_reset_requests', createParams);
      
      if (!response.success) {
        console.error("Failed to create password reset request:", response.message);
        throw new Error("Failed to create password reset request");
      }

      if (response.results) {
        const failedCreates = response.results.filter(result => !result.success);
        
        if (failedCreates.length > 0) {
          console.error(`Failed to create password reset request ${failedCreates.length} records:${JSON.stringify(failedCreates)}`);
          
          failedCreates.forEach(record => {
            record.errors?.forEach(error => {
              throw new Error(`${error.fieldLabel}: ${error.message}`);
            });
            if (record.message) throw new Error(record.message);
          });
        }
      }

      // TODO: Integrate with Apper's email service to send password reset email
      // The reset token should be sent to the user's email with reset link
      // Reset link format: ${window.location.origin}/reset-password/${resetToken}
      
      console.log(`Password reset request created successfully for ${userEmail}`);
      console.log(`Reset token: ${resetToken}`);
      console.log("Note: Email integration with Apper's email service is pending");
      
      return { 
        message: "Password reset request created successfully",
        resetToken: resetToken // TODO: Remove in production - only for development testing
      };
    } catch (error) {
      console.error("Error creating password reset request:", error?.response?.data?.message || error.message);
      throw new Error("Failed to process password reset request. Please try again later.");
    }
  }
}