import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Chart from "chart.js/auto";
import AppAppBar from "./appbar";
import AppTheme from "../shared-theme/AppTheme";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";

function BiddingPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/home");
  };
  const location = useLocation();
  const chartRef = useRef(null);
  const canvasRef = useRef(null);
  const ws = useRef(null); // WebSocket ref
  const { state } = location;
  const initialBid = parseFloat(state?.bidAmount) || 0;
  const listing =
    location.state?.listing || JSON.parse(sessionStorage.getItem("listing"));
  const [currentBid, setCurrentBid] = useState(0);
  const [newBidAmount, setNewBidAmount] = useState(""); // State for new bid amount
  const [bids, setBids] = useState([]);
  const [startAt, setStartAt] = useState();
  const [endAt, setEndAt] = useState();
  const [minimumBid, setMinimumBid] = useState();
  const [minimumIncrement, setMinimumIncrement] = useState();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(true); // Subscription state for WebSocket
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState();
  const [isExpired, setIsExpired] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success"); // 'success', 'error'
  const token = sessionStorage.getItem("token"); // or localStorage.getItem('token');
  const listingId = listing?.id;
  const [isProcessing, setIsProcessing] = useState(false);

  // Function to fetch initial bids using the REST API
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
        const errorData = await response.json();
        setError(errorData.error || "Something went wrong");
      } else {
        if (data.successful) {
          console.log(data);
          setBids(data.bids);
          setMinimumBid(data.listing_minimum_bid);
          setMinimumIncrement(data.listing_minimum_increment);
          setStartAt(new Date(data.listing_start_at));
          setEndAt(new Date(data.listing_end_at));
        } else {
          setError(data.error || "Unknown error occurred");
        }
      }
    } catch (err) {
      setError("Failed to fetch bids. Please try again.");
    }
  };

  useEffect(() => {
    if (!endAt) return;

    const calculateTimeLeft = () => {
      const difference = new Date(endAt) - new Date();

      if (difference <= 0) {
        setIsExpired(true);
        console.log("Countdown is over!");
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
      const timeLeft = calculateTimeLeft();
      if (timeLeft) {
        setTimeLeft(timeLeft);
      } else {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endAt]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const enableNotifications = () => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          setNotificationsEnabled(true);
        }
      });
    } else {
      setNotificationsEnabled(true);
    }
  };

  const sendNotification = (title, message) => {
    if (
      notificationsEnabled &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification(title, {
        body: message,
        icon: "/images/auction-icon.png",
      });
    }
  };

  useEffect(() => {
    console.log(bids);
    if (bids.length === 0) return;

    const unique = [...new Set(bids)];

    if (JSON.stringify(bids) !== JSON.stringify(unique)) {
      setBids(unique);
    }

    console.log(bids);
    setCurrentBid(bids?.at(-1).amount ?? 0);
  }, [bids]);

  useEffect(() => {
    // Fetch the initial bids when the component mounts
    fetchInitialBids();

    // WebSocket setup
    ws.current = new WebSocket(
      "wss://fyp-37p-api-ws-598f128c9889.herokuapp.com/"
    );

    ws.current.onopen = () => {
      console.log("WebSocket connected");
      // Send subscription message
      ws.current.send(JSON.stringify({ token }));
      ws.current.send(
        JSON.stringify({
          message_id: 1,
          listing_id: listingId,
          subscribe: true,
        })
      );
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received data: ", data); // Pretty log of the incoming data

      if (data) {
        if ("authenticated" in data || "reply_to" in data) {
        } else {
          setBids((bids) => [...bids, data]); // Append new bids to the current state
        }
      }
    };

    ws.current.onclose = () => console.log("WebSocket disconnected");

    // Cleanup WebSocket connection when the component unmounts
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [token, isSubscribed, listingId]);
  // ✅ Handle Bid Submission & Redirect to PayPal
  const handleSubmitBid = async (e) => {
    e.preventDefault();
    setNewBidAmount("");

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
      if (data.successful) {
        alert("Bid placed successfully!");
        handlePaymentRedirect(newBidAmount); // ✅ Redirect to PayPal for payment
      } else {
        alert(data.error);
        setError(data.error || "Failed to place bid.");
      }
    } catch (error) {
      alert("Something went wrong!");
      setError("Failed to send bid. Please try again.");
    }
  };

  // ✅ Initialize Payment & Redirect to PayPal
  const handlePaymentRedirect = async (bidAmount) => {
    setIsProcessing(true);

    try {
      const requestBody = {
        amount: bidAmount.toString(),
        listing_id: listingId,
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

      if (data.successful && data.order && Array.isArray(data.order.links)) {
        const approvalLink = data.order.links.find(
          (link) => link.rel === "payer-action"
        );

        if (approvalLink && approvalLink.href) {
          window.location.href = approvalLink.href; // ✅ Redirect to PayPal
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

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const gradientStroke = ctx.createLinearGradient(0, 230, 0, 50);
    gradientStroke.addColorStop(1, "rgba(203,12,159,0.2)");
    gradientStroke.addColorStop(0.2, "rgba(72,72,176,0.0)");
    gradientStroke.addColorStop(0, "rgba(203,12,159,0)");

    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: bids.map((_, index) => `Bid ${index + 1}`),
        datasets: [
          {
            label: "Your Bids",
            data: bids.map((bid) => bid.amount),
            tension: 0.4,
            borderWidth: 3,
            borderColor: "#cb0c9f",
            backgroundColor: gradientStroke,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: "top" },
        },
        scales: {
          x: { ticks: { color: "#b2b9bf", padding: 10 } },
          y: { ticks: { color: "#b2b9bf", padding: 10 } },
        },
      },
    });
  }, [bids]);

  const formatDate = (dateString) => {
    const date = new Date(dateString); // Convert string to Date object

    // Format the date part as dd/mm/yyyy
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
    const year = date.getFullYear();

    // Format the time part as hh:mm:ss
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    const time = `${hours}:${minutes}:${seconds}`; // "hh:mm:ss"
    const formattedDate = `${day}/${month}/${year} ${time}`; // "dd/mm/yyyy/hh:mm:ss"

    return formattedDate;
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
        }}
      >
        <h2 className="text-center mb-4">Live Auction</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr 1fr",
            gap: "20px",
            alignItems: "center",
            marginBottom: "30px",
          }}
        >
          {/* Listing Section */}
          <div style={{ textAlign: "center" }}>
            <Box
              component="img"
              src={
                listing?.image_urls?.length > 0
                  ? listing.image_urls[0]
                  : "/placeholder.jpg"
              }
              alt={listing?.title || "Listing Image"}
              sx={{
                width: "200px",
                height: "200px",
                borderRadius: "8px",
                objectFit: "cover",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                border: "2px solid grey",
              }}
            />
            <h4 className="mt-3">{listing.title}</h4>{" "}
            {/* Replace 'product.name' with 'listing.title' */}
            <p className="text-muted">{listing.description}</p>{" "}
            {/* Replace 'product.description' with 'listing.description' */}
          </div>
          {/* Chart Section */}
          <div
            className="card shadow"
            style={{ padding: "20px", borderRadius: "10px" }}
          >
            <h6>Bid Overview</h6>
            <div
              style={{ position: "relative", width: "100%", height: "300px" }}
            >
              <canvas ref={canvasRef}></canvas>
            </div>
          </div>

          {/* Bidding Section */}
          <div
            className="card shadow"
            style={{ padding: "20px", borderRadius: "10px" }}
          >
            <h6>Current Bid</h6>
            <div
              style={{
                background: "#f8f9fa",
                padding: "15px",
                borderRadius: "8px",
                textAlign: "center",
                marginBottom: "15px",
              }}
            >
              <h4>${currentBid === 0 ? " -" : Number(currentBid)}</h4>
            </div>
            <h6>Time Remaining</h6>
            <div
              style={{
                background: "#f8f9fa",
                padding: "15px",
                borderRadius: "8px",
                textAlign: "center",
                marginBottom: "15px",
              }}
            >
              <h4>
                {isExpired ? (
                  <div>BIDDING CLOSED</div>
                ) : timeLeft ? (
                  <div>
                    {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m{" "}
                    {timeLeft.seconds}s
                  </div>
                ) : (
                  ""
                )}
              </h4>
            </div>
            <form onSubmit={handleSubmitBid}>
              <h6>Place New Bid</h6>
              <input
                type="number"
                name="newBid"
                value={newBidAmount}
                placeholder={
                  currentBid >= minimumBid
                    ? currentBid
                      ? "Min. bid $" + (currentBid + minimumIncrement)
                      : ""
                    : minimumBid
                    ? "Min. bid $" + minimumBid
                    : ""
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  backgroundColor: "#ffffff",
                  color: "#000",
                }}
                onChange={(e) => setNewBidAmount(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={isExpired}
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: "#008000",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  opacity: isExpired ? 0.5 : 1,
                }}
              >
                Submit
              </button>
              <button
                style={{
                  width: "100%",
                  margin: "5px 0 0 0",
                  padding: "10px",
                  backgroundColor: "#337ab7",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
                onClick={handleLogout}
                s
              >
                Leave Room
              </button>
              <Snackbar
                open={openSnackbar}
                autoHideDuration={4000} // Duration in ms before Snackbar auto closes
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
              >
                <MuiAlert
                  onClose={handleCloseSnackbar}
                  severity={snackbarSeverity}
                  sx={{ width: "100%", fontSize: "1.50rem" }}
                >
                  {snackbarMessage}
                </MuiAlert>
              </Snackbar>
            </form>
          </div>
        </div>

        {/* Bid History Table */}
        <div
          className="card shadow mt-4"
          style={{ padding: "20px", borderRadius: "10px" }}
        >
          <h5 style={{ fontWeight: "bold", color: "#000" }}>Bid History</h5>
          <table
            className="table table-hover table-striped"
            style={{ width: "100%", textAlign: "left", color: "#000" }}
          >
            <thead
              className="thead-dark"
              style={{ backgroundColor: "#f1f1f1", color: "#000" }}
            >
              <tr>
                <th>#</th>
                <th>Bidder</th>
                <th>Amount</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {bids.map((bid, index) => (
                <tr
                  key={index}
                  style={{
                    backgroundColor: index % 2 === 0 ? "#fff" : "#f9f9f9",
                  }}
                >
                  <td style={{ padding: "10px", color: "#000" }}>
                    {index + 1}
                  </td>
                  <td style={{ padding: "10px", color: "#000" }}>
                    {bid.user_name}
                  </td>
                  <td style={{ padding: "10px", color: "#000" }}>
                    ${bid.amount}
                  </td>
                  <td style={{ padding: "10px", color: "#000" }}>
                    {formatDate(bid.inserted_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppTheme>
  );
}
export default BiddingPage;
