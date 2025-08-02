// Authentication is now handled by Apper SDK
// This service is preserved for potential future custom auth extensions

// Initialize ApperClient for database operations
const { ApperClient } = window.ApperSDK;
const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

export const authService = {
// All authentication is now handled by Apper SDK
  // Login, logout, and user management are done through ApperUI
  
  async checkUserExists(email) {
    // This method can be used to verify if a user profile exists
    // for post-authentication profile creation
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
      
      if (!response.success) {
        console.error(response.message);
        return false;
      }

      return response.data && response.data.length > 0;
    } catch (error) {
      console.error("Error checking user existence:", error?.response?.data?.message || error.message);
      return false;
    }
  }
}