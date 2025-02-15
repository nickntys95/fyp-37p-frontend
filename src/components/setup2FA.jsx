import React from 'react';
import Two2FASetup from "./two2FASetup";
import { useNavigate } from 'react-router-dom';

const Setup2FA = () => {
  const navigate = useNavigate();
  const handleSetupComplete = () => {
    navigate("/verify-2fa");
  }
  return <Two2FASetup onSetupComplete={handleSetupComplete} />;
};

export default Setup2FA;