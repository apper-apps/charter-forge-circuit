import { NavLink } from "react-router-dom"
import { useSelector } from "react-redux"
import { motion } from "framer-motion"
import ApperIcon from "@/components/ApperIcon"
import { cn } from "@/utils/cn"

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useSelector((state) => state.auth)
  const isAdmin = user?.role === "admin"

  const participantNavItems = [
    { to: "/dashboard", icon: "LayoutDashboard", label: "Dashboard" },
    { to: "/export", icon: "Download", label: "Export Charter" },
    { to: "/profile", icon: "User", label: "Profile" }
  ]

  const adminNavItems = [
    { to: "/admin", icon: "Users", label: "Participants" },
    { to: "/admin/analytics", icon: "BarChart3", label: "Analytics" }
  ]

  const navItems = isAdmin ? adminNavItems : participantNavItems

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          x: isOpen ? 0 : "-100%" 
        }}
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50 lg:relative lg:translate-x-0 lg:z-auto"
        )}
      >
<div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
<div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-accent-600 rounded-lg flex items-center justify-center overflow-hidden">
              {user?.profile?.logoUrl ? (
                <img 
                  src={user.profile.logoUrl} 
                  alt="Company Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.src = "https://ln5.sync.com/dl/316c01840/t3423qw5-542xuitq-n6sxigph-vh4hrsbe";
                    e.target.onerror = () => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><polyline points="14,2 14,8 20,8"/></svg>';
                    };
                  }}
                />
              ) : (
                <img 
                  src="https://ln5.sync.com/dl/316c01840/t3423qw5-542xuitq-n6sxigph-vh4hrsbe" 
                  alt="Legacy Align Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><polyline points="14,2 14,8 20,8"/></svg>';
                  }}
                />
              )}
            </div>
            <div>
<h2 className="text-lg font-bold text-gray-900 text-left">Family Business Charter Builder</h2>
              <p className="text-xs text-gray-600 text-left">
                {isAdmin ? "Admin Panel" : "Charter Builder"}
              </p>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                    isActive
                      ? "bg-gradient-to-r from-primary-50 to-accent-50 text-primary-700 border-l-4 border-primary-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <ApperIcon 
                      name={item.icon} 
                      size={20} 
                      className={cn(
                        "transition-colors duration-200",
                        isActive ? "text-primary-600" : "text-gray-400 group-hover:text-gray-600"
                      )}
                    />
                    <span className="font-medium">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </motion.aside>
    </>
  )
}

export default Sidebar