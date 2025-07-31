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
  },

  async validateResetToken(token) {
    if (!token) {
      throw new Error("Reset token is required");
    }

    try {
      const params = {
        fields: [
          { field: { Name: "reset_token" } },
          { field: { Name: "expiration_time" } },
          { field: { Name: "user_id" } },
          { field: { Name: "Id" } }
        ],
        where: [
          {
            FieldName: "reset_token",
            Operator: "EqualTo",
            Values: [token]
          }
        ]
      };

      const response = await apperClient.fetchRecords("password_reset_requests", params);
      
      if (!response.success || !response.data || response.data.length === 0) {
        throw new Error("Invalid or expired reset token");
      }

      const resetRequest = response.data[0];
      const expirationTime = new Date(resetRequest.expiration_time);
      const currentTime = new Date();

      if (currentTime > expirationTime) {
        throw new Error("Reset token has expired");
      }

      return {
        valid: true,
        userId: resetRequest.user_id?.Id || resetRequest.user_id,
        resetRequestId: resetRequest.Id
      };
    } catch (error) {
      console.error("Error validating reset token:", error?.response?.data?.message || error.message);
      throw new Error(error.message || "Failed to validate reset token");
    }
  },

async resetPassword(token, newPassword) {
    if (!token || !newPassword) {
      throw new Error("Reset token and new password are required");
    }

    if (newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    try {
      // First validate the token
      const tokenValidation = await this.validateResetToken(token);
      
      if (!tokenValidation.valid) {
        throw new Error("Invalid or expired reset token");
      }

      // Find the user profile by user_id - handle both direct ID and lookup object
      let actualUserId = tokenValidation.userId;
      if (typeof tokenValidation.userId === 'object' && tokenValidation.userId?.Id) {
        actualUserId = tokenValidation.userId.Id;
      }

      const userParams = {
        fields: [
          { field: { Name: "Id" } },
          { field: { Name: "email" } },
          { field: { Name: "Name" } },
          { field: { Name: "userId" } }
        ],
        where: [
          {
            FieldName: "userId",
            Operator: "EqualTo", 
            Values: [parseInt(actualUserId)]
          }
        ]
      };

      const userResponse = await apperClient.fetchRecords("profile", userParams);
      
      if (!userResponse.success || !userResponse.data || userResponse.data.length === 0) {
        // If userId lookup fails, try finding by Id directly
        const directParams = {
          fields: [
            { field: { Name: "Id" } },
            { field: { Name: "email" } },
            { field: { Name: "Name" } }
          ],
          where: [
            {
              FieldName: "Id",
              Operator: "EqualTo", 
              Values: [parseInt(actualUserId)]
            }
          ]
        };

        const directResponse = await apperClient.fetchRecords("profile", directParams);
        
        if (!directResponse.success || !directResponse.data || directResponse.data.length === 0) {
          throw new Error("User profile not found. Unable to reset password.");
        }
        
        var userProfile = directResponse.data[0];
      } else {
        var userProfile = userResponse.data[0];
      }

      // Update the user's password in the profile table
      const updateParams = {
        records: [
          {
            Id: userProfile.Id,
            password: newPassword
          }
        ]
      };

      const updateResponse = await apperClient.updateRecord("profile", updateParams);
      
      if (!updateResponse.success) {
        console.error("Failed to update password:", updateResponse.message);
        throw new Error("Failed to update password. Please try again.");
      }

      // Verify the update was successful
      if (updateResponse.results) {
        const failedUpdates = updateResponse.results.filter(result => !result.success);
        if (failedUpdates.length > 0) {
          console.error("Password update failed:", failedUpdates);
          throw new Error("Failed to update password. Please try again.");
        }
      }

      // Delete the reset token to prevent reuse
      try {
        const deleteParams = {
          RecordIds: [tokenValidation.resetRequestId]
        };
        await apperClient.deleteRecord("password_reset_requests", deleteParams);
      } catch (deleteError) {
        console.error("Failed to delete reset token:", deleteError);
        // Don't throw here as password update was successful
      }

      return {
        message: "Password has been reset successfully. You can now log in with your new password.",
        success: true,
        userEmail: userProfile.email
      };

    } catch (error) {
      console.error("Error resetting password:", error?.response?.data?.message || error.message);
      throw new Error(error.message || "Failed to reset password. Please try again.");
    }
  }
}