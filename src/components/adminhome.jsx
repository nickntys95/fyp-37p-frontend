import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Box, Button, CssBaseline, FormLabel, Grid, MenuItem, OutlinedInput, Select, Snackbar, Alert } from '@mui/material';
import productsData from "../data/products.json";
import AppAppBar from './adminappbar';
import AppTheme from '../shared-theme/AppTheme';
import { styled } from '@mui/system';

function AdminHome() {
	const [modalShow, setModalShow] = useState(false);
	const [modalShow1, setModalShow1] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState(null);
	const [selectedCategory, setSelectedCategory] = useState("All");
	const navigate = useNavigate();

	// Chatbot States
	const user_name = sessionStorage.getItem('user_name');  // Retrieve recovery key from sessionStorage
	const [isChatOpen, setIsChatOpen] = useState(false);
	const [username] = useState('meghan29'); //need replace to user_name in future
	const [messages, setMessages] = useState([]);
	const [userInput, setUserInput] = useState("");
	const messagesEndRef = useRef(null);
	  
	const token = sessionStorage.getItem("token") || "";
	const [selectedListing, setSelectedListing] = useState(null);
	const [editListing, setEditListing] = useState(null);
	const [listings, setListings] = useState([]);
	const [error, setError] = useState(null);
	const [currentBids, setCurrentBids] = useState({}); // To store the current bid for each listing
	const [selectedItem, setSelectedItem] = useState(null);
	const [selectedFileName, setSelectedFileName] = useState("No file chosen");
    const [currentImageUrl, setCurrentImageUrl] = useState(null); 
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  
	const handleShowDetails = (listing) => {
		setSelectedListing(listing);
		setModalShow(true);
	};

	const handleCloseModal = () => {
		setModalShow(false);
		setSelectedListing(null);
	};
	
    // Load the item data based on itemId
    useEffect(() => {

        const fetchListings = async () => {
            try {
                const response = await fetch('/api2/listing/get_all', {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
        
                console.log("Response Status:", response.status); // Debug response status
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error("API Error:", errorData); // Log error data for debugging
                    setError(errorData.error || "Failed to fetch listings");
                    return;
                }
        
                const data = await response.json();
                setListings(data);
                setError(null); // Clear errors
        
            } catch (err) {
                console.error("Network or Parsing Error:", err);
                setError("An error occurred while fetching listings");
            }
        };
        
        fetchListings();
    }, []);

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
    toggleChat();
    try {
      const response = await fetch('/api1/start_chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, message: "start chat" }),
      });

      const data = await response.json();
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
        body: JSON.stringify({ username, message: userInput }),
      });

      const data = await response.json();
      setMessages(prev => [...prev, { sender: "bot", text: data.message }]);
      setUserInput(""); // Clear input after sending
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { sender: "bot", text: 'Failed to send message, please try again.' }]);
    }
  };
  
  // Fetch Bids Separately After Listings Are Updated
	const fetchBids = async (listings) => {
		try {
			console.log("📡 Fetching updated bids...");
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
  
	const handleDeleteListing = async (listing) => {
	  try {
		const response = await fetch(`/api2/listing/delete/${listing.id}`, {
		  method: "DELETE",
		  headers: {
			"Authorization": `Bearer ${token}`,
			"Content-Type": "application/json",
		  },
		});

		if (!response.ok) {
		  const errorData = await response.json(); // Make sure to await .json() before checking response.ok
		  throw new Error(`Failed to delete listing: ${errorData.error}`);
		}

		const data = await response.json(); // If the response is ok, then parse the JSON
		console.log("Delete data:", data); // This should log "Listing deleted successfully"
		alert("Listing deleted successfully!");
	  } catch (error) {
		console.error("Error deleting listing:", error);
		setError("Error deleting listing: " + error.message);
	  }
	};

	
  return (
    <>
      <AppTheme>
        <CssBaseline enableColorScheme />
        <Box>
          <AppAppBar />
		  <div className="container my-5" style={{ marginTop: "100px" }}>
            <h1 className="mb-4 text-center text-uppercase">Listings</h1>

            {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

            {/* Category Filter */}
            <div className="mb-4 d-flex justify-content-center">
              <select
                className="form-select w-auto"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                {[...new Set(listings.map((listing) => listing.item_type))].map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Render Listings */}
            <div className="row">
              {filteredListings.map((listing) => (
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
							minHeight: "40px",  // Ensures consistent height
							maxHeight: "40px",  // Prevents overflow
							overflow: "hidden", // Hides excess text
							textOverflow: "ellipsis", // Adds "..." if text overflows
							display: "-webkit-box",
							WebkitLineClamp: 3, // Limits text to 3 lines
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
                      <div className="d-flex justify-content-around">
                        <button className="btn btn-primary" onClick={() => handleShowDetails(listing)}
                          style={{ borderRadius: "30px" }}
                        >
                          View Details
                        </button>
                        <button className="btn btn-warning" onClick={() => handleShowDetails(listing)}
                          style={{ borderRadius: "30px" }}
                        >
                          Edit
                        </button>
                        <button className="btn btn-danger" onClick={() => handleDeleteListing(listing)}
                          style={{ borderRadius: "30px" }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Modal */}
            {modalShow && selectedListing && (
              <div className="custom-modal"
                style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
                  backgroundColor: "rgba(0, 0, 0, 0.8)", display: "flex", justifyContent: "center",
                  alignItems: "center", zIndex: 1000,
                }}
              >
                <div className="custom-modal-content"
                  style={{ backgroundColor: "#1c1c1c", color: "#fff", padding: "20px",
                    borderRadius: "10px", maxWidth: "600px", width: "90%", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.5)",
                  }}
                >
				  <p><strong>Item_id:</strong> {selectedListing.id}</p>
                  <p><strong>Title:</strong> {selectedListing.title}</p>
                  <p><strong>Description:</strong> {selectedListing.description}</p>
				  <p><strong>Auction Strategy:</strong> {selectedListing.auction_strategy}</p>
			      <p><strong>Current Price:</strong> ${currentBids[selectedListing.id] ?? "Loading..."}</p>
				  <p><strong>Min Bid:</strong> ${selectedListing.minimum_bid}</p>
				  <p><strong>Buy-Now Price:</strong> ${selectedListing.buy_now}</p>
				  <p><strong>Start Date:</strong> {new Date(selectedListing.start_at).toLocaleString("en-SG", { timeZone: "Asia/Singapore" })}</p>
                  <p><strong>End Date:</strong> {new Date(selectedListing.end_at).toLocaleString("en-SG", { timeZone: "Asia/Singapore" })}</p>
                  <button className="btn btn-danger" onClick={handleCloseModal}>Close</button>
                </div>
              </div>
            )}
          </div>
		)}	
		
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

export default AdminHome;