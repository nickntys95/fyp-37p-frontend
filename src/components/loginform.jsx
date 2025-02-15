import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export const LoginForm = ({ onRegisterSuccess, onLoginSuccess, onChangePasswordSuccess, onAdminSuccess}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isChangePassword, setIsChangePassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [username, setUsername] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("https://fyp-37p-api-a16b479cb42b.herokuapp.com/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.successful) {
        setMessage("User logged in successfully");
        setEmail("");
        setPassword("");
        setError("");
        onLoginSuccess(data);
        sessionStorage.setItem("email", email);
        sessionStorage.setItem("password", password);
      } else {
        setError(data.error);
        setEmail("");
        setPassword("");
        setMessage("");
        sessionStorage.removeItem("email");
        sessionStorage.removeItem("password");
      }
    } catch (error) {
      console.error("The error is: ", error.message);
      setError("Invalid login credential");
      setMessage("");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await fetch("/api2/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (data.successful) {
        setIsRegister(false);
        setMessage("User registered successfully");
        setEmail("");
        setPassword("");
        setError("");
        setConfirmPassword("");
        onRegisterSuccess(data);
        sessionStorage.setItem("email", email);
        sessionStorage.setItem("password", password);
        sessionStorage.setItem('recovery_key', data.recovery_key);
      } else {
        setError(data.error);
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setMessage("");
        sessionStorage.removeItem("email");
        sessionStorage.removeItem("password");
        sessionStorage.removeItem("recovery_key");
      }
    } catch (error) {
      console.error("The error is: ", error.message);
      setError("Something went wrong during user registration");
      setMessage("");
    }
  };

  const handleRegisterToggle = () => {
    setIsRegister(!isRegister);
    setError("");
    setMessage("");
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api2/auth/change_password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({email: forgotPasswordEmail}),
      });

      const data = await response.json();

      if (data.successful) {
        setMessage("Password reset successfully");
        setError("");
        onChangePasswordSuccess(data);
        sessionStorage.setItem('forgotPasswordEmail', forgotPasswordEmail);
        sessionStorage.setItem('message', 'Password reset successfully');
        
      } else {
        setError(data.error);
        setMessage("");
        sessionStorage.removeItem('forgotPasswordEmail');
      }
    } catch (error) {
      console.error("The error is: ", error.message);
      setError("Something went wrong during password reset");
      setMessage("");
    }
  };

  useEffect(() => {
    const message = sessionStorage.getItem('message');
    if (message) {
      setMessage(message);
      sessionStorage.removeItem('message');
    }
  }, []);

  const handleChangePasswordToggle = () => {
    setIsChangePassword(!isChangePassword);
    setError("");
    setMessage("");
  };

  const handleAdminToggle = () => {
    setIsAdmin(!isAdmin);
    setError("");
    setMessage("");
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/api2/auth/login_admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
	  console.log(username);
	  console.log(password);

      if (data.successful) {
        setMessage("Admin logged in successfully");
		    setUsername("")
		    setPassword("");
        setError("");
        onAdminSuccess(data);
		sessionStorage.setItem("username", username);
		sessionStorage.setItem("token", data.token);
      } else {
        setError(data.error);
		    setUsername("");
        setPassword("");
        setMessage("");
		sessionStorage.removeItem("username", username);
    sessionStorage.removeItem("token", data.token);
      }
    } catch (error) {
      console.error("The error is: ", error.message);
      setError("Invalid login credential");
      setMessage("");
    }
  };


  return (
    <div>
      <form onSubmit={isChangePassword ? handleChangePassword : isAdmin ? handleAdminLogin : isRegister ? handleRegister : handleLogin}>
        {isChangePassword ? (
          <div>
            <h2 className="text-3xl text-center font-extralight">
              Forgot Password
            </h2>
            <p className="text-center text-gray-600 text-lg font-light">
              Enter your email address to reset your password
            </p>
            <div className="p-6">
              <div className="mb-4">
                <label className="text-gray-600 text-sm">Email address</label>
                <input
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="login-input"
                  placeholder="Enter Your Email address"
                  required
                />
              </div>
              {error && <p className="error">{error}</p>}
              {message && <p className="message">{message}</p>}
              <button type="submit" className="btn btn-form" >
                Continue
              </button>
              <div>
                <p>
                  Remember your password?{" "}
                  <Link to="" onClick={handleRegisterToggle}>
                    Login
                  </Link>
                </p>
              </div>
            </div>
          </div>
        ) : isAdmin ? (
          // ... start of admin form content ...
          <div>
            <h2 className="text-3xl text-center font-extralight">
              Admin Login
            </h2>
            <p className="text-center text-gray-600 text-lg font-light">
              Enter your admin credentials
            </p>
            <div className="p-6">
              <div className="mb-4">
                <label className="text-gray-600 text-sm">Username</label>
                <input
                  type="test"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="login-input"
                  placeholder="Enter Your Username"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="text-gray-600 text-sm">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input"
                  placeholder="Enter Your Password"
                  required
                />
              </div>
              {error && <p className="error">{error}</p>}
              {message && <p className="message">{message}</p>}
              <button type="submit" className="btn btn-form">
                Login
              </button>
              <div>
                <p>
                  Not an Admin? Back to <Link to="" onClick={() => setIsAdmin(false)}>Login</Link>
                </p>
              </div>
            </div>
          </div>
        ) : (
        // ... end of admin form content ... 
          <div>
              <div>
                <p>
                  Click here to proceed to&nbsp;
                  <Link to="" onClick={handleAdminToggle}>
                     admin
                  </Link>
                  &nbsp;login
                </p>
              </div>
            <h2 className="text-3xl text-center font-extralight">
              {isRegister ? "Create Account" : "Login"}
            </h2>
            <p className="text-center text-gray-600 text-lg font-light">
              {isRegister
                ? "Welcome to FYP-24-S4-37P, please enter your information"
                : "Login to FYP-24-S4-37P to continue to Auction Platform"}
            </p>
            <div className="p-6">
              {isRegister && (
                <div className="mb-4">
                  <label className="text-gray-600 text-sm">Username</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="login-input"
                    placeholder="Enter a Username"
                    required
                  />
                </div>
              )}
              <div className="mb-4">
                <label className="text-gray-600 text-sm">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-input"
                  placeholder="Enter Your Email address"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="text-gray-600 text-sm">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input"
                  placeholder="Enter Your Password"
                  required
                />
              </div>
              {isRegister && (
                <div className="mb-4">
                  <label className="text-gray-600 text-sm">Confirm Password</label>
                  <input
                    type="password" value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="login-input"
                    placeholder="Enter Your Confirm Password"
                    required
                  />
                </div>
              )}
              <div>
                <p>
                  <Link to="" onClick={handleChangePasswordToggle}>
                    Forgot password?
                  </Link>
                </p>
              </div>
              {error && <p className="error">{error}</p>}
              {message && <p className="message">{message}</p>}
              <button type="submit" className="btn btn-form">
                {isRegister ? "Register" : "Continue"}
              </button>
              <div>
                <p>
                  {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
                  <Link to="" onClick={handleRegisterToggle}>
                    {isRegister ? "Login" : "Sign up"}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )
        }
      </form>
    </div>
  );
};

export default LoginForm;