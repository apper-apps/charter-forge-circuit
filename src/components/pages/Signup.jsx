import { useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '@/App';
import ApperIcon from "@/components/ApperIcon"

function Signup() {
  const { isInitialized } = useContext(AuthContext);
  
  useEffect(() => {
    if (isInitialized) {
      // Show signup UI in this component
      const { ApperUI } = window.ApperSDK;
      ApperUI.showSignup("#authentication");
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
            <div className="text-center text-lg xl:text-xl font-bold">
              Create Account
            </div>
            <div className="text-center text-sm text-gray-500">
              Please create an account to continue
            </div>
          </div>
        </div>
        <div id="authentication" />
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;