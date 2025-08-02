import { useEffect } from 'react';

const PromptPassword = () => {
    useEffect(() => {
        const { ApperUI } = window.ApperSDK;
        ApperUI.showPromptPassword('#authentication-prompt-password');
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
            <div id="authentication-prompt-password" className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8"></div>
        </div>
    );
};

export default PromptPassword;