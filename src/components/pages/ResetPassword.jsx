import { useEffect } from 'react';

const ResetPassword = () => {
    useEffect(() => {
        const { ApperUI } = window.ApperSDK;
        ApperUI.showResetPassword('#authentication-reset-password');
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
            <div id="authentication-reset-password" className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-gray-100"></div>
        </div>
    );
};

export default ResetPassword;