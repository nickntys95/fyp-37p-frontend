import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppAppBar from './appbar';
import AppTheme from '../shared-theme/AppTheme';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import SearchBar from "./SearchBar";
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

function Home() {
  const [modalShow, setModalShow] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const navigate = useNavigate();
  const [currentBids, setCurrentBids] = useState({}); // To store the current bid for each listing
  const [results, setResults] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  // Chatbot States
  const user_name = sessionStorage.getItem('user_name');  // Retrieve recovery key from sessionStorage
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [username] = useState(user_name); //need replace to user_name in future
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const messagesEndRef = useRef(null);

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success'); // 'success', 'error'
  const token = sessionStorage.getItem("token") || "";
  const [selectedListing, setSelectedListing] = useState(null);
  const [listings, setListings] = useState([]);
  const [error, setError] = useState(null);

  const handleShowDetails = (listing) => {
    setSelectedListing(listing);
    setSelectedImageIndex(0); // Reset to first image
    setModalShow(true);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
};


  const handleCloseModal = () => {
    setModalShow(false);
    setSelectedListing(null);
  };

  const filteredListings =
    selectedCategory === "All"
      ? listings
      : listings.filter((listing) => listing.item_type === selectedCategory);

  // Toggle Chatbot Modal
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  // Start Chat (Bot Welcome Message)
  const handleStartChat = async () => {
	console.log("token:", token)
    toggleChat();
    try {
      const response = await fetch('/api1/start_chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, message: "start chat", token }),
      });

      const data = await response.json();
	  console.log("chat data ", data)
      setMessages([{ sender: 'bot', text: data.message }]); // Store bot's response
    } catch (error) {
      console.error('Error starting chat:', error);
      setMessages([{ sender: 'bot', text: 'Failed to start chat, please try again.' }]);
    }
  };

  // Handle Sending Messages
  const handleSendMessage = async () => {
    if (userInput.trim() === "") return; // Prevent empty messages

    // Append user message
    setMessages([...messages, { sender: "user", text: userInput }]);

    try {
      const response = await fetch('/api1/question_chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, message: userInput, token }),
      });

      const data = await response.json();
      setMessages(prev => [...prev, { sender: "bot", text: data.message }]);
      setUserInput(""); // Clear input after sending
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { sender: "bot", text: 'Failed to send message, please try again.' }]);
    }
  };

  function cleanDateString(dateString) {
    return dateString.replace('T', ' | ').replace('+00:00', '');
}


  // Fetch Listings and Bids in Parallel
  const [cachedListings, setCachedListings] = useState([]); // Store last fetched listings

  const fetchListingsAndBids = async () => {
    try {
      console.log(" Fetching data...");
      const response = await fetch('/api2/listing/get_all', {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(" API Error Response:", errorData);

        if (errorData.error && errorData.error.includes("57014")) {
          console.warn("⚠️ Database timeout error detected. Skipping update.");
          return;
        }

        throw new Error(errorData.error || "Failed to fetch listings");
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        console.error("🚨 Unexpected API response format:", data);
        return;
      }

      console.log(" Data fetched successfully:", data);

      // 🔹 Check if listings have changed before updating state
      if (JSON.stringify(data) !== JSON.stringify(cachedListings)) {
        console.log("🔄 Listings updated. Updating state...");
        setListings(data); // Update listings only if changed
        setCachedListings(data); // Cache new listings

        //  Fetch Bids Only If Listings Are Updated
        fetchBids(data);
      } else {
        console.log("No new listings. Skipping state update.");
      }

    } catch (err) {
      console.error(" Error fetching listings:", err);
      setError("An error occurred while fetching listings");
    }
  };

  // Fetch Bids Separately After Listings Are Updated
  const fetchBids = async (listings) => {
    try {
      console.log(" Fetching updated bids...");
      const bidRequests = listings.map(async (listing) => {
        const bidResponse = await fetch("/api2/bid/get_all", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ listing_id: listing.id }),
        });

        if (!bidResponse.ok) return { id: listing.id, bid: 0 };

        const bidData = await bidResponse.json();
        const highestBid = bidData.successful
          ? Math.max(...bidData.bids.map((bid) => bid.amount), 0)
          : 0;

        return { id: listing.id, bid: highestBid };
      });

      const bids = await Promise.all(bidRequests);
      const bidMap = bids.reduce((acc, { id, bid }) => ({ ...acc, [id]: bid }), {});

      console.log("📊 Updated Bid Map:", bidMap);
      setCurrentBids((prevBids) => ({ ...prevBids, ...bidMap })); // Merge new bids

    } catch (err) {
      console.error(" Error fetching bids:", err);
    }
  };

  //  Optimized Interval Fetch
  useEffect(() => {
    let timeoutId;

    const fetchData = async () => {
      clearTimeout(timeoutId); // Clear any pending timeout

      console.log("Fetching data...");
      try {
        await fetchListingsAndBids();
        console.log("Data fetch complete.");
      } finally {
        timeoutId = setTimeout(fetchData, 60000); // Schedule the next fetch after the current one completes
      }
    };


    fetchData(); // Initial fetch (no timeout here)

    return () => clearTimeout(timeoutId); // Clear timeout on unmount
  }, []);





  return (
    <>
      <AppTheme>
        <CssBaseline enableColorScheme />
        <Box>
          <AppAppBar />
          <div className="container my-5" style={{ marginTop: "100px" }}>
            <h1 className="mb-4 text-center text-uppercase">Marketplace</h1>

            {/* Search Bar */}
            <div className="search-bar-container">
              <SearchBar setResults={setResults} setError={(err) => setError(err)} />
            </div>

            {error ? (
              <div className="error-container">
                <p className="error-title">{error.title}</p>
                {error.message && <p className="error-message">{error.message}</p>}
                <ul className="error-suggestions">
                  {error.suggestions && error.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="row gx-4 gy-4 align-items-stretch">
                <div className="row gx-4 gy-4">
                  {(results.length > 0 || results === null ? results : listings).map((listing) => (
                    <div key={listing.id} className="col-lg-4 col-md-6 d-flex align-items-stretch">
                      <div className="card h-100 w-100 shadow d-flex flex-column">
                        <Box
                          component="img"
                          src={listing.image_urls?.length > 0 ? listing.image_urls[0] : "/placeholder.jpg"}
                          alt={listing.title}
                          sx={{
                            width: "100%",
                            height: "350px",
                            objectFit: "cover",
                            borderRadius: "2px",
                            border: "2px solid grey",
                          }}
                        />
                        <div className="card-body text-center d-flex flex-column justify-content-between">

                          {/* Title Section */}
                          <h5 className="card-title" style={{ minHeight: "50px", fontSize: "1.2rem" }}>
                            {listing.title}
                          </h5>

                          {/* Description Section */}
                          <p
                            className="card-text mb-2"
                            style={{
                              minHeight: "40px",
                              maxHeight: "40px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical"
                            }}
                          >
                            <strong>Description:</strong> {listing.description}
                          </p>

                          {/* Other Details */}
                          <p className="card-text mb-2"><strong>Starting Price:</strong> ${listing.minimum_bid}</p>
                          <p className="card-text mb-2"><strong>Current Bid:</strong> ${currentBids[listing.id] ?? "Loading..."}</p>
                          <p className="card-text mb-2"><strong>Buy-Now Price:</strong> ${listing.buy_now}</p>
                          <p className="card-text mb-2"><strong>Auction Type:</strong> {listing.auction_strategy}</p>

                          {/* View Details Button */}
                          <div className="mt-auto">
                            <button className="btn btn-primary" onClick={() => handleShowDetails(listing)} style={{ borderRadius: "30px", width: "100%" }} > View Details </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Custom Modal */}
            {modalShow && selectedListing && (
              <div
                className="custom-modal"
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 1000,
                }}
              >
                <div
                  className="custom-modal-content"
                  style={{
                    backgroundColor: "#1c1c1c",
                    color: "#fff",
                    padding: "20px",
                    borderRadius: "10px",
                    maxWidth: "600px",
                    width: "90%",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.5)",
                    position: "relative",
                  }}
                >
                  {/* Image Navigation Buttons */}
                  {selectedListing.image_urls?.length > 1 && (
                    <>
                      {/* Left Arrow Button */}
                      <button
                        onClick={() =>
                          setSelectedImageIndex((prev) =>
                            prev === 0 ? selectedListing.image_urls.length - 1 : prev - 1
                          )
                        }
                        style={{
                          position: "absolute",
                          left: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontSize: "2rem",
                          background: "rgba(0, 0, 0, 0.3)", // Slightly transparent background
                          color: "white",
                          border: "none",
                          cursor: "pointer",
                          padding: "15px",
                          borderRadius: "50%", // Make it circular
                          transition: "background 0.3s ease",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "50px",
                          height: "50px",
                          backdropFilter: "blur(5px)", // Adds blur effect
                        }}
                        onMouseOver={(e) => (e.target.style.background = "rgba(0, 0, 0, 0.6)")}
                        onMouseOut={(e) => (e.target.style.background = "rgba(0, 0, 0, 0.3)")}
                      >
                        {"❮"}
                      </button>

                      {/* Right Arrow Button */}
                      <button
                        onClick={() =>
                          setSelectedImageIndex((prev) =>
                            prev === selectedListing.image_urls.length - 1 ? 0 : prev + 1
                          )
                        }
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontSize: "2rem",
                          background: "rgba(0, 0, 0, 0.3)", // Slightly transparent background
                          color: "white",
                          border: "none",
                          cursor: "pointer",
                          padding: "15px",
                          borderRadius: "50%", // Make it circular
                          transition: "background 0.3s ease",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "50px",
                          height: "50px",
                          backdropFilter: "blur(5px)", // Adds blur effect
                        }}
                        onMouseOver={(e) => (e.target.style.background = "rgba(0, 0, 0, 0.6)")}
                        onMouseOut={(e) => (e.target.style.background = "rgba(0, 0, 0, 0.3)")}
                      >
                        {"❯"}
                      </button>
                    </>
                  )}

                  {/* Image Section */}
                  <Box
                    component="img"
                    src={
                      selectedListing.image_urls?.[selectedImageIndex] || "/placeholder.jpg"
                    }
                    alt={selectedListing.title || "Listing Image"}
                    sx={{
                      width: "100%",
                      maxWidth: "30vw",
                      height: "auto",
                      maxHeight: "30vh",
                      objectFit: "contain",
                    }}
                  />

                  {/* Item Details */}
                  <h2>{selectedListing.title}</h2>
                  <p style={{ textAlign: "justify" }}>
                    <strong>Description:</strong> {selectedListing.description}
                  </p>
                  <p><strong>Start Date:</strong> {cleanDateString(selectedListing.start_at)}</p>
                  <p><strong>End Date:</strong> {cleanDateString(selectedListing.end_at)}</p>
                  <p><strong>Starting Price:</strong> ${selectedListing.minimum_bid}</p>
                  <p><strong>Current Bid:</strong> {currentBids[selectedListing?.id] ?? "Loading..."}</p>
                  <p><strong>Buy-Now Price:</strong> ${selectedListing.buy_now}</p>
                  <p><strong>Auction Type:</strong> {selectedListing.auction_strategy}</p>

                  {/* Buttons Section - Ensuring Single Row Alignment */}
                  <div className="d-flex justify-content-between mt-3 gap-2">
                    {/* Close Button */}
                    <button className="btn btn-danger flex-grow-1" onClick={handleCloseModal}>
                      Close
                    </button>

                    {/* Place Bid Button */}
                    <Link
                      to="/place-bid"
                      state={{
                        id: selectedListing.id,
                        title: selectedListing.title,
                        description: selectedListing.description,
                        auction_strategy: selectedListing.auction_strategy,
                        minimum_bid: selectedListing.minimum_bid,
		        minimum_increment: selectedListing.minimum_increment,
                        buy_now: selectedListing.buy_now,
                        start_at: selectedListing.start_at,
                        end_at: selectedListing.end_at,
                        image_urls: selectedListing.image_urls,
                        current_bid: currentBids[selectedListing.id] || 0,
                      }}
                      className="btn btn-success flex-grow-1 text-center"
                    >
                      Place Bid
                    </Link>

                    {/* Buy Now Button */}
                    <button
                        className="btn btn-warning flex-grow-1"
                        onClick={() =>
                          navigate("/checkout", {
                            state: {
                              id: selectedListing.id,
                              title: selectedListing.title,
                              description: selectedListing.description,
                              auction_strategy: selectedListing.auction_strategy,
                              minimum_bid: selectedListing.minimum_bid,
                              buy_now: selectedListing.buy_now,
                              image_urls: selectedListing.image_urls,
                              start_at: selectedListing.start_at,
                              end_at: selectedListing.end_at
                            },
                          })
                        }
                      >
                        Buy Now
                      </button>

                    {/* Add to Wishlist Button */}
                    <button
                      className="btn btn-outline-light flex-grow-1"
                      onClick={async () => {
                        const token = sessionStorage.getItem("token"); // Retrieve JWT token

                        if (!token) {
                          setSnackbarMessage('You must be logged in to add favorites.');
                          setSnackbarSeverity('error');
                          setOpenSnackbar(true);
                          //alert("You must be logged in to add favorites.");
                          return;
                        }

                        try {
                          const response = await fetch("/api2/favorite/add", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ listing_id: selectedListing.id }),
                          });

                          const data = await response.json();

                          if (data.successful) {
                            //alert("Item added to favorites!");
                            setSnackbarMessage('Item added to favorites! Redirecting...');
                            setSnackbarSeverity('success');
                            setOpenSnackbar(true);

                            // Redirect user to Wishlist page after a short delay
                            setTimeout(() => {
                              navigate("/wishlist");
                            }, 2000);
                          } else {
                            alert(`Error: ${data.error}`);
                          }
                        } catch (error) {
                          console.error("Error adding to favorites:", error);
                          //alert("Failed to add item to favorites. Please try again.");
                          setSnackbarMessage('Failed to add item to favorites. Please try again.');
                          setSnackbarSeverity('error');
                          setOpenSnackbar(true);
                        }
                      }}
                    >
                      ❤️ Add to Favorites
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
          {/* Chatbot Button */}
          <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 1000 }}>
            <button
              onClick={handleStartChat}
              style={{
                backgroundColor: "#007bff",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: "60px",
                height: "60px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                cursor: "pointer",
                fontSize: "1.5rem",
              }}
            >
              💬
            </button>
          </div>
          {/* Chatbot Modal */}
          {isChatOpen && (
            <div
              style={{
                position: "fixed",
                bottom: "90px",
                right: "20px",
                width: "350px",
                height: "500px",
                backgroundColor: "#fff",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                borderRadius: "10px",
                padding: "10px",
                zIndex: 1000,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {/* Header */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
                padding: "10px",
                borderBottom: "1px solid #ddd"
              }}>
                <h4 style={{ margin: 0, color: "#000" }}>Bot Assistant</h4>
                <button
                  onClick={toggleChat}
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    fontSize: "1.2rem",
                    cursor: "pointer",
                  }}
                >
                  &times;
                </button>
              </div>

              {/* Messages Section */}
              <div style={{
                flex: 1,
                overflowY: "auto",
                marginBottom: "10px",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "5px",
                backgroundColor: "#f9f9f9",
              }}
                ref={messagesEndRef}  // Attaching the ref here
              >
                {messages.map((message, index) => (
                  <div
                    key={index}
                    style={{
                      textAlign: message.sender === "user" ? "right" : "left",
                      margin: "5px 0",
                      padding: "8px",
                      borderRadius: "5px",
                      backgroundColor: message.sender === "user" ? "#007bff" : "#e9ecef",
                      color: message.sender === "user" ? "#fff" : "#000",
                      maxWidth: "80%",
                      fontSize: "1.3rem",
                      whiteSpace: "pre-line",
                      marginLeft: message.sender === "user" ? "auto" : "0",
                      marginRight: message.sender === "user" ? "0" : "auto",
                    }}
                  >
                    {message.text}
                  </div>
                ))}
              </div>

              {/* Input Section */}
              <div style={{ padding: "10px", borderTop: "1px solid #ddd" }}>
                <textarea
                  rows="3"
                  placeholder="Type your message..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault(); // Prevents new line in textarea
                      handleSendMessage();
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "2px",
                    borderRadius: "5px",
                    fontSize: "1.3rem",
                    border: "1px solid #ccc",
                    backgroundColor: "#fff",
                    color: "#000",
                    resize: "none",
                  }}
                ></textarea>
                <button
                  onClick={handleSendMessage}
                  style={{
                    marginTop: "10px",
                    width: "100%",
                    backgroundColor: "#007bff",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    padding: "10px",
                    fontSize: "1rem",
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          )}
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
        </Box>
      </AppTheme>

      {/* Modal Styles */}
      <style>
        {`
        .custom-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .custom-modal-content {
          background-color: white;
          padding: 20px;
          border-radius: 10px;
          width: 80%;
          max-width: 500px;
          position: relative;
          color: black; /* Ensures text color is visible */
        }
        .custom-modal-content h2,
        .custom-modal-content p,
        .custom-modal-content span,
        .custom-modal-content button,
        .custom-modal-content a {
          c
        }
        .close-button {
          position: absolute;
          top: 10px;
          right: 10px;
          font-size: 1.5rem;
          background: none;
          border: none;
          cursor: pointer;
        }
        .custom-modal-footer .btn {
          color: white;
                }
        `}
      </style>
    </>
  );
}

export default Home;
