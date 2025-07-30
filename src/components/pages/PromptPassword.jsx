import { useEffect } from 'react';

const PromptPassword = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ApperSDK) {
      const { ApperUI } = window.ApperSDK;
      ApperUI.showPromptPassword('#authentication-prompt-password');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div id="authentication-prompt-password" className="bg-white mx-auto w-[400px] max-w-full p-10 rounded-2xl shadow-xl border border-gray-100"></div>
    </div>
  );
};

export default PromptPassword;