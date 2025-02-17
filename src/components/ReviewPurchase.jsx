import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppAppBar from "./appbar";
import AppTheme from "../shared-theme/AppTheme";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";

function ReviewPurchase() {
  const location = useLocation();
  const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
  // Extract bidAmount and listing from location.state or fallback to sessionStorage
  const bidAmount = location.state?.bidAmount || sessionStorage.getItem("bidAmount");
  const listing = location.state?.listing || JSON.parse(sessionStorage.getItem("listing"));
  //console.log("Stored listing:", storedListing);
  // Log bidAmount and listing for debugging
  console.log("ReviewPurchase Debugging - bidAmount:", bidAmount);
  
  //console.log("ReviewPurchase Debugging - listing:", listing);
  const [newBidAmount, setNewBidAmount] = useState(bidAmount);
  const [error, setError] = useState(null);
  const [currentBid, setCurrentBid] = useState(0); // Store the current highest bid

  const token = sessionStorage.getItem("token"); // Retrieve token
  const listingId = listing?.id; // Extract listing 
  console.log("ReviewPurchase Debugging - listing ID:", listingId);
  //snackbar 
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success'); // 'success', 'error'
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
};
  // Fetch the current highest bid from the API
  const fetchInitialBids = async () => {
    try {
      const response = await fetch("https://fyp-37p-api-a16b479cb42b.herokuapp.com/bid/get_all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ listing_id: listingId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong");
      } else if (data.successful) {
        // Find the current highest bid
        const highestBid = Math.max(...data.bids.map((bid) => bid.amount));
        setCurrentBid(highestBid); // Update the state with the highest bid
      } else {
        setError(data.error || "Unknown error occurred");
      }
    } catch (err) {
      setError("Failed to fetch bids. Please try again.");
    }
  };

  const handleEditBid = () => {
    if (!listing) {
      console.error("Listing data is undefined or null!");
      return;
    }
  
    console.log("Navigating to /place-bid with listing:", listing);
    navigate("/place-bid", {
      state: {
        listing, // Pass the listing object directly
      },
    });
  };
  
  const handleSubmitBid = async (e) => {
    e.preventDefault(); // ✅ Prevent default form submission
    console.log("🚀 Form submission started!");
  
    // ✅ Validate bid amount
    if (!newBidAmount || parseFloat(newBidAmount) <= 0) {
      setSnackbarSeverity("error");
      setSnackbarMessage("❌ Please enter a valid bid amount.");
      setOpenSnackbar(true);
      return;
    }
  
    console.log(`🔎 Auction strategy: ${listing.auction_strategy}`);
  
    try {
      let bidApiUrl = "";
      
      if (listing.auction_strategy === "English") {
        // ✅ Ensure bid is higher than the current bid
        if (parseFloat(newBidAmount) <= currentBid) {
          setSnackbarSeverity("error");
          setSnackbarMessage(`❌ Your bid must be greater than the current highest bid $${currentBid}`);
          setOpenSnackbar(true);
          return;
        }
        console.log("🔗 Sending English bid...");
        bidApiUrl = "https://fyp-37p-api-a16b479cb42b.herokuapp.com/bid/make";
      } else if (listing.auction_strategy === "Dutch") {
        console.log("🔗 Sending Dutch bid...");
        bidApiUrl = "https://fyp-37p-api-a16b479cb42b.herokuapp.com/bid/make_dutch_bid";
      } else if (listing.auction_strategy === "Sealed-Bid") {
        console.log("🔗 Sending Sealed bid...");
        bidApiUrl = "https://fyp-37p-api-a16b479cb42b.herokuapp.com/bid/make_sealed_bid";
      } else {
        setSnackbarSeverity("error");
        setSnackbarMessage("❌ Invalid auction strategy.");
        setOpenSnackbar(true);
        return;
      }
  
      //  Send API request to place a bid
      const response = await fetch(bidApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          listing_id: listingId,
          amount: parseFloat(newBidAmount).toFixed(2),
        }),
      });
  
      const data = await response.json();
      console.log("✅ API Response:", data);
  
      //  Handle success case
      if (data.successful) {
        setSnackbarSeverity("success");
        setSnackbarMessage("🎉 Bid placed successfully! Redirecting to payment...");
        setOpenSnackbar(true);
  
        sessionStorage.setItem("listing", JSON.stringify(listing));
        sessionStorage.setItem("bidAmount", newBidAmount);
  
        // Delay PayPal redirection slightly for better user experience
        setTimeout(() => {
          handleConfirmBid(); // Call PayPal redirection
        }, 2000);
  
      } else {
        if (data.error) {
          console.error("⚠️ API Error:", data.error);
          setSnackbarSeverity("error");
  
          if (typeof data.error === "string" && data.error.includes("SELLER CANNOT BID.")) {
            setSnackbarMessage("❌ Sellers are not allowed to bid on their own listings.");
          } else {
            setSnackbarMessage(data.error || "❌ Failed to place bid.");
          }
  
          setOpenSnackbar(true);
  
          // Redirect back after showing error message
          setTimeout(() => {
            navigate(-1);
          }, 3000);
        }
      }
    } catch (error) {
      console.error("❌ API Request Failed:", error);
      setSnackbarSeverity("error");
      setSnackbarMessage("❌ Failed to send bid. Please try again.");
      setOpenSnackbar(true);
    }
  };
  
  

