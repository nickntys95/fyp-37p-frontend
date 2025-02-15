import React from 'react';
import LoginForm from './loginform';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/session';

const Login = () => {
  const navigate = useNavigate();
  const {login} = useSession();

  const handleLoginSuccess = (userData) => {
    console.log("The logged in userdata:", userData)
    login(userData)

    if(userData.successful) {
      navigate("/verify-2fa")
    }

  }

  const handleRegisterSuccess = (userData) => {
    console.log("The registered userdata:", userData)
    login(userData)

    if(!userData.successful) {
      navigate("/verify-2fa")
    } else{
      navigate("/setup-2fa")
    }

  }

  const handleChangePasswordSuccess = (userData) => {
    console.log("The logged in userdata:", userData)
    login(userData)

    if(userData.successful) {
      navigate("/verify-2fa")
    }

  }

  const handleAdminSuccess = (userData) => {
    console.log("The logged in userdata:", userData)
    login(userData)

    if(userData.successful) {
      navigate("/adminhome")
    }

  }

  return (
    <LoginForm 
      onLoginSuccess={handleLoginSuccess} 
      onRegisterSuccess={handleRegisterSuccess}
      onChangePasswordSuccess={handleChangePasswordSuccess}
      onAdminSuccess={handleAdminSuccess}
    />
  );
};

export default Login;