import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppAppBar from "./appbar";
import AppTheme from "../shared-theme/AppTheme";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";

function ReviewPurchase() {
  const location = useLocation();
  const navigate = useNavigate();

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
  // Fetch the current highest bid from the API
  const fetchInitialBids = async () => {
    try {
      const response = await fetch("/api2/bid/get_all", {
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
    e.preventDefault();
    console.log("🚀 Form submission started!");
  
    console.log("📝 new bid amount:", newBidAmount);
    console.log("📌 Listing ID:", listingId);
  
    if (!newBidAmount || parseFloat(newBidAmount) <= currentBid) {
      console.warn(`❌ Your bid must be greater than $${currentBid}`);
      alert(`Your bid must be greater than the current highest bid $${currentBid}`);
      return;
    }
  
    try {
      console.log("🔗 Sending bid to API...");
      const response = await fetch("/api2/bid/make", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          listing_id: listingId,
          amount: newBidAmount,
        }),
      });
  
      const data = await response.json();
      console.log("✅ API Response:", data);
  
      if (data.successful) {
        console.log("🎉 Bid placed successfully!");
        alert("Bid placed successfully!");
        navigate("/bidding-page", {
          state: {
            listing,
            bidAmount: newBidAmount,
          },
        });
      } else {
        console.error("⚠️ API Error:", data.error);
        setError(data.error || "Failed to place bid.");
      }
    } catch (error) {
      console.error("❌ API Request Failed:", error);
      setError("Failed to send bid. Please try again.");
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
                >
                  Confirm Bid
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
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
