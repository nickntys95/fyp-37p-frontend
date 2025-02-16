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

  //  Extract PayPal parameters
  const orderId = searchParams.get("token");  // PayPal Transaction Token
  const payerId = searchParams.get("PayerID"); //  PayPal Payer ID
  const bidAmount = sessionStorage.getItem("bidAmount");
  const listingId = sessionStorage.getItem("listing_id");  // Ensure we have listing_id stored

  useEffect(() => {
    console.log(" Extracted Order ID:", orderId);
    console.log(" Extracted Payer ID:", payerId);
    console.log(" Extracted Listing ID:", listingId);

    if (orderId) {
      confirmPayment(orderId, payerId);
    }

    if (listingId) {
      fetchListingsAndFindItem(listingId);
    }
  }, [orderId, payerId, listingId]);

  // Confirm payment via API
  const confirmPayment = async (orderId, payerId) => {
    try {
      const response = await fetch(
        `https://fyp-37p-api-a16b479cb42b.herokuapp.com/bid/confirm_payment/?token=${orderId}&payer_id=${payerId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();
      setPaymentStatus(data.successful ? " Payment Successful 🎉" : `❌ Payment Failed: ${data.error}`);
    } catch (error) {
      setPaymentStatus("❌ An error occurred while confirming your payment.");
    } finally {
      setIsProcessing(false);
    }
  };

  //  Fetch all listings and find the specific one
  const fetchListingsAndFindItem = async (listingId) => {
    try {
      const response = await fetch(
        `https://fyp-37p-api-a16b479cb42b.herokuapp.com/listing/get_all`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();
      if (data.successful && Array.isArray(data.listings)) {
        //  Find the listing by ID
        const foundListing = data.listings.find(listing => listing.id === parseInt(listingId));
        if (foundListing) {
          setListing(foundListing);
        } else {
          console.error("❌ Listing not found in the response.");
        }
      } else {
        console.error("❌ Failed to fetch listings.");
      }
    } catch (error) {
      console.error("❌ Error fetching listings:", error);
    }
  };

  return (
    <AppTheme>
      <CssBaseline enableColorScheme />
      <AppAppBar />
      <Box sx={{ padding: "100px 20px", textAlign: "center" }}>
        <h2>Payment Confirmation</h2>
        {listing ? (
          <>
            <img src={listing.image_urls?.[0] || "/placeholder.jpg"} alt="Listing Image" width="300px" />
            <p><strong>Item:</strong> {listing.title}</p>
          </>
        ) : (
          <p>Loading listing details...</p>
        )}
        <p><strong>Payment:</strong> ${bidAmount}</p>
        <p>{isProcessing ? "Processing payment..." : paymentStatus}</p>
        <button onClick={() => navigate("/home")} className="btn btn-primary mt-3">Return Home</button>
      </Box>
    </AppTheme>
  );
}

export default ConfirmationPage;
