import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  CssBaseline,
  Typography,
  Container,
  Button,
  Card,
  CardHeader,
  CardContent,
  Grid,
} from "@mui/material";
import AppAppBar from "./appbar"; // Ensure the correct import path
import AppTheme from "../shared-theme/AppTheme"; // Ensure the correct import path

function MyAccount() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const email = sessionStorage.getItem("email");
  const [selectedTab, setSelectedTab] = useState("mydetails");
  const [new_password, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChangePasswordVerification = async (e) => {
    e.preventDefault();

    if (isSubmitting) return; // Prevent multiple submissions
    setIsSubmitting(true);

    if (new_password !== confirmNewPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await fetch(
        "https://fyp-37p-api-a16b479cb42b.herokuapp.com/auth/confirm_change_password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, new_password, otp }),
        }
      );

      const data = await response.json();
      if (data.successful) {
        setMessage(
          "Password changed successfully! You are required to re-login!"
        ); // Inform the user
        setError("");
      } else {
        setError(data.error);
        setMessage("");
        sessionStorage.removeItem("password");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("email");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("user_name");
      }
    } catch (error) {
      setOtp("");
      console.error("The error is: ", error.message);
      setError("Invalid OTP");
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
      }, 3000);
      setTimeout(() => {
        sessionStorage.removeItem("password");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("email");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("user_name");
        navigate("/login");
      }, 3000); // 3-second delay
    }
  };

  const getDisplayedList = () => {
    if (selectedTab === "mydetails")
      return (
        <div className="container my-5">
          <h1 className="mb-4 text-center text-uppercase">My details</h1>
        </div>
      );
  };

  return (
    <AppTheme>
      <CssBaseline />
      <AppAppBar />
      <Container
        id="myaccount"
        sx={{ display: "flex", flexDirection: "row", pt: 2, mt: 10, ml: 0 }}
      >
        <Box
          sx={{
            width: "200px",
            flexShrink: 0,
            borderTop: "2px solid #ccc",
            borderRight: "2px solid #ccc",
            p: 2,
            minHeight: "100vh",
            backgroundColor: "#f8f8f8",
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
            My Account, [{sessionStorage.getItem("user_name")}]
          </Typography>
          <Button
            fullWidth
            sx={tabButtonStyle(selectedTab === "mydetails")}
            onClick={() => setSelectedTab("mydetails")}
          >
            My Details
          </Button>
        </Box>

        <Box sx={{ flexGrow: 1, p: 3 }}>
          {getDisplayedList()}
          {selectedTab === "mydetails" && (
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: "bold", fontSize: 24 }}
              >
                Personal Information
              </Typography>
              <Box
                sx={{
                  width: "120%",
                  height: "3px",
                  backgroundColor: "#ccc",
                  mt: 1,
                }}
              />

              <Typography
                variant="subtitle1"
                align="left"
                sx={{ fontWeight: "bold", fontSize: 16 }}
              >
                Username: {sessionStorage.getItem("user_name")}
              </Typography>

              <Typography
                variant="subtitle1"
                align="left"
                sx={{ fontWeight: "bold", fontSize: 16 }}
              >
                Email: {email}
              </Typography>

              <Typography
                variant="h6"
                sx={{ fontWeight: "bold", fontSize: 24, pt: 10 }}
              >
                Password
              </Typography>
              <Box
                sx={{
                  width: "120%",
                  height: "3px",
                  backgroundColor: "#ccc",
                  mt: 1,
                }}
              />

              <form>
                <div className="p-6">
                  <>
                    <div className="mb-4">
                      <label
                        className="text-gray-600 text-sm"
                        style={{ fontSize: 16 }}
                      >
                        Email address
                      </label>
                      <input
                        type="email"
                        value={email}
                        className="login-input"
                        placeholder="Enter Your Email address"
                        style={{ fontSize: 16 }}
                        readOnly
                      />
                    </div>
                    <div className="mb-4">
                      <label
                        className="text-gray-600 text-sm"
                        style={{ fontSize: 16 }}
                      >
                        New Password
                      </label>
                      <input
                        label="New Password"
                        type="password"
                        value={new_password}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="login-input"
                        placeholder="Enter Your New Password"
                        style={{ fontSize: 16 }}
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label
                        className="text-gray-600 text-sm"
                        style={{ fontSize: 16 }}
                      >
                        Confirm New Password
                      </label>
                      <input
                        label="Confirm New Password"
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="login-input"
                        placeholder="Confirm Your New Password"
                        style={{ fontSize: 16 }}
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label
                        className="text-gray-600 text-sm"
                        style={{ fontSize: 16 }}
                      >
                        TOTP
                      </label>
                      <input
                        label="TOTP"
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="login-input"
                        placeholder="Enter Your OTP"
                        style={{ fontSize: 16 }}
                        required
                      />
                    </div>
                    {error && <p className="error">{error}</p>}
                    {message && <p className="message">{message}</p>}
                    <button
                      onClick={handleChangePasswordVerification}
                      className="twoFA-btn"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Save" : "Save"}
                    </button>
                  </>
                </div>
              </form>
            </Box>
          )}
        </Box>
      </Container>
    </AppTheme>
  );
}

// Tab button style
const tabButtonStyle = (isSelected) => ({
  textAlign: "left",
  fontSize: "1.2rem",
  fontWeight: isSelected ? "bold" : "normal",
  color: isSelected ? "#1976D2" : "#333",
  backgroundColor: isSelected ? "#E3F2FD" : "transparent",
  mb: 1,
  "&:hover": {
    backgroundColor: "#BBDEFB",
  },
});

export default MyAccount;