const handleConfirmBid = async () => {
  setIsProcessing(true);

  try {
    console.log("🚀 Initiating PayPal Payment...");
    
    const requestBody = {
      amount: bidAmount, //  The bid amount
      listing_id: listing.id, //  The auction listing ID
    };

    const response = await fetch("https://fyp-37p-api-a16b479cb42b.herokuapp.com/bid/init_payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    console.log(" PayPal Response:", data);

    if (data.successful && data.order && Array.isArray(data.order.links)) {
      const approvalLink = data.order.links.find(link => link.rel === "payer-action");

      if (approvalLink && approvalLink.href) {
        console.log(`🔗 Redirecting to PayPal: ${approvalLink.href}`);
        setSnackbarSeverity("success");
        setSnackbarMessage("✅ Redirecting to PayPal...");
        setOpenSnackbar(true);

        setTimeout(() => {
          window.location.href = approvalLink.href; // ✅ Redirect user to PayPal after a brief delay
        }, 2000);
      } else {
        throw new Error("❌ No approval link found in PayPal response.");
      }
    } else {
      setSnackbarSeverity("error");
      setSnackbarMessage(`❌ Payment failed: ${data.error || "Unknown error"}`);
      setOpenSnackbar(true);
    }
  } catch (error) {
    console.error("❌ Error processing payment:", error);
    setSnackbarSeverity("error");
    setSnackbarMessage("❌ An error occurred while processing your payment.");
    setOpenSnackbar(true);
  } finally {
    setIsProcessing(false);
  }
};

  useEffect(() => {
    if (listingId) {
      fetchInitialBids();
    }
  }, [listingId]);

  // Early return for invalid listing data
  if (!listing) {
    return <div style={{ textAlign: "center", color: "red" }}>Error: Invalid listing data</div>;
  }

  return (
    
    <AppTheme>
      <CssBaseline enableColorScheme />
      <AppAppBar />
      <div
        style={{
          backgroundColor: "#ffffff",
          color: "#000",
          minHeight: "70vh",
          padding: "100px 20px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            maxWidth: "800px",
            width: "100%",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            borderRadius: "10px",
            background: "#fff",
            padding: "20px",
          }}
        >
          {/* Listing Details */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
           <Box
              component="img"
              src={listing?.image_urls?.length > 0 ? listing.image_urls[0] : "/placeholder.jpg"}
              alt={listing?.title || "Listing Image"}
              sx={{
                width: "100%",
                maxWidth: "300px",
                borderRadius: "8px",
                objectFit: "cover",
                border: "2px solid grey",
              }}
            />
            <h2 style={{ fontSize: "1.8rem", margin: "0", textAlign: "center" }}>
              {listing?.title}
            </h2>
          </div>

          {/* Bid Details */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "20px",
            }}
          >
            <div>
              <label style={labelStyle}>Item Description</label>
              <textarea
                value={listing?.description}
                disabled
                style={{ ...inputStyle, height: "100px" }}
              />
            </div>
          </div>
          <label style={labelStyle}>Bid Amount</label>
          <input
            type="number"
            value={newBidAmount}
            onChange={(e) => setNewBidAmount(e.target.value)}
            placeholder="Enter your bid amount"
            style={inputStyle}
            disabled
            required
          />

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "20px",
            }}
          >
           {/* <button  style={cancelButtonStyle}
            onClick={handleEditBid} // Edit bid action
            >
              Edit Bid
            </button> */}
            <div style={{ marginRight: "10px", marginTop: "10px" }}>
            <form onSubmit={handleSubmitBid}>
            <button
              style={{
                padding: "5px 5px",
                border: "none",
                borderRadius: "5px",
                background: "linear-gradient(to right, #6a11cb, #2575fc)",
                color: "#fff",
                fontSize: "13px",
                cursor: "pointer",
              }}
              type="submit"
              disabled={isProcessing} // Prevent multiple clicks
            >
              Confirm Bid
            </button>
          </form>
         </div>
        </div>
       </div>
      </div>
       {/*  Snackbar Notification */}
       <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}  // Duration in ms before Snackbar auto closes
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MuiAlert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: '100%', fontSize: '1.50rem' }}
        >
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
    </AppTheme>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: "5px",
  fontWeight: "bold",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "5px",
  border: "1px solid #ddd",
  backgroundColor: "#f9f9f9",
  fontSize: "1rem",
};

const cancelButtonStyle = {
  padding: "10px 20px",
  border: "none",
  borderRadius: "5px",
  backgroundColor: "#f5f5f5",
  color: "#333",
  cursor: "pointer",
};

const placeBidButtonStyle = {
  padding: "10px 20px",
  border: "none",
  borderRadius: "5px",
  background: "linear-gradient(to right, #6a11cb, #2575fc)",
  color: "#fff",
  cursor: "pointer",
};

export default ReviewPurchase;
