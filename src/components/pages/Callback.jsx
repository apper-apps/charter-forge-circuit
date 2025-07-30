import React, { useEffect } from 'react';

const Callback = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ApperSDK) {
      const { ApperUI } = window.ApperSDK;
      ApperUI.showSSOVerify("#authentication-callback");
    }
  }, []);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <div id="authentication-callback"></div>
    </div>
  );
};

export default Callback;