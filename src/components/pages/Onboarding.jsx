import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { motion } from "framer-motion"
import { saveProfileStart, saveProfileSuccess, saveProfileFailure } from "@/store/slices/profileSlice"
import { profileService } from "@/services/api/profileService"
import Button from "@/components/atoms/Button"
import FormField from "@/components/molecules/FormField"
import Card from "@/components/atoms/Card"
import ApperIcon from "@/components/ApperIcon"
import { toast } from "react-toastify"

const BUSINESS_TYPES = [
  "Manufacturing",
  "Retail",
  "Services",
  "Technology",
  "Construction",
  "Healthcare",
  "Finance",
  "Real Estate",
  "Agriculture",
  "Other"
]

const REVENUE_RANGES = [
  "Under $100K",
  "$100K - $500K",
  "$500K - $1M",
  "$1M - $5M",
  "$5M - $10M",
  "$10M - $50M",
  "Over $50M",
  "Prefer not to say"
]

const Onboarding = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { isSaving, error } = useSelector((state) => state.profile)
  
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    businessName: "",
    position: "",
    otherOwners: "",
    businessType: "",
    customBusinessType: "",
    yearsInBusiness: "",
    annualRevenue: "",
    country: "",
    city: ""
  })

  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required"
    if (!formData.businessName.trim()) newErrors.businessName = "Business name is required"
    if (!formData.position.trim()) newErrors.position = "Position is required"
    if (!formData.businessType) newErrors.businessType = "Business type is required"
    if (formData.businessType === "Other" && !formData.customBusinessType.trim()) {
      newErrors.customBusinessType = "Please specify business type"
    }
    if (!formData.yearsInBusiness || formData.yearsInBusiness < 0) {
      newErrors.yearsInBusiness = "Years in business is required"
    }
    if (!formData.annualRevenue) newErrors.annualRevenue = "Annual revenue range is required"
    if (!formData.country.trim()) newErrors.country = "Country is required"
    if (!formData.city.trim()) newErrors.city = "City is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error("Please fill in all required fields")
      return
    }

    dispatch(saveProfileStart())
    
    try {
      const profileData = {
        ...formData,
        businessType: formData.businessType === "Other" ? formData.customBusinessType : formData.businessType,
        yearsInBusiness: parseInt(formData.yearsInBusiness)
      }
      
      const savedProfile = await profileService.saveProfile(user.id, profileData)
      dispatch(saveProfileSuccess(savedProfile))
      toast.success("Profile completed successfully!")
      navigate("/dashboard")
    } catch (error) {
      dispatch(saveProfileFailure(error.message))
      toast.error("Failed to save profile")
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <ApperIcon name="UserPlus" className="w-8 h-8 text-white" />
          </div>
<h1 className="text-3xl font-bold text-gray-900 mb-2 text-left">Welcome to Charter Forge</h1>
          <p className="text-lg text-gray-600 text-left">
            Let's start by getting to know you and your family business
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                error={errors.fullName}
                required
              />

              <FormField
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                error={errors.phone}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Family Business Name"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                placeholder="Enter your business name"
                error={errors.businessName}
                required
              />

              <FormField
                label="Your Position in Business"
                name="position"
                value={formData.position}
                onChange={handleChange}
                placeholder="e.g., CEO, Owner, Partner"
                error={errors.position}
                required
              />
            </div>

            <FormField
              label="Names of Other Owners"
              name="otherOwners"
              type="textarea"
              rows={3}
              value={formData.otherOwners}
              onChange={handleChange}
              placeholder="List other family members or partners who own part of the business"
              error={errors.otherOwners}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Type of Business"
                name="businessType"
                type="select"
                value={formData.businessType}
                onChange={handleChange}
                error={errors.businessType}
                required
              >
                <option value="">Select business type</option>
                {BUSINESS_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </FormField>

              {formData.businessType === "Other" && (
                <FormField
                  label="Specify Business Type"
                  name="customBusinessType"
                  value={formData.customBusinessType}
                  onChange={handleChange}
                  placeholder="Please specify"
                  error={errors.customBusinessType}
                  required
                />
              )}

              <FormField
                label="Number of Years in Business"
                name="yearsInBusiness"
                type="number"
                min="0"
                value={formData.yearsInBusiness}
                onChange={handleChange}
                placeholder="Enter number of years"
                error={errors.yearsInBusiness}
                required
              />
            </div>

            <FormField
              label="Annual Revenue Range"
              name="annualRevenue"
              type="select"
              value={formData.annualRevenue}
              onChange={handleChange}
              error={errors.annualRevenue}
              required
            >
              <option value="">Select revenue range</option>
              {REVENUE_RANGES.map(range => (
                <option key={range} value={range}>{range}</option>
              ))}
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="Enter your country"
                error={errors.country}
                required
              />

              <FormField
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Enter your city"
                error={errors.city}
                required
              />
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                This information helps us personalize your charter building experience
              </p>
              <Button
                type="submit"
                variant="primary"
                loading={isSaving}
                disabled={isSaving}
                className="flex items-center space-x-2"
              >
                <span>Complete Profile</span>
                <ApperIcon name="ArrowRight" size={16} />
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}

export default Onboarding