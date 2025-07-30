import users from "@/services/mockData/users.json"

export const authService = {
  async login(email, password) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const user = users.find(u => u.email === email && u.password === password)
    
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
    
    // Check if user exists
    const user = users.find(u => u.email === email)
    
    if (!user) {
      throw new Error("No account found with this email address")
    }

    // Initialize ApperClient for database operations
    const { ApperClient } = window.ApperSDK
    const apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    })

    // Create password reset request record
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const expirationTime = new Date()
    expirationTime.setHours(expirationTime.getHours() + 1) // 1 hour expiration

    const params = {
      records: [{
        Name: `Password Reset for ${email}`,
        reset_token: resetToken,
        expiration_time: expirationTime.toISOString(),
        request_time: new Date().toISOString()
      }]
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