import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { motion, AnimatePresence } from "framer-motion"
import { logout } from "@/store/slices/authSlice"
import ApperIcon from "@/components/ApperIcon"
import Button from "@/components/atoms/Button"

const Header = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const [showDropdown, setShowDropdown] = useState(false)

  const handleLogout = () => {
    dispatch(logout())
    setShowDropdown(false)
  }

  const isAdmin = user?.role === "admin"

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
<div className="flex items-center space-x-3">
<div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-accent-600 rounded-lg flex items-center justify-center overflow-hidden">
{user?.profile?.logoUrl ? (
                  <img 
                    src={user.profile.logoUrl} 
                    alt="Company Logo" 
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      e.target.src = "https://ln5.sync.com/dl/38e785030/bgpk2d5j-xhgfhcjs-46apugsn-arkekbda";
                      e.target.onerror = () => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'block';
                      };
                    }}
                  />
                ) : (
                  <img 
                    src="https://ln5.sync.com/dl/38e785030/bgpk2d5j-xhgfhcjs-46apugsn-arkekbda" 
                    alt="Legacy Align Logo" 
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'block';
                    }}
                  />
                )}
                <ApperIcon 
                  name="FileText" 
                  className="w-6 h-6 text-white hidden" 
                />
              </div>
<div>
                <h1 className="text-xl font-bold text-gray-900 text-left">Family Business Charter</h1>
                <p className="text-sm text-gray-600 text-left">
                  {isAdmin ? "Admin Dashboard" : "Build Your Family Charter"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Button
                variant="ghost"
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-heritage-200 to-heritage-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-heritage-800">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <ApperIcon name="ChevronDown" size={16} />
              </Button>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                  >
<div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 text-left">{user?.email}</p>
                      <p className="text-xs text-gray-500 capitalize text-left">{user?.role}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <ApperIcon name="LogOut" size={16} />
                      <span>Sign out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header