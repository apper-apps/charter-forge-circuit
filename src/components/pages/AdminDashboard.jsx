import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { PILLARS } from "@/services/mockData/pillars";
import { adminService } from "@/services/api/adminService";
import ApperIcon from "@/components/ApperIcon";
import SearchBar from "@/components/molecules/SearchBar";
import FormField from "@/components/molecules/FormField";
import Loading from "@/components/ui/Loading";
import Error from "@/components/ui/Error";
import Empty from "@/components/ui/Empty";
import Dashboard from "@/components/pages/Dashboard";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import { createParticipantFailure, createParticipantStart, createParticipantSuccess, fetchParticipantsFailure, fetchParticipantsStart, fetchParticipantsSuccess, updateFilters } from "@/store/slices/adminSlice";
import { cn } from "@/utils/cn";

const AdminDashboard = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { participants, isLoading, error, filters } = useSelector((state) => state.admin)
const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [createErrors, setCreateErrors] = useState({})
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

  const handleCreateParticipant = () => {
    setShowCreateModal(true)
    setCreateForm({ name: '', email: '', password: '' })
    setCreateErrors({})
  }

  const handleCloseCreateModal = () => {
    setShowCreateModal(false)
    setCreateForm({ name: '', email: '', password: '' })
    setCreateErrors({})
  }

  const validateCreateForm = () => {
    const errors = {}
    
    if (!createForm.name.trim()) {
      errors.name = 'Name is required'
    }
    
    if (!createForm.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(createForm.email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (!createForm.password.trim()) {
      errors.password = 'Password is required'
    } else if (createForm.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }
    
    setCreateErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateCreateForm()) {
      return
    }

    dispatch(createParticipantStart())
    
    try {
      const result = await adminService.createParticipant(createForm)
      dispatch(createParticipantSuccess(result))
      toast.success('Participant created successfully! Login information has been sent via email.')
handleCloseCreateModal()
      // Refresh participants list
      const participantsData = await adminService.getAllParticipants()
      dispatch(fetchParticipantsSuccess(participantsData))
    } catch (error) {
      dispatch(createParticipantFailure(error.message))
      toast.error(error.message || 'Failed to create participant')
    }
  }

  const handleCreateFormChange = (field, value) => {
    setCreateForm(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (createErrors[field]) {
      setCreateErrors(prev => ({ ...prev, [field]: '' }))
    }
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
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleCreateParticipant}
                className="flex items-center space-x-2"
              >
                <ApperIcon name="Plus" size={16} />
                <span>Add Participant</span>
              </Button>
            </div>
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
                {filteredParticipants.map((participant, index) => {
                  const status = getCompletionStatus(participant)
                  
                  return (
                    <tr key={participant.id || participant.email || `participant-${index}`}>
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

      {/* Create Participant Modal */}
      {showCreateModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add New Participant</h2>
              <button
                onClick={handleCloseCreateModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <ApperIcon name="X" size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <FormField
                label="Full Name"
                type="text"
                value={createForm.name}
                onChange={(e) => handleCreateFormChange('name', e.target.value)}
                error={createErrors.name}
                required
                placeholder="Enter participant's full name"
              />

              <FormField
                label="Email Address"
                type="email"
                value={createForm.email}
                onChange={(e) => handleCreateFormChange('email', e.target.value)}
                error={createErrors.email}
                required
                placeholder="Enter participant's email"
              />

              <FormField
                label="Password"
                type="password"
                value={createForm.password}
                onChange={(e) => handleCreateFormChange('password', e.target.value)}
                error={createErrors.password}
                required
                placeholder="Enter login password"
              />

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCloseCreateModal}
                  className="flex-1"
                >
                  Cancel
                </Button>
<Button
                  type="submit"
                  loading={isLoading}
                  className="flex-1"
                >
                  Create Participant
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
</div>
      )}
    </div>
  )
}

export default AdminDashboard