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
  }
}