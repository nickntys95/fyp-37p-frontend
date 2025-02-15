  import React, { useState } from 'react';

  function Two2FAVerification({onVerifySuccess, onResetSucces, onChangeSuccess}) {
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const email = sessionStorage.getItem('email');
    const password = sessionStorage.getItem('password');
    const recovery_key = sessionStorage.getItem('recovery_key');
    const [new_password, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const forgotPasswordEmail = sessionStorage.getItem('forgotPasswordEmail');

    const handleTokenLogin = async (e) => {
      e.preventDefault();
      try {
        const response = await fetch('/api2/auth/confirm_login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password, otp })
        });
    
        const data = await response.json();
        console.log(data);


        if (data.successful) {
          onVerifySuccess(data);
          sessionStorage.setItem('token', data.token);
          sessionStorage.setItem("user_name", data.user_name);
        } else {
          setError(data.error);
          sessionStorage.removeItem('token', data.token);
          sessionStorage.removeItem("user_name", data.user_name);
        }
      } catch (error) {
        setOtp("");
        console.error("The error is: ", error.message);
        setError("Invalid OTP");
      }
    };

    const handleTokenVerification = async (e) => {
      e.preventDefault();
      try {
        const response = await fetch('/api2/auth/confirm_registration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password, recovery_key, otp })
        });
    
        const data = await response.json();
        console.log(data);


        if (data.successful) {
          onVerifySuccess(data);
          sessionStorage.setItem('token', data.token);
          sessionStorage.setItem("user_name", data.user_name);
        } else {
          setError(data.error);
          sessionStorage.removeItem('token', data.token);
          sessionStorage.removeItem("user_name", data.user_name);
        }
      } catch (error) {
        setOtp("");
        console.error("The error is: ", error.message);
        setError("Invalid OTP");
      }
    };

    const handleReset = async() => {
      try {
          const response = await fetch('/api2/auth/change_totp', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ otp })
            });

            const data = await response.json();
            onResetSucces(data);
      } catch (error) {
          console.error("The error is: ", error.message);
          setError(error.message);
          
      }
    };
  
    const handleChangePasswordVerification = async (e) => {
      e.preventDefault();

      if (new_password !== confirmNewPassword) {
        setError("Passwords do not match");
        return;
      }

      try {
        const response = await fetch('/api2/auth/confirm_change_password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({email: forgotPasswordEmail, new_password, otp })
        })

        const data = await response.json();
        if (data.successful) {
          onChangeSuccess(data);
          setError("");
          sessionStorage.setItem('new_password', new_password);
          sessionStorage.setItem('otp', otp);
          sessionStorage.setItem('email', sessionStorage.getItem('forgotPasswordEmail'));
          setTimeout(() => {
            sessionStorage.removeItem('new_password');
            sessionStorage.removeItem('otp');
            sessionStorage.removeItem('email');
            sessionStorage.removeItem('forgotPasswordEmail');
            sessionStorage.removeItem("user");
          }, 0);
        } else {
          setError(data.error);
          sessionStorage.removeItem('new_password');
          sessionStorage.removeItem('otp');
          sessionStorage.removeItem('email');
          sessionStorage.removeItem('forgotPasswordEmail');
          sessionStorage.removeItem("user");
        }
        } catch (error) {
        setOtp("");
        console.error("The error is: ", error.message);
        setError("Invalid OTP");
        }
      };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (forgotPasswordEmail) {
        handleChangePasswordVerification(e);
      } else if (email && password && recovery_key) {
        handleTokenVerification(e);
      } else {
        handleTokenLogin(e);
      }
    };
    
    return (
      <form onSubmit={handleSubmit}>
        <div className="p-6">
          <h2 className="text-3x1 text-center font-extralight">
          {forgotPasswordEmail ? 'Change Password' : 'Validate TOTP'}
          </h2>
        </div>
        <hr className="text-gray-200 mt-6 mb-6" />
        {forgotPasswordEmail ? (
          <p className="text-center text-gray-600 text-lg font-light">
            Please enter your new password, confirm new password and 6-digit Time Based OTP to change your password
          </p>
        ) : (
          <p className="text-center text-gray-600 text-lg font-light">
            Please enter 6-digit Time Based OTP to verify 2FA authentication
          </p>
        )}
        <div className="p-6">
          {forgotPasswordEmail ? (
            <>
              <div className="mb-4">
                <label className="text-gray-600 text-sm">Email address</label>
                <input
                  type="email"
                  value={forgotPasswordEmail}
                  className="login-input"
                  placeholder="Enter Your Email address"
                  readOnly
                />
              </div>
              <div className="mb-4">
                <label className="text-gray-600 text-sm">New Password</label>
                <input
                  label="New Password"
                  type="password"
                  value={new_password}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="login-input"
                  placeholder="Enter Your New Password"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="text-gray-600 text-sm">Confirm New Password</label>
                <input
                  label="Confirm New Password"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="login-input"
                  placeholder="Confirm Your New Password"
                  required
                />
              </div>
              <div className="mb-4">
              <label className="text-gray-600 text-sm">TOTP</label>
              <input
                label="TOTP"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="login-input"
                placeholder="Enter Your OTP"
                required
              />
            </div>
            {error && <p className="error">{error}</p>}
              <button type="submit" className="twoFA-btn">
                Change Password
              </button>
            </>
          ) : (
            <>
              <div className="mb-4">
                <label className="text-gray-600 text-sm">TOTP</label>
                <input
                  label="TOTP"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="login-input"
                  placeholder="Enter Your OTP"
                  required
                />
              </div>
              {error && <p className="error">{error}</p>}
              <button type="submit" className="twoFA-btn">
                Verify TOTP
              </button>
              <button type="button" className="twoFA-btn-reset" onClick={handleReset}>
              Reset 2FA
            </button>
          </>
        )}
      </div>
    </form>
  );
  }

  export default Two2FAVerification;
