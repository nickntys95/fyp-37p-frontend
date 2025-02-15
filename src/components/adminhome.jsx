import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Box, Button, CssBaseline, FormLabel, Grid, MenuItem, OutlinedInput, Select, Snackbar, Alert } from '@mui/material';
import productsData from "../data/products.json";
import AppAppBar from './adminappbar';
import AppTheme from '../shared-theme/AppTheme';
import { styled } from '@mui/system';
import SearchBar from "./SearchBar";



const ImageSlider = ({ images, onImageChange, onDeleteImage, onUploadImage, }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const handlePrevious = (e) => {
        e.preventDefault();
        setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
        onImageChange(images[(currentIndex - 1 + images.length) % images.length]);
    };

    const handleNext = (e) => {
        e.preventDefault();
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        onImageChange(images[(currentIndex + 1) % images.length]);
    };

    const handleDotClick = (index) => {
        setCurrentIndex(index);
        onImageChange(images[index]); // Pass the new image URL
    };

    const handleDelete = () => {
        onDeleteImage(images[currentIndex]); // Call delete function with selected image
    };

    return (
        <div className="image-slider">
            <img src={images[currentIndex]} alt={`Image ${currentIndex + 1}`} style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }} />
            <a className="prev" onClick={handlePrevious}>&#10094;</a>
            <a className="next" onClick={handleNext}>&#10095;</a>
            <div style={{ textAlign: 'center' }}>
                {images.map((_, index) => (
                    <span
                        key={index}
                        className={`dot ${currentIndex === index ? 'active' : ''}`}
                        onClick={() => handleDotClick(index)}
                    ></span>
                ))}
            </div>
        </div>
    );
};

function AdminHome() {
	const [modalShow, setModalShow] = useState(false);
	const [modalShow1, setModalShow1] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState(null);
	const [selectedCategory, setSelectedCategory] = useState("All");
	const navigate = useNavigate();
	const [results, setResults] = useState([]);
	
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
		
	const handleEditClick = (id) => {
		navigate(`/AdminEdit/${id}`)
    };
	
    // Load the item data based on itemId
    useEffect(() => {

        const fetchListings = async () => {
            try {
                const response = await fetch('https://fyp-37p-api-a16b479cb42b.herokuapp.com/listing/get_all', {
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
  
	const handleDeleteListing = async (listing) => {
	  try {
		const response = await fetch(`https://fyp-37p-api-a16b479cb42b.herokuapp.com/listing/admin_redact/${listing.id}`, {
		  method: "PUT",
		  headers: {
			"Authorization": `Bearer ${token}`,
			"Content-Type": "application/json",
		  },
		});

		if (!response.ok) {
		  const errorData = await response.json(); // Make sure to await .json() before checking response.ok
		  throw new Error(`Failed to redact listing: ${errorData.error}`);
		}

		const data = await response.json(); // If the response is ok, then parse the JSON
		console.log("Redact data:", data); // This should log "Listing deleted successfully"
		alert("Listing redact successfully!");
		window.location.reload()
	  } catch (error) {
		console.error("Error redact listing:", error);
		setError("Error redact listing: " + error.message);
	  }
	};

    const handleImageChange = (imageUrl) => {
        setCurrentImageUrl(imageUrl);
        console.log("Current Image URL:", imageUrl);
    };	
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
							  <p className="card-text mb-2"><strong>Buy-Now Price:</strong> ${listing.buy_now}</p>
							  <p className="card-text mb-2"><strong>Auction Type:</strong> {listing.auction_strategy}</p>

							  <div className="d-flex justify-content-around">
								<button className="btn btn-primary" onClick={() => handleShowDetails(listing)}
								  style={{ borderRadius: "30px" }}
								>
								  View Details
								</button>
								<button className="btn btn-warning" onClick={() => handleEditClick(listing.id)}
								  style={{ borderRadius: "30px" }}
								>
								  Edit
								</button>
								<button className="btn btn-danger" onClick={() => handleDeleteListing(listing)}
								  style={{ borderRadius: "30px" }}
								>
								  Redact
								</button>
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
				<div>
				<FormLabel sx={{ fontSize: '1.50rem' }}>Item Image</FormLabel>
                <ImageSlider 
                                images={selectedListing.image_urls} 
                                onImageChange={handleImageChange} 
				/>
                </div>            
				  <p><strong>Item_id:</strong> {selectedListing.id}</p>
                  <p><strong>Title:</strong> {selectedListing.title}</p>
                  <p><strong>Description:</strong> {selectedListing.description}</p>
				  <p><strong>Auction Strategy:</strong> {selectedListing.auction_strategy}</p>
				  <p><strong>Min Bid:</strong> ${selectedListing.minimum_bid}</p>
				  <p><strong>Minimum Increment:</strong> ${selectedListing.minimum_increment}</p>
				  <p><strong>Buy-Now Price:</strong> ${selectedListing.buy_now}</p>
				  <p><strong>Start Date:</strong> {new Date(selectedListing.start_at).toLocaleString("en-SG", { timeZone: "Asia/Singapore" })}</p>
                  <p><strong>End Date:</strong> {new Date(selectedListing.end_at).toLocaleString("en-SG", { timeZone: "Asia/Singapore" })}</p>
                  <button className="btn btn-danger" onClick={handleCloseModal}>Close</button>
                </div>
              </div>
            )}
          </div>
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