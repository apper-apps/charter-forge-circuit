// Initialize ApperClient for database operations
const { ApperClient } = window.ApperSDK;
const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

export const authService = {
  async forgotPassword(email) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    let userId = null;
    
    // Check database profile table for users
    try {
      const params = {
        fields: [
          { field: { Name: "Name" } },
          { field: { Name: "email" } },
          { field: { Name: "userId" } }
        ],
        where: [
          {
            FieldName: "email",
            Operator: "EqualTo",
            Values: [email]
          }
        ]
      };

      const response = await apperClient.fetchRecords("profile", params);
      
      if (response.success && response.data && response.data.length > 0) {
        userId = response.data[0].userId || response.data[0].Id;
      } else {
        throw new Error("No account found with this email address");
      }
    } catch (error) {
      console.error("Error checking database users:", error);
      throw new Error("No account found with this email address");
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
        console.error("Failed to create password reset request:", response.message)
        throw new Error("Failed to create password reset request")
      }

      // TODO: Integrate with Apper's email service to send password reset email
      // The reset token and instructions should be sent to the user's email
      // Reset link format: ${window.location.origin}/reset-password?token=${resetToken}
      
      console.log(`Password reset request created for ${email}. Reset token: ${resetToken}`)
      console.log("Note: Email sending functionality needs to be integrated with Apper's email service")
      
      // For now, we've created the database record successfully
      // In production, this should only return success after email is sent
      return { 
        message: "Password reset instructions sent successfully",
        resetToken: resetToken // Remove this in production - only for testing
      }
    } catch (error) {
      console.error("Error creating password reset request:", error?.response?.data?.message || error.message)
      throw new Error("Failed to process password reset request. Please try again later.")
    }
  }
}