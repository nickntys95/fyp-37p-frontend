import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppAppBar from "./appbar";
import AppTheme from "../shared-theme/AppTheme";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [currentBids, setCurrentBids] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalShow, setModalShow] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token") || "";

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      console.log("🛒 Fetching wishlist...");
      const favoriteResponse = await fetch(
        "https://fyp-37p-api-a16b479cb42b.herokuapp.com/favorite/get_all",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const favoriteData = await favoriteResponse.json();
      console.log("✅ Favorite Listings Response:", favoriteData);

      if (favoriteData.successful && Array.isArray(favoriteData.favorites)) {
        const favoriteIds = new Set(favoriteData.favorites);
        const listingResponse = await fetch(
          "https://fyp-37p-api-a16b479cb42b.herokuapp.com/listing/get_all",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const allListings = await listingResponse.json();
        console.log("✅ All Listings Response:", allListings);

        if (Array.isArray(allListings)) {
          const wishlistListings = allListings.filter((listing) =>
            favoriteIds.has(listing.id)
          );
          setWishlist(wishlistListings);
          fetchBids(wishlistListings);
        }
      }
    } catch (error) {
      console.error("🚨 Error fetching wishlist:", error);
    }
  };

  const fetchBids = async (wishlistItems) => {
    try {
      const bidRequests = wishlistItems.map(async (item) => {
        const response = await fetch(
          "https://fyp-37p-api-a16b479cb42b.herokuapp.com/bid/get_all",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ listing_id: item.id }),
          }
        );

        if (!response.ok) return { id: item.id, bid: 0 };

        const bidData = await response.json();
        const highestBid = bidData.successful
          ? Math.max(...bidData.bids.map((bid) => bid.amount), 0)
          : 0;

        return { id: item.id, bid: highestBid };
      });

      const bids = await Promise.all(bidRequests);
      const bidMap = bids.reduce(
        (acc, { id, bid }) => ({ ...acc, [id]: bid }),
        {}
      );
      setCurrentBids(bidMap);
    } catch (error) {
      console.error("Error fetching bids:", error);
    }
  };

  const handleRemoveFromWishlist = async (id) => {
    try {
      const response = await fetch(
        "https://fyp-37p-api-a16b479cb42b.herokuapp.com/favorite/remove",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ listing_id: id }),
        }
      );

      const data = await response.json();

      if (data.successful) {
        setWishlist((prevWishlist) =>
          prevWishlist.filter((item) => item.id !== id)
        );
      }
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const handleShowDetails = (item) => {
    setSelectedItem(item);
    setSelectedImageIndex(0); // Reset index to the first image
    setModalShow(true);
  };

  const handleCloseModal = () => {
    setModalShow(false);
    setSelectedItem(null);
  };

  return (
    <AppTheme>
      <CssBaseline enableColorScheme />
      <Box>
        <AppAppBar />
        <div className="container my-5" style={{ paddingTop: "80px" }}>
          <h1 className="mb-4 text-center text-uppercase">Wishlist</h1>

          {wishlist.length > 0 ? (
            <div className="row gx-4 gy-4">
              {wishlist.map((listing, index) => (
                <div
                  key={listing.id || index}
                  className="col-lg-4 col-md-6 d-flex align-items-stretch"
                >
                  <div className="card h-100 w-100 shadow d-flex flex-column">
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
                        height: "300px",
                        objectFit: "cover",
                        borderRadius: "2px",
                        border: "2px solid grey",
                      }}
                    />
                    <div className="card-body text-center d-flex flex-column justify-content-between">
                      <h5 className="card-title">{listing.title}</h5>
                      <p>
                        <strong>Starting Price:</strong> ${listing.minimum_bid}
                      </p>
                      <p>
                        <strong>Current Bid:</strong> $
                        {currentBids[listing.id] ?? "Loading..."}
                      </p>
                      <p>
                        <strong>Buy-Now Price:</strong> ${listing.buy_now}
                      </p>

                      <div className="mt-auto d-flex justify-content-between gap-2">
                        <button
                          className="btn btn-danger flex-grow-1"
                          onClick={() => handleRemoveFromWishlist(listing.id)}
                        >
                          Remove
                        </button>
                        <button
                          className="btn btn-primary flex-grow-1"
                          onClick={() => handleShowDetails(listing)}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center">Your wishlist is empty.</p>
          )}
        </div>
      </Box>

      {/* Modal */}
      {modalShow && selectedItem && (
        <div className="custom-modal">
          <div className="custom-modal-content">
            {/* Image Navigation Buttons */}
            {selectedItem.image_urls?.length > 1 && (
              <>
                {/* Left Arrow Button */}
                <button
                  onClick={() =>
                    setSelectedImageIndex((prev) =>
                      prev === 0 ? selectedItem.image_urls.length - 1 : prev - 1
                    )
                  }
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "2rem",
                    background: "rgba(0, 0, 0, 0.3)",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                    padding: "15px",
                    borderRadius: "50%",
                    transition: "background 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "50px",
                    height: "50px",
                    backdropFilter: "blur(5px)",
                  }}
                  onMouseOver={(e) =>
                    (e.target.style.background = "rgba(0, 0, 0, 0.6)")
                  }
                  onMouseOut={(e) =>
                    (e.target.style.background = "rgba(0, 0, 0, 0.3)")
                  }
                >
                  {"❮"}
                </button>

                {/* Right Arrow Button */}
                <button
                  onClick={() =>
                    setSelectedImageIndex((prev) =>
                      prev === selectedItem.image_urls.length - 1 ? 0 : prev + 1
                    )
                  }
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "2rem",
                    background: "rgba(0, 0, 0, 0.3)",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                    padding: "15px",
                    borderRadius: "50%",
                    transition: "background 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "50px",
                    height: "50px",
                    backdropFilter: "blur(5px)",
                  }}
                  onMouseOver={(e) =>
                    (e.target.style.background = "rgba(0, 0, 0, 0.6)")
                  }
                  onMouseOut={(e) =>
                    (e.target.style.background = "rgba(0, 0, 0, 0.3)")
                  }
                >
                  {"❯"}
                </button>
              </>
            )}

            {/* Image Display */}
            <Box
              component="img"
              src={
                selectedItem.image_urls?.[selectedImageIndex] ||
                "/placeholder.jpg"
              }
              alt={selectedItem.title}
              sx={{
                width: "100%",
                maxWidth: "80vw",
                height: "auto",
                maxHeight: "60vh",
                objectFit: "contain",
              }}
            />

            {/* Item Details */}
            <h2>{selectedItem.title}</h2>
            <p>
              <strong>Description:</strong> {selectedItem.description}
            </p>
            <p>
              <strong>Starting Price:</strong> ${selectedItem.minimum_bid}
            </p>
            <p>
              <strong>Current Bid:</strong> $
              {currentBids[selectedItem?.id] ?? "Loading..."}
            </p>
            <p>
              <strong>Buy-Now Price:</strong> ${selectedItem.buy_now}
            </p>

            {/* Buttons Section */}
            <div className="d-flex justify-content-between mt-3 gap-2">
              <button
                className="btn btn-danger flex-grow-1"
                onClick={handleCloseModal}
              >
                Close
              </button>
              <Link
                to="/place-bid"
                state={{
                  ...selectedItem,
                  current_bid: currentBids[selectedItem.id] || 0,
                }}
                className="btn btn-success flex-grow-1 text-center"
              >
                Place Bid
              </Link>
              <button
                className="btn btn-warning flex-grow-1"
                onClick={() =>
                  navigate("/checkout", {
                    state: {
                      productName: selectedItem.title,
                      price: selectedItem.buy_now,
                    },
                  })
                }
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Styles - Matches Home Modal */}
      <style>
        {`
        .custom-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        .custom-modal-content {
            background-color: #1c1c1c;
            padding: 20px;
            border-radius: 10px;
            width: 80%;
            max-width: 500px;
            position: relative;
            color: white;
        }
        `}
      </style>
    </AppTheme>
  );
}

export default Wishlist;
