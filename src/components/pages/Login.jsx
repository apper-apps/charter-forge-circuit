import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../App';
import ApperIcon from "@/components/ApperIcon"

function Login() {
  const { isInitialized } = useContext(AuthContext);
  
  useEffect(() => {
    if (isInitialized) {
      // Show login UI in this component
      const { ApperUI } = window.ApperSDK;
      ApperUI.showLogin("#authentication");
    }
  }, [isInitialized]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="flex flex-col gap-6 items-center justify-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl flex items-center justify-center">
            <ApperIcon name="FileText" className="w-8 h-8 text-white" />
          </div>
          <div className="flex flex-col gap-1 items-center justify-center">
            <div className="text-center text-2xl font-bold text-gray-900">
              Sign in to Family Business Charter
            </div>
            <div className="text-center text-gray-600">
              Welcome back, please sign in to continue
            </div>
          </div>
        </div>
        <div id="authentication" />
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium text-primary-600 hover:text-primary-700">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;