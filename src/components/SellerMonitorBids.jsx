import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Chart from "chart.js/auto";
import AppAppBar from "./appbar";
import AppTheme from "../shared-theme/AppTheme";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import { useParams } from 'react-router-dom';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

function SellerMonitorBids() {
  const navigate = useNavigate();
  const { itemId } = useParams();


  const location = useLocation();
  const chartRef = useRef(null);
  const canvasRef = useRef(null);
  const ws = useRef(null); // WebSocket ref
  const { state } = location;
  const initialBid = parseFloat(state?.bidAmount) || 0;
 
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
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success'); // 'success', 'error'
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [listings, setListings] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const token = sessionStorage.getItem("token"); // or localStorage.getItem('token');
  const listingId = itemId
  //const listing = location.state?.listing || JSON.parse(sessionStorage.getItem("listing"));


  useEffect(() => {
    const now = new Date();
    setCurrentDateTime(now.toISOString().slice(0, 16));

    const fetchListings = async () => {
        try {
            const response = await fetch('/api2/listing/get_all', {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.error || "Failed to fetch listings");
                return;
            }

            const data = await response.json();
            setListings(data);
            setError(null);

            const foundItem = data.find((item) => item.id === parseInt(itemId));
            setSelectedItem(foundItem);
            console.log("Selected Item:", foundItem);
            
        } catch (err) {
            setError("An error occurred while fetching listings");
        }
    };

    fetchListings();
}, [itemId]);

  // Function to fetch initial bids using the REST API
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
      const now = new Date();
      now.setHours(now.getHours() + 8)
      const difference = new Date(endAt) - now;

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
            label: "Ongoing Bids",
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
              src={selectedItem?.image_urls?.length > 0 ? selectedItem.image_urls[0] : "/placeholder.jpg"}
              alt={selectedItem?.title || "Listing Image"}
              sx={{
                width: "200px",
                height: "200px",
                borderRadius: "8px",
                objectFit: "cover",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                border: "2px solid grey",
              }}
            />
            <h4 className="mt-3">{selectedItem?.title || "Loading..."}</h4> {/* Replace 'product.name' with 'listing.title' */}
            <p className="text-muted">{selectedItem?.description || "No description available"}</p> {/* Replace 'product.description' with 'listing.description' */}
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
export default SellerMonitorBids;
