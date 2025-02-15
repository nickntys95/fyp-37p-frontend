import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppAppBar from "./appbar";
import AppTheme from "../shared-theme/AppTheme";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";

function ReviewPurchase() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  // Extract bidAmount and listing from location.state or fallback to sessionStorage
  const bidAmount =
    location.state?.bidAmount || sessionStorage.getItem("bidAmount");
  const listing =
    location.state?.listing || JSON.parse(sessionStorage.getItem("listing"));
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
      const response = await fetch(
        "https://fyp-37p-api-a16b479cb42b.herokuapp.com/bid/get_all",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ listing_id: listingId }),
        }
      );

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

    console.log("📝 New bid amount:", newBidAmount);
    console.log("📌 Listing ID:", listingId);

    if (!newBidAmount || parseFloat(newBidAmount) <= 0) {
      console.warn("❌ Invalid bid amount.");
      alert("Please enter a valid bid amount.");
      return;
    }

    const auctionStrategy = listing.auction_strategy.toLowerCase();
    console.log(`🔎 Auction strategy: ${auctionStrategy}`);

    if (auctionStrategy === "english") {
      if (parseFloat(newBidAmount) <= currentBid) {
        console.warn(`❌ Your bid must be greater than $${currentBid}`);
        alert(
          `Your bid must be greater than the current highest bid $${currentBid}`
        );
        return;
      }

      console.log("🔗 Sending English bid...");
      try {
        const response = await fetch(
          "https://fyp-37p-api-a16b479cb42b.herokuapp.com/bid/make",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              listing_id: listingId,
              amount: newBidAmount,
            }),
          }
        );

        const data = await response.json();
        console.log("✅ API Response:", data);

        if (data.successful) {
          console.log("🎉 Bid placed successfully!");
          alert("Bid placed successfully!");
          navigate("/home"); // Redirect to home page});
        } else {
          console.error("⚠️ API Error:", data.error);
          setError(data.error || "Failed to place bid.");
        }
      } catch (error) {
        console.error("❌ API Request Failed:", error);
        setError("Failed to send bid. Please try again.");
      }
    } else if (auctionStrategy === "dutch") {
      try {
        const response = await fetch(
          "https://fyp-37p-api-a16b479cb42b.herokuapp.com/bid/make_dutch_bid",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              listing_id: listingId,
              amount: parseFloat(newBidAmount).toFixed(2), // Use the current auction price
            }),
          }
        );

        const data = await response.json();
        console.log("✅ API Response:", data);

        if (data.successful) {
          console.log("🎉 Dutch bid placed successfully!");
          alert(`Dutch bid placed successfully at $${newBidAmount}!`);
          navigate("/bidding-page", {
            state: { listing, bidAmount: newBidAmount },
          });
        } else {
          console.error("⚠️ API Error:", data.error);
          setError(data.error || "Failed to place Dutch bid.");
        }
      } catch (error) {
        console.error("❌ API Request Failed:", error);
        setError("Failed to send bid. Please try again.");
      }
    } else if (auctionStrategy === "sealed-bid") {
      console.log("🔗 Sending Sealed bid...");
      try {
        const response = await fetch(
          "https://fyp-37p-api-a16b479cb42b.herokuapp.com/bid/make_sealed_bid",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              listing_id: listingId,
              amount: parseFloat(newBidAmount).toFixed(2),
            }),
          }
        );

        const data = await response.json();
        console.log("✅ API Response:", data);

        if (data.successful) {
          console.log("🎉 Sealed bid placed successfully!");
          alert("Sealed bid placed successfully!");
          navigate("/home", { state: { listing, bidAmount: newBidAmount } });
        } else {
          console.error("⚠️ API Error:", data.error);
          setError(data.error || "Failed to place bid.");
        }
      } catch (error) {
        console.error("❌ API Request Failed:", error);
        setError("Failed to send bid. Please try again.");
      }
    } else {
      console.error("❌ Unsupported auction strategy:", auctionStrategy);
      setError("Invalid auction strategy.");
    }
  };

  const handleConfirmBid = async () => {
    setIsProcessing(true);

    try {
      console.log("🚀 Initiating PayPal Payment...");

      const requestBody = {
        amount: bidAmount, // ✅ The bid amount
        listing_id: listing.id, // ✅ The auction listing ID
      };

      const response = await fetch(
        "https://fyp-37p-api-a16b479cb42b.herokuapp.com/bid/init_payment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();
      console.log("✅ PayPal Response:", data);

      if (data.successful && data.order && Array.isArray(data.order.links)) {
        const approvalLink = data.order.links.find(
          (link) => link.rel === "payer-action"
        );

        if (approvalLink && approvalLink.href) {
          console.log(`🔗 Redirecting to PayPal: ${approvalLink.href}`);
          window.location.href = approvalLink.href; // ✅ Redirect user to PayPal
        } else {
          throw new Error("❌ No approval link found in PayPal response.");
        }
      } else {
        alert(`❌ Payment failed: ${data.error}`);
      }
    } catch (error) {
      console.error("❌ Error processing payment:", error);
      alert("An error occurred while processing your payment.");
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
    return (
      <div style={{ textAlign: "center", color: "red" }}>
        Error: Invalid listing data
      </div>
    );
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
              src={
                listing?.image_urls?.length > 0
                  ? listing.image_urls[0]
                  : "/placeholder.jpg"
              }
              alt={listing?.title || "Listing Image"}
              sx={{
                width: "100%",
                maxWidth: "300px",
                borderRadius: "8px",
                objectFit: "cover",
                border: "2px solid grey",
              }}
            />
            <h2
              style={{ fontSize: "1.8rem", margin: "0", textAlign: "center" }}
            >
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
                  onClick={handleConfirmBid} // ✅ Trigger PayPal redirection
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
