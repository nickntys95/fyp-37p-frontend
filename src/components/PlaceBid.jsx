import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppAppBar from "./appbar";
import AppTheme from "../shared-theme/AppTheme";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";

function PlaceBid() {
  const [bidAmount, setBidAmount] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [isBidValid, setIsBidValid] = useState(false); // To control button state
  const location = useLocation();
  const navigate = useNavigate();
  const [currentBids, setCurrentBids] = useState({}); // To store the current bid for each listing
  const token = sessionStorage.getItem("token") || "";
  const [listings, setListings] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(0);

  // Check if the bid has started
  const [isBidStarted, setIsBidStarted] = useState(false);
  // Extracting listing data from Link's state
  const listing = location.state || {};
  console.log(listing);
  // Parse the minimum bid and starting price
  const minimumBid = parseFloat(listing.minimum_bid) || 0;
  //fetch listing
  const fetchListings = async () => {
    try {
      const response = await fetch(
        "https://fyp-37p-api-a16b479cb42b.herokuapp.com/listing/get_all",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch listings");
      }

      const data = await response.json();
      setListings(data); // Store fetched listings
    } catch (error) {
      console.error("Error fetching listings:", error);
    }
  };
  // Fetch listings when the component mounts
  useEffect(() => {
    fetchListings();
  }, []);
  //fetch currentBid
  const fetchCurrentBid = async (listingId) => {
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

      if (response.ok && data.successful) {
        const highestBid = Math.max(...data.bids.map((bid) => bid.amount), 0);
        setCurrentBids((prev) => ({ ...prev, [listingId]: highestBid }));
      }
    } catch (error) {
      console.error("Error fetching current bid:", error);
    }
  };

  useEffect(() => {
    if (listings.length > 0) {
      listings.forEach((listing) => {
        fetchCurrentBid(listing.id);
      });
    }
  }, [listings]);

  useEffect(() => {
    if (listing.start_at) {
      const startTime = new Date(listing.start_at).getTime();
      const currentTime = new Date().getTime();
      const adjustedCurrentTime = currentTime + (8 * 60 * 60 * 1000);
      console.log("adjustedCurrentTime:", adjustedCurrentTime);
      console.log("startTime:", startTime);
      setIsBidStarted(adjustedCurrentTime >= startTime);
    }
  }, [listing.start_at]);
  // Initialize the current price for Dutch auction
  useEffect(() => {
    if (listing && listing.auction_strategy?.toLowerCase() === "dutch") {
      const startingPrice = parseFloat(listing.buy_now);
      const startTime = new Date(listing.start_at).getTime();
      const endTime = new Date(listing.end_at).getTime();
      const totalDuration = (endTime - startTime) / 1000; // Convert to seconds

      const updatePrice = () => {
        const now = new Date().getTime();

        // Handle invalid auction times
        if (startTime >= endTime) {
          console.error(
            "Invalid auction duration: start_at must be before end_at"
          );
          setCurrentPrice(startingPrice);
          return;
        }

        // Before auction starts, set price to initial buy_now
        if (now < startTime) {
          setCurrentPrice(startingPrice);
          return;
        }

        // If auction has ended, set price to 0
        if (now >= endTime) {
          setCurrentPrice(0);
          return;
        }

        // Calculate elapsed time
        const elapsedTime = (now - startTime) / 1000; // Seconds

        // Price reduction formula
        let newPrice = startingPrice * (1 - elapsedTime / totalDuration);

        // Ensure price does not go below 0
        setCurrentPrice(Math.max(newPrice, 0));
      };

      updatePrice(); // Initial call to set the price
      const interval = setInterval(updatePrice, 1000); // Update every second

      return () => clearInterval(interval); // Cleanup interval on unmount
    }
  }, [listing]);

  const handleBidChange = (e) => {
    const bid = parseFloat(e.target.value);
    setBidAmount(e.target.value);

    // Get the current bid or fallback to the minimum bid
    const currentBid =
      listing.id in currentBids ? currentBids[listing.id] : listing.minimum_bid;

    // Get minimum increment from the listing
    const minimumIncrement = parseFloat(listing.minimum_increment) || 10; // Default to 10 if not provided

    // Validate the bid based on the auction strategy
    if (listing.auction_strategy === "English") {
      if (isNaN(bid) || bid < currentBid + minimumIncrement) {
        setErrorMessage(
          `Your bid must be at least $${(currentBid + minimumIncrement).toFixed(
            2
          )}.`
        );
        setIsBidValid(false);
      } else {
        setErrorMessage("");
        setIsBidValid(true);
      }
    } else if (listing.auction_strategy === "Dutch") {
      if (isNaN(bid) || bid !== currentPrice) {
        setErrorMessage(
          `For Dutch auctions, accept the current price of $${currentPrice.toFixed(
            2
          )}.`
        );
        setIsBidValid(false);
      } else {
        setErrorMessage("");
        setIsBidValid(true);
      }
    } else if (listing.auction_strategy === "Sealed-Bid") {
      if (isNaN(bid) || bid < listing.minimum_bid) {
        setErrorMessage(
          `Your bid must be at least $${listing.minimum_bid.toFixed(2)}.`
        );
        setIsBidValid(false);
      } else {
        setErrorMessage("");
        setIsBidValid(true);
      }
    }
  };

  const handlePlaceBid = () => {
    let bidValue = parseFloat(bidAmount);

    // Force bidAmount to match currentPrice in Dutch auctions
    if (listing.auction_strategy.toLowerCase() === "dutch") {
      bidValue = currentPrice;
    }

    console.log(
      `✅ Placing bid: ${bidValue} for auction type: ${listing.auction_strategy}`
    );

    // ✅ Parse structured data for ReviewPurchase page
    const bidData = {
      bidAmount: bidValue.toFixed(2),
      listing: {
        id: listing.id,
        title: listing.title,
        description: listing.description,
        auction_strategy: listing.auction_strategy,
        minimum_bid: listing.minimum_bid,
        buy_now: listing.buy_now,
        image_urls: listing.image_urls || [],
        start_at: listing.start_at,
        end_at: listing.end_at,
      },
    };

    // ✅ Store in sessionStorage for persistence
    sessionStorage.setItem("bidData", JSON.stringify(bidData));

    // ✅ Navigate to ReviewPurchase page with state
    navigate("/review-purchase", { state: bidData });
  };

  return (
    <AppTheme>
      <CssBaseline enableColorScheme />
      <AppAppBar />
      <div
        style={{
          backgroundColor: "#ffffff",
          color: "#000",
          minHeight: "100vh",
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
          {/* Listing Image and Details */}
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
                listing.image_urls?.length > 0
                  ? listing.image_urls[0]
                  : "/placeholder.jpg"
              }
              alt={listing.title}
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
              {listing.title}
            </h2>
          </div>

          {/* Form Section */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}
          >
            <div>
              <label style={labelStyle}>Item Description</label>
              <textarea
                value={listing.description}
                disabled
                style={{ ...inputStyle, height: "100px" }}
              />
            </div>
            <div>
              <label style={labelStyle}>Auction Strategy</label>
              <input
                type="text"
                value={listing.auction_strategy}
                disabled
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>
                {listing.auction_strategy === "Dutch"
                  ? "Current Price"
                  : "Minimum Bid"}
              </label>
              <input
                type="text"
                value={`$${(listing.auction_strategy === "Dutch"
                  ? currentPrice
                  : listing.minimum_bid
                ).toFixed(2)}`}
                disabled
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Current Bid</label>
              <input
                type="text"
                value={
                  listing.auction_strategy.toLowerCase() === "sealed-bid"
                    ? "Hidden" // ✅ Mask current bid for sealed-bid auctions
                    : listing.id in currentBids && currentBids[listing.id] > 0
                    ? `$${currentBids[listing.id].toFixed(2)}`
                    : "No Current Bids"
                }
                disabled
                style={inputStyle}
              />
            </div>
            {/* ✅ New "Bid Started / Not Started" Label */}
            <div>
              <label style={labelStyle}>Auction started / Not started</label>
              <input
                type="text"
                value={
                  isBidStarted ? "Auction Started ✅" : "Auction not Started ❌"
                }
                disabled
                style={inputStyle}
              />
            </div>
           <div>
             <label style={labelStyle}>Enter Your Bid</label>
              <input
                     type="number"
                     value={listing.auction_strategy.toLowerCase() === "dutch" ? currentPrice.toFixed(2) : bidAmount}
                     onChange={handleBidChange}
                     placeholder={`Enter an amount`}
                     style={inputStyle}
                    />
            {errorMessage && <p style={{ color: "#ff4d4d", marginTop: "10px" }}>{errorMessage}</p>}
                </div>
          </div>

          {/* Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "20px",
            }}
          >
            <button style={cancelButtonStyle} onClick={() => navigate("/home")}>
              Cancel
            </button>
            <button
              style={placeBidButtonStyle}
              onClick={handlePlaceBid}
              disabled={!isBidStarted}
            >
              {listing.auction_strategy === "Dutch"
                ? "Accept Price"
                : "Place Bid"}
            </button>
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

export default PlaceBid;
