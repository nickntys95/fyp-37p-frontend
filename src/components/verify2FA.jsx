import React from "react";
import { useNavigate } from 'react-router-dom';
import Two2FAVerification from "./two2FAVerification";

const Verify2FA = () => {
  const navigate = useNavigate();

  const handleVerification = async(data) => {
    if(data){
      navigate("/home");
    }

  };

  const handle2FAReset = async(data) => {
    if(data){
      navigate("/setup-2fa");
    }

  };

  const handleChangePassword = async(data) => {
    if(data){
      navigate("/login");
    }

  };

  return <Two2FAVerification onVerifySuccess={handleVerification} onResetSuccess={handle2FAReset} onChangeSuccess={handleChangePassword}/>;

};

export default Verify2FA;