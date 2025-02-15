import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import AppAppBar from "./appbar";
import AppTheme from "../shared-theme/AppTheme";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";

function CountdownTimer({ endAt }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!endAt) return;

    const calculateTimeLeft = () => {
      const difference = new Date(endAt) - new Date();
      if (difference <= 0) {
        setIsExpired(true);
        return null;
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      if (newTimeLeft) {
        setTimeLeft(newTimeLeft);
      } else {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endAt]);

  return (
    <div className="timer-box">
      <h6>Time Remaining</h6>
      <div style={{ background: "#f8f9fa", padding: "15px", borderRadius: "8px", textAlign: "center", marginBottom: "15px" }}>
        <h4>
          {isExpired
            ? "BIDDING CLOSED"
            : timeLeft
            ? `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`
            : "Loading..."}
        </h4>
      </div>
    </div>
  );
}

function MyBids() {
  const [userBids, setUserBids] = useState([]);
  const [listings, setListings] = useState([]);
  const [currentBids, setCurrentBids] = useState({});
  const [error, setError] = useState(null);
  const token = sessionStorage.getItem("token");
  const userName = sessionStorage.getItem("user_name");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchListings = async () => {
      try {
        console.log("Fetching listings...");
        const response = await fetch("/api2/listing/get_all", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch listings");

        const data = await response.json();
        setListings(data);
      } catch (error) {
        console.error("Error fetching listings:", error);
        setError("Failed to fetch listings.");
      }
    };
    fetchListings();
  }, []);

  useEffect(() => {
    if (listings.length === 0) return;

    const fetchUserBids = async () => {
      try {
        console.log("Fetching user bids...");
        const allBids = await Promise.all(
          listings.map(async (listing) => {
            const response = await fetch("/api2/bid/get_all", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ listing_id: listing.id }),
            });

            const data = await response.json();
            if (!response.ok || !data.successful) return null;

            const userBids = data.bids.filter((bid) => bid.user_name === userName);

            if (userBids.length > 0) {
              userBids.sort((a, b) => new Date(b.inserted_at) - new Date(a.inserted_at));
              return { ...userBids[0], listing: listing };
            }

            return null;
          })
        );

        const validUserBids = allBids.filter(Boolean);
        setUserBids(validUserBids);
      } catch (error) {
        console.error("Error fetching user bids:", error);
        setError("Failed to fetch user bids.");
      }
    };

    fetchUserBids();
  }, [listings]);

  useEffect(() => {
    if (userBids.length === 0) return;

    const fetchCurrentBids = async () => {
      try {
        console.log("Fetching current highest bids...");
        const bidRequests = userBids.map(async (bid) => {
          const response = await fetch("/api2/bid/get_all", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ listing_id: bid.listing.id }),
          });

          const data = await response.json();
          if (!response.ok || !data.successful) return { id: bid.listing.id, highestBid: "No bids yet" };

          const highestBid = Math.max(...data.bids.map((b) => b.amount), 0);
          return { id: bid.listing.id, highestBid };
        });

        const bids = await Promise.all(bidRequests);
        const bidMap = bids.reduce((acc, { id, highestBid }) => ({ ...acc, [id]: highestBid }), {});

        setCurrentBids(bidMap);
      } catch (error) {
        console.error("Error fetching current bids:", error);
        setError("Failed to fetch current highest bids.");
      }
    };

    fetchCurrentBids();
    const interval = setInterval(fetchCurrentBids, 10000);

    return () => clearInterval(interval);
  }, [userBids]);

  return (
    <AppTheme>
    <CssBaseline enableColorScheme />
    <Box>
      <AppAppBar />
      <div className="container my-5" style={{ paddingTop: "80px" }}>
       <h1 className="mb-4 text-center text-uppercase">Current Bids</h1>
        {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
  
        {userBids.length > 0 ? (
          <div className="row gx-4 gy-4 align-items-stretch">
            {userBids.map((bid, index) => (
              <div key={index} className="col-lg-4 col-md-6 d-flex align-items-stretch">
                <div className="card h-100 w-100 shadow d-flex flex-column">
                <Box
                      component="img"
                      src={bid.listing?.image_urls?.length > 0 ? bid.listing.image_urls[0] : "/placeholder.jpg"}
                      alt={bid.listing?.title || "Listing Image"}
                      sx={{
                          width: "100%",
                          height: "350px",
                          objectFit: "cover",
                          borderRadius: "2px",
                          border: "2px solid grey",
                      }}
                  />
                  <div className="card-body text-center d-flex flex-column">
                    {/* Title and Bid Info */}
                    <h5 className="card-title">{bid.listing?.title || "Unknown Title"}</h5>
                    <p><strong>My Bid:</strong> ${bid.amount}</p>
                    <p><strong>Current Highest Bid:</strong> ${currentBids[bid.listing?.id] || "Loading..."}</p>
  
                    {/* Ensure the Countdown Timer stays consistent in height */}
                    <div className="flex-grow-1 d-flex align-items-center justify-content-center" style={{ minHeight: "60px" }}>
                      <CountdownTimer endAt={bid.listing?.end_at} />
                    </div>
  
                    {/* Button Section - Always Aligned at Bottom */}
                    <div className="mt-auto d-flex flex-column">
                      {new Date(bid.listing?.end_at) < new Date() ? (
                        bid.amount === currentBids[bid.listing?.id] ? (
                          <button
                            className="btn btn-success w-100"
                            onClick={() =>
                              navigate("/checkout-mybids", {
                                state: { productName: bid.listing.title, price: bid.amount },
                              })
                            }
                          >
                            Proceed to Checkout
                          </button>
                        ) : (
                          <button className="btn btn-secondary w-100" disabled>
                            Auction Closed
                          </button>
                        )
                      ) : (
                        <button
                          className="btn btn-primary w-100"
                          onClick={() =>
                            navigate("/bidding-page", { state: { listing: bid.listing } })
                          }
                        >
                          Go to Bidding Page
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center">No bids found for your account.</p>
        )}
      </div>
    </Box>
  </AppTheme>
  
  );
}

export default MyBids;
