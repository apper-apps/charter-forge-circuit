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
      // Check database profile table for users with username/password
      try {
        const params = {
          fields: [
            { field: { Name: "Name" } },
            { field: { Name: "fullName" } },
            { field: { Name: "username" } },
            { field: { Name: "password" } },
            { field: { Name: "userId" } },
            { field: { Name: "phone" } },
            { field: { Name: "businessName" } },
            { field: { Name: "position" } }
          ],
          where: [
            {
              FieldName: "username",
              Operator: "EqualTo", 
              Values: [email]
            }
          ]
        };

        const response = await apperClient.fetchRecords("profile", params);
        
        if (response.success && response.data && response.data.length > 0) {
          const profileUser = response.data[0];
          
          // Check password match
          if (profileUser.password === password) {
            user = {
              Id: profileUser.userId || profileUser.Id,
              email: profileUser.username,
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
        console.error("Error checking database users:", error);
      }
    }
    
    if (!user) {
      throw new Error("Invalid email or password")
    }
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  },

async forgotPassword(email) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Check if user exists in mock data
    let user = users.find(u => u.email === email)
    let userId = null;
    
    if (!user) {
      // Check database profile table for users
      try {
        const params = {
          fields: [
            { field: { Name: "Name" } },
            { field: { Name: "username" } },
            { field: { Name: "userId" } }
          ],
          where: [
            {
              FieldName: "username",
              Operator: "EqualTo",
              Values: [email]
            }
          ]
        };

        const response = await apperClient.fetchRecords("profile", params);
        
        if (response.success && response.data && response.data.length > 0) {
          user = { email: response.data[0].username };
          userId = response.data[0].userId || response.data[0].Id;
        }
      } catch (error) {
        console.error("Error checking database users:", error);
      }
    }
    
    if (!user) {
      throw new Error("No account found with this email address")
    }

    // Create password reset request record
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const expirationTime = new Date()
    expirationTime.setHours(expirationTime.getHours() + 1) // 1 hour expiration

    const resetRecord = {
      Name: `Password Reset for ${email}`,
      reset_token: resetToken,
      expiration_time: expirationTime.toISOString(),
      request_time: new Date().toISOString()
    };

    // Add user_id if available
    if (userId) {
      resetRecord.user_id = parseInt(userId);
    }

    const params = {
      records: [resetRecord]
    }

    try {
      const response = await apperClient.createRecord('password_reset_requests', params)
      
      if (!response.success) {
        throw new Error("Failed to create password reset request")
      }

      return { message: "Password reset instructions sent successfully" }
    } catch (error) {
      console.error("Error creating password reset request:", error)
      throw new Error("Failed to process password reset request")
    }
  }
}