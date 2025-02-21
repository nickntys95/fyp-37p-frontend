import React, { useEffect, useState } from "react";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import AppAppBar from "./appbar";
import AppTheme from "../shared-theme/AppTheme";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";

function ConfirmationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const location = useLocation(); 
  
  // ✅ Retrieve data from sessionStorage
  const fromCheckout = sessionStorage.getItem("fromCheckout") === "true";
  const orderId = searchParams.get("token");
  const payerId = searchParams.get("PayerID");
  const bidAmount = sessionStorage.getItem("bidAmount") || "N/A";


  // ✅ Retrieve dynamic listing from location.state, fallback to sessionStorage
  const locationListing = location.state?.listing || null;
  const storedListing = sessionStorage.getItem("listing");
  const listing = locationListing || (storedListing ? JSON.parse(storedListing) : {});

  // ✅ Snackbar State for Notifications
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");

  useEffect(() => {
    console.log(" Extracted Order ID:", orderId);
    console.log(" Extracted Payer ID:", payerId);
    console.log(" Stored Listing:", listing);
    console.log(" Bid Amount:", bidAmount);
    console.log(" From Checkout:", fromCheckout);
    console.log(" Extracted Auction Strategy:", listing?.auction_strategy || "Not Found");

  
if (orderId && payerId) {
      confirmPayment(orderId, payerId);
    } else {
      setPaymentStatus("❌ Invalid payment details.");
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

      if (data.successful) {
        setPaymentStatus("✅ Payment Successful");
        setSnackbarSeverity("success");
        setSnackbarMessage("✅ Payment confirmed successfully!");
      } else {
        setPaymentStatus(`❌ Payment Failed: ${data.error}`);
        setSnackbarSeverity("error");
        setSnackbarMessage(`❌ Payment Failed: ${data.error}`);
      }
      setOpenSnackbar(true);

      // ✅ Automatically Redirect Based on Auction Type
      if (data.successful) {
        setTimeout(() => {
          if (listing.auction_strategy === "English") {
            navigate("/bidding-page");
          } else if (listing.auction_strategy === "Sealed-Bid") {
            console.log("✅ Sealed-bid auction detected. No real-time bidding needed.");
          } else if (listing.auction_strategy === "Dutch") {
            console.log("✅ Dutch auction detected. Redirecting to listing page...");
            navigate("/home");
          } else {
            console.log("✅ Unknown auction type. Defaulting to Home.");
            navigate("/home");
          }
        }, 8000); // 5-second delay before redirecting
      }
    } catch (error) {
      console.error("❌ Error confirming payment:", error);
      setPaymentStatus("❌ An error occurred while confirming your payment.");
      setSnackbarSeverity("error");
      setSnackbarMessage("❌ An error occurred while confirming payment.");
      setOpenSnackbar(true);
    } finally {
      setIsProcessing(false);
    }
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
        <p>
          <strong>Payment:</strong> $
          {fromCheckout ? listing.buy_now : bidAmount !== "N/A" ? bidAmount : listing.buy_now}
        </p>
        <p>{isProcessing ? "Processing payment..." : paymentStatus}</p>
        {/*  button based on auction type */}
        <button
          onClick={() => {
            const auctionStrategy = listing.auction_strategy?.toLowerCase(); 
            const targetPage = auctionStrategy === "english" ? "/bidding-page" : "/home"; 
            navigate(targetPage);
          }}
          className="btn btn-primary mt-3"
          disabled={isProcessing}  // Prevents clicking while processing
        >
          {listing.auction_strategy?.toLowerCase() === "english"
            ? "Proceed to Bidding Page"
            : "Return Home"}
        </button>
      </Box>

      {/* ✅ Snackbar Notification */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000} // Duration in ms before Snackbar auto closes
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <MuiAlert
          onClose={() => setOpenSnackbar(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%", fontSize: "1.2rem" }}
        >
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
    </AppTheme>
  );
}

export default ConfirmationPage;
