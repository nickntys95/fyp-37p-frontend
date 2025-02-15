import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import AppAppBar from "./appbar";
import AppTheme from "../shared-theme/AppTheme";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";

function ConfirmationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);

  const orderId = searchParams.get("token"); // PayPal order ID
  const bidAmount = sessionStorage.getItem("bidAmount");
  const listing = JSON.parse(sessionStorage.getItem("listing")) || {};

  useEffect(() => {
    if (orderId) {
      confirmPayment(orderId);
    }
  }, [orderId]);

  const confirmPayment = async (orderId) => {
    try {
      const response = await fetch(
        `https://fyp-37p-api-a16b479cb42b.herokuapp.com/bid/confirm_payment/${orderId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();
      setPaymentStatus(
        data.successful
          ? "Payment Successful 🎉"
          : `Payment Failed ❌: ${data.error}`
      );
    } catch (error) {
      setPaymentStatus("An error occurred while confirming your payment.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AppTheme>
      <CssBaseline enableColorScheme />
      <AppAppBar />
      <Box sx={{ padding: "100px 20px", textAlign: "center" }}>
        <h2>Payment Confirmation</h2>
        <img
          src={listing.image_urls?.[0] || "/placeholder.jpg"}
          alt="Listing Image"
          width="300px"
        />
        <p>
          <strong>Item:</strong> {listing.title}
        </p>
        <p>
          <strong>Payment:</strong> ${bidAmount}
        </p>
        <p>{isProcessing ? "Processing payment..." : paymentStatus}</p>
        <button
          onClick={() => navigate("/home")}
          className="btn btn-primary mt-3"
        >
          Return Home
        </button>
      </Box>
    </AppTheme>
  );
}

export default ConfirmationPage;
