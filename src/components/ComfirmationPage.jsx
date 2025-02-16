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
  const [listing, setListing] = useState(null);
  const token = sessionStorage.getItem("token") || "";

  // Extract PayPal parameters
  const orderId = searchParams.get("token"); // PayPal Transaction Token
  const payerId = searchParams.get("PayerID"); // PayPal Payer ID

  // Retrieve stored session values
  const bidAmount = sessionStorage.getItem("bidAmount");
  const listingId = sessionStorage.getItem("listingId"); // Ensure listingId is stored when bidding

  useEffect(() => {
    console.log("Extracted Order ID:", orderId);
    console.log("Extracted Payer ID:", payerId);
    console.log("Extracted Listing ID:", listingId);

    if (orderId && payerId) {
      confirmPayment(orderId, payerId);
    } else {
      setPaymentStatus("❌ Invalid payment details.");
      setIsProcessing(false);
    }

    if (listingId) {
      fetchListingsAndFindItem(listingId);
    }
  }, [orderId, payerId, listingId]);

  //  Fetch all listings and find the specific one
  const fetchListingsAndFindItem = async (id) => {
    try {
      console.log("📡 Fetching all listings...");
      const response = await fetch("https://fyp-37p-api-a16b479cb42b.herokuapp.com/listing/get_all", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      console.log(" Listings Data:", data);

      if (Array.isArray(data)) {
        const matchedListing = data.find((item) => item.id === id);
        if (matchedListing) {
          setListing(matchedListing);
        } else {
          console.warn("❌ Listing not found.");
        }
      }
    } catch (error) {
      console.error(" Error fetching listing:", error);
    }
  };

  //  Confirm payment
  const confirmPayment = async (orderId, payerId) => {
    try {
      console.log(" Sending payment confirmation request...");

      const response = await fetch(
        `https://fyp-37p-api-a16b479cb42b.herokuapp.com/bid/confirm_payment/?token=${orderId}&payer_id=${payerId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      setPaymentStatus(data.successful ? "✅ Payment Successful 🎉" : `❌ Payment Failed: ${data.error}`);
    } catch (error) {
      console.error(" Error confirming payment:", error);
      setPaymentStatus("❌ An error occurred while confirming your payment.");
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

        {/*  Show listing image */}
        {listing ? (
          <>
            <img src={listing.image_urls?.[0] || "/placeholder.jpg"} alt="Listing Image" width="300px" />
            <p><strong>Item:</strong> {listing.title}</p>
          </>
        ) : (
          <p>Loading item details...</p>
        )}

        <p><strong>Payment:</strong> ${bidAmount}</p>
        <p>{isProcessing ? "Processing payment..." : paymentStatus}</p>

        <button onClick={() => navigate("/home")} className="btn btn-primary mt-3">Return Home</button>
      </Box>
    </AppTheme>
  );
}

export default ConfirmationPage;
