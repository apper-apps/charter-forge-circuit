import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { motion } from "framer-motion"
import { fetchParticipantsStart, fetchParticipantsSuccess, fetchParticipantsFailure, updateFilters } from "@/store/slices/adminSlice"
import { adminService } from "@/services/api/adminService"
import { PILLARS } from "@/services/mockData/pillars"
import Button from "@/components/atoms/Button"
import Card from "@/components/atoms/Card"
import SearchBar from "@/components/molecules/SearchBar"
import Loading from "@/components/ui/Loading"
import Error from "@/components/ui/Error"
import Empty from "@/components/ui/Empty"
import ApperIcon from "@/components/ApperIcon"
import { cn } from "@/utils/cn"

const AdminDashboard = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { participants, isLoading, error, filters } = useSelector((state) => state.admin)

  useEffect(() => {
    const loadParticipants = async () => {
      dispatch(fetchParticipantsStart())
      try {
        const participantsData = await adminService.getAllParticipants()
        dispatch(fetchParticipantsSuccess(participantsData))
      } catch (error) {
        dispatch(fetchParticipantsFailure(error.message))
      }
    }

    loadParticipants()
  }, [dispatch])

  const handleSearch = (query) => {
    dispatch(updateFilters({ search: query }))
  }

  const handleFilterChange = (filter, value) => {
    dispatch(updateFilters({ [filter]: value }))
  }

  const handleViewParticipant = (userId) => {
    navigate(`/admin/participant/${userId}`)
  }

  const handleRetry = () => {
    window.location.reload()
  }

  const getCompletionStatus = (participant) => {
    if (!participant.responses) return { completed: 0, total: 0, percentage: 0 }
    
    const totalQuestions = PILLARS.reduce((sum, pillar) => sum + pillar.questions.length, 0)
    const completedQuestions = Object.values(participant.responses).reduce((sum, pillarResponses) => {
      return sum + Object.values(pillarResponses).filter(response => 
        response && response.trim().length > 0
      ).length
    }, 0)
    
    return {
      completed: completedQuestions,
      total: totalQuestions,
      percentage: totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0
    }
  }

  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = !filters.search || 
      participant.profile?.fullName?.toLowerCase().includes(filters.search.toLowerCase()) ||
      participant.profile?.businessName?.toLowerCase().includes(filters.search.toLowerCase()) ||
      participant.email?.toLowerCase().includes(filters.search.toLowerCase())
    
    if (!matchesSearch) return false

    if (filters.completionStatus === "all") return true
    
    const status = getCompletionStatus(participant)
    if (filters.completionStatus === "completed") return status.percentage === 100
    if (filters.completionStatus === "in-progress") return status.percentage > 0 && status.percentage < 100
    if (filters.completionStatus === "not-started") return status.percentage === 0
    
    return true
  })

  if (isLoading) {
    return <Loading type="table" />
  }

  if (error) {
    return <Error message={error} onRetry={handleRetry} />
  }

  if (participants.length === 0) {
    return (
      <div className="p-8">
        <Empty
          title="No participants yet"
          description="Participants will appear here once they start using the charter builder."
          icon="Users"
        />
      </div>
    )
  }

  const totalParticipants = participants.length
  const completedCount = participants.filter(p => getCompletionStatus(p).percentage === 100).length
  const inProgressCount = participants.filter(p => {
    const status = getCompletionStatus(p)
    return status.percentage > 0 && status.percentage < 100
  }).length

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-8">
<h1 className="text-3xl font-bold text-gray-900 mb-2 text-left">Participant Dashboard</h1>
          <p className="text-lg text-gray-600 text-left">
            Monitor progress and manage family business charter participants
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Participants</p>
                <p className="text-2xl font-bold text-gray-900">{totalParticipants}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                <ApperIcon name="Users" className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Charters</p>
                <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                <ApperIcon name="CheckCircle" className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{inProgressCount}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-accent-100 to-accent-200 rounded-lg flex items-center justify-center">
                <ApperIcon name="Clock" className="w-6 h-6 text-accent-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            <SearchBar 
              onSearch={handleSearch}
              placeholder="Search by name, business, or email..."
              className="flex-1"
            />
            
            <div className="flex items-center space-x-4">
              <select
                value={filters.completionStatus}
                onChange={(e) => handleFilterChange("completionStatus", e.target.value)}
                className="form-field min-w-[150px]"
              >
                <option value="all">All Participants</option>
                <option value="completed">Completed</option>
                <option value="in-progress">In Progress</option>
                <option value="not-started">Not Started</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Participants Table */}
        <Card className="overflow-hidden">
          <div className="admin-table">
            <table className="w-full">
<thead>
                <tr>
                  <th className="text-left">Participant</th>
                  <th className="text-left">Business</th>
                  <th className="text-left">Progress</th>
                  <th className="text-left">Last Activity</th>
                  <th className="text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredParticipants.map((participant) => {
                  const status = getCompletionStatus(participant)
                  
                  return (
                    <tr key={participant.id}>
                      <td>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-heritage-200 to-heritage-300 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-heritage-800">
                              {participant.profile?.fullName?.charAt(0)?.toUpperCase() || participant.email?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <div>
<p className="font-medium text-gray-900 text-left">
                              {participant.profile?.fullName || "No name"}
                            </p>
                            <p className="text-sm text-gray-500 text-left">{participant.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
<p className="font-medium text-gray-900 text-left">
                            {participant.profile?.businessName || "Not specified"}
                          </p>
                          <p className="text-sm text-gray-500 text-left">
                            {participant.profile?.position || "No position"}
                          </p>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={cn(
                                "h-2 rounded-full transition-all duration-300",
                                status.percentage === 100
                                  ? "bg-gradient-to-r from-green-400 to-green-600"
                                  : status.percentage > 0
                                  ? "bg-gradient-to-r from-accent-400 to-accent-600"
                                  : "bg-gray-300"
                              )}
                              style={{ width: `${status.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700 min-w-[50px]">
                            {Math.round(status.percentage)}%
                          </span>
                        </div>
<p className="text-xs text-gray-500 mt-1 text-left">
                          {status.completed} of {status.total} questions
                        </p>
                      </td>
                      <td>
<p className="text-sm text-gray-600 text-left">
                          {participant.lastActivity ? new Date(participant.lastActivity).toLocaleDateString() : "Never"}
                        </p>
                      </td>
                      <td>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewParticipant(participant.id)}
                          className="flex items-center space-x-1"
                        >
                          <ApperIcon name="Eye" size={16} />
                          <span>View</span>
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {filteredParticipants.length === 0 && participants.length > 0 && (
<div className="text-center py-8">
            <ApperIcon name="Search" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2 text-left">No participants found</h3>
            <p className="text-gray-600 text-left">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default AdminDashboard