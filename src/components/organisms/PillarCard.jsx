import { motion } from "framer-motion"
import { useSelector } from "react-redux"
import ApperIcon from "@/components/ApperIcon"
import ProgressRing from "@/components/molecules/ProgressRing"
import Card from "@/components/atoms/Card"

const PillarCard = ({ pillar, onClick }) => {
const { responses } = useSelector((state) => state.responses)
  
  // Validate pillar ID to prevent counting responses from wrong pillars
  const validPillarIds = ["raison-detre", "type-of-business", "expectations", "extinction"]
  const isValidPillar = validPillarIds.includes(pillar.id)
  
  if (!isValidPillar) {
    console.warn(`Invalid pillar ID in PillarCard: ${pillar.id}`)
  }
  
  const pillarResponses = isValidPillar ? (responses[pillar.id] || {}) : {}
  
  // Helper function to check if a response is answered
  const isResponseAnswered = (response) => {
    if (!response) return false
    
    // Handle different response formats
    if (typeof response === 'string') {
      return response.replace(/<[^>]*>/g, '').trim().length > 0
    }
    
    if (typeof response === 'object') {
      // Handle response with content property
      if (response.content) {
        return response.content.replace(/<[^>]*>/g, '').trim().length > 0
      }
      
      // Handle individual responses array
      if (Array.isArray(response)) {
        return response.some(r => r && r.content && r.content.replace(/<[^>]*>/g, '').trim().length > 0)
      }
      
      // Handle individual response objects
      if (response.name || response.content) {
        const content = response.content || ''
        return content.replace(/<[^>]*>/g, '').trim().length > 0
      }
    }
    
    return false
  }
  
  const completedQuestions = Object.values(pillarResponses).filter(isResponseAnswered).length
  const progress = (completedQuestions / pillar.questions.length) * 100

  const getIconForPillar = (pillarId) => {
    switch (pillarId) {
      case "raison-detre": return "Heart"
      case "type-of-business": return "Target"
      case "expectations": return "Users"
      case "extinction": return "Shield"
      default: return "FileText"
    }
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className="pillar-card"
        onClick={() => onClick(pillar.id)}
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br ${pillar.gradient}`}>
              <ApperIcon 
                name={getIconForPillar(pillar.id)} 
                className="w-6 h-6 text-white" 
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                {pillar.title}
              </h3>
              <p className="text-sm text-gray-600">{pillar.subtitle}</p>
            </div>
          </div>
          <ProgressRing progress={progress} size={48} />
        </div>

        <p className="text-gray-600 mb-4 line-clamp-2">
          {pillar.description}
        </p>

        <div className="flex items-center justify-between">
<span className="text-sm text-gray-500">
            {completedQuestions} of {pillar.questions.length} questions completed
          </span>
          <ApperIcon 
            name="ArrowRight" 
            className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" 
          />
        </div>
      </Card>
    </motion.div>
  )
}

export default PillarCard