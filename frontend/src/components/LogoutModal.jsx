import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';

const LogoutModal = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity">
      <div className="bg-white rounded-[2rem] p-8 w-96 max-w-full shadow-lg m-4 transform transition-transform">
        <h2 className="text-2xl font-bold mb-3 text-gray-900">Log Out</h2>
        <p className="text-gray-500 mb-8 font-medium">Are you sure you want to log out of your account?</p>
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-5 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 px-5 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
