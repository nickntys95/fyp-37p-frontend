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

  // ✅ Detect if user is from CheckoutPage (retrieved from sessionStorage)
  const fromCheckout = sessionStorage.getItem("fromCheckout") === "true";

  //  Extract PayPal parameters
  const orderId = searchParams.get("token"); // PayPal Transaction Token
  const payerId = searchParams.get("PayerID"); // PayPal Payer ID

  //  Retrieve stored session values
  const bidAmount = sessionStorage.getItem("bidAmount") || "N/A";
  const storedListing = sessionStorage.getItem("listing");
  const listing = storedListing ? JSON.parse(storedListing) : {};

  useEffect(() => {
    console.log(" Extracted Order ID:", orderId);
    console.log(" Extracted Payer ID:", payerId);
    console.log(" Stored Listing:", listing);
    console.log(" Bid Amount:", bidAmount);
    console.log(" From Checkout:", fromCheckout);

    if (orderId && payerId) {
      confirmPayment(orderId, payerId);
    } else {
      setPaymentStatus(" Invalid payment details.");
      setIsProcessing(false);
    }
  }, [orderId, payerId]);

  const confirmPayment = async (orderId, payerId) => {
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
      console.log("✅ API Response:", data);

      setPaymentStatus(data.successful ? " Payment Successful " : ` Payment Failed: ${data.error}`);

      //  Automatically Redirect Based on Auction Type
    if (data.successful) {
      if (listing.auction_strategy?.toLowerCase() === "english" ) {
        setTimeout(() => {
          navigate("/bidding-page");
        }, 2000); // 2-second delay before redirecting
      } else if (listing.auction_strategy?.toLowerCase() === "sealed-bid") {
        console.log(" Sealed-bid auction detected. No real-time bidding needed.");
        // Stay on the confirmation page and only allow returning home
      } else if (listing.auction_strategy?.toLowerCase() === "dutch") {
        console.log(" Dutch auction detected. Redirecting to listing page...");
        setTimeout(() => {
          navigate("/home");
        }, 2000); // Redirect home after 2 seconds
      } else {
        console.log(" Unknown auction type. Defaulting to Home.");
        setTimeout(() => {
          navigate("/home");
        }, 2000);
      }
    }
  } catch (error) {
    console.error(" Error confirming payment:", error);
    setPaymentStatus(" An error occurred while confirming your payment.");

  };

  return (
    <AppTheme>
      <CssBaseline enableColorScheme />
      <AppAppBar />
      <Box sx={{ padding: "100px 20px", textAlign: "center" }}>
        <h2>PAYMENT CONFIRMATION</h2>
        <img
          src={listing.image_urls?.[0] || "/placeholder.jpg"}
          alt="Listing Image"
          width="300px"
          onError={(e) => (e.target.src = "/placeholder.jpg")} // ✅ Prevents broken image
        />
        <p><strong>Item:</strong> {listing.title || "No Item Title"}</p>
        <p><strong>Payment:</strong> ${bidAmount}</p>
        <p>{isProcessing ? "Processing payment..." : paymentStatus}</p>

        {/* ✅ Show "Return Home" if user came from Checkout, otherwise normal behavior */}
        <button
          onClick={() => navigate("/home")}
          className="btn btn-primary mt-3"
          disabled={isProcessing} // Prevents clicking while loading
        >
          Return Home
        </button>
      </Box>
    </AppTheme>
  );
 }
}
export default ConfirmationPage;
