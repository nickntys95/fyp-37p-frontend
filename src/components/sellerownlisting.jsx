import * as React from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { Data } from "@react-google-maps/api";

const token = sessionStorage.getItem("token") || "";

// Utility function to parse the date
function parseDate(dateString) {
  return new Date(dateString);
}

// Utility function to calculate time left
function calculateTimeLeft(futureDate) {
  const future = parseDate(futureDate);
  const now = new Date();
  now.setHours(now.getHours() + 8);
  const difference = future - now;

  if (isNaN(future)) {
    console.error("Invalid future date:", futureDate);
    return "Invalid Date";
  }

  if (difference <= 0) return "Expired";

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((difference / (1000 * 60)) % 60);
  const seconds = Math.floor((difference / 1000) % 60);

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

export default function SellerOwnListing() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("upcoming");
  const [listings, setListings] = useState([]);
  const [error, setError] = useState(null);

  const fetchListings = async () => {
    try {
      const response = await fetch(
        "https://fyp-37p-api-a16b479cb42b.herokuapp.com/listing/get_own",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Response Status:", response.status); // Debug response status
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData); // Log error data for debugging
        setError(errorData.error || "Failed to fetch listings");
        return;
      }

      const data = await response.json();
      console.log("Fetched Listings:", data); // Log fetched data for debugging
      setListings(data);
      setError(null); // Clear errors
    } catch (err) {
      console.error("Network or Parsing Error:", err);
      setError("An error occurred while fetching listings");
    }
  };

  useEffect(() => {
    fetchListings();
  }, [token]);

  // Categorize listings
  const now = new Date();
  now.setHours(now.getHours() + 8);
  //console.log("Current Time (SGT):", now.toLocaleString('en-GB', { timeZone: 'Asia/Singapore' }));
  const UpcomingList = listings?.filter((item) => {
    const startDate = new Date(item.start_at);
    //console.log("Start Date:", startDate, "Now:", now); // Debugging line
    return startDate > now;
  });
  const CurrentList = listings?.filter((item) => {
    const startDate = new Date(item.start_at);
    const endDate = new Date(item.end_at);
    return startDate <= now && endDate > now;
  });
  const PastList = listings?.filter((item) => new Date(item.end_at) < now);

  const getDisplayedList = () => {
    if (selectedTab === "upcoming")
      return (
        <div className="container my-5">
          <h1 className="mb-4 text-center text-uppercase">
            Upcoming Auction Listings
          </h1>
          <Section
            list={UpcomingList}
            type="upcoming"
            navigate={navigate}
            setListings={setListings}
            listings={listings}
          />
        </div>
      );
    if (selectedTab === "ongoing")
      return (
        <div className="container my-5">
          <h1 className="mb-4 text-center text-uppercase">
            Ongoing Auction Listings
          </h1>
          <Section
            list={CurrentList}
            type="current"
            navigate={navigate}
            setListings={setListings}
            listings={listings}
          />
        </div>
      );
    if (selectedTab === "past")
      return (
        <div className="container my-5">
          <h1 className="mb-4 text-center text-uppercase">
            Auction Listing History
          </h1>
          <Section
            list={PastList}
            type="past"
            navigate={navigate}
            setListings={setListings}
            listings={listings}
          />
        </div>
      );
  };

  return (
    <Container
      id="SellerAuctionListings"
      sx={{ display: "flex", flexDirection: "row", pt: 2, m: 0 }}
    >
      <Box
        sx={{
          width: "200px",
          flexShrink: 0,
          borderTop: "2px solid #ccc",
          borderRight: "2px solid #ccc",
          p: 2,
          minHeight: "100vh",
          backgroundColor: "#f8f8f8",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
          Manage My Listings
        </Typography>
        <Button
          fullWidth
          sx={tabButtonStyle(selectedTab === "upcoming")}
          onClick={() => setSelectedTab("upcoming")}
        >
          Upcoming Auction Listing
        </Button>
        <Button
          fullWidth
          sx={tabButtonStyle(selectedTab === "ongoing")}
          onClick={() => setSelectedTab("ongoing")}
        >
          Ongoing Auction Listing
        </Button>
        <Button
          fullWidth
          sx={tabButtonStyle(selectedTab === "past")}
          onClick={() => setSelectedTab("past")}
        >
          Auction Listing History
        </Button>
      </Box>

      <Box sx={{ flexGrow: 1, p: 3 }}>{getDisplayedList()}</Box>
    </Container>
  );
}

// Tab button style
const tabButtonStyle = (isSelected) => ({
  textAlign: "left",
  fontSize: "1.2rem",
  fontWeight: isSelected ? "bold" : "normal",
  color: isSelected ? "#1976D2" : "#333",
  backgroundColor: isSelected ? "#E3F2FD" : "transparent",
  mb: 1,
  "&:hover": {
    backgroundColor: "#BBDEFB",
  },
});

// Reusable section component
function Section({ title, list, type, navigate, setListings, listings }) {
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const [open, setOpen] = useState(false); // Controls modal visibility
  const [selectedId, setSelectedId] = useState(null); // Stores listing ID for deletion

  const handleDeleteClick = (listingId) => {
    setSelectedId(listingId);
    setOpen(true); // Open the confirmation modal
  };

  const handleConfirmDelete = async () => {
    setOpen(false);
    const listingId = selectedId;
    const imageUrls = listings?.find(
      (item) => item.id === listingId
    )?.image_urls; // Get all image URLs of the selected listing

    try {
      // Step 1: Delete all images
      for (const imageUrl of imageUrls) {
        const deleteImageResponse = await fetch(
          "https://fyp-37p-api-a16b479cb42b.herokuapp.com/listing/delete_image",
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              listing_id: listingId,
              image_url: imageUrl,
            }),
          }
        );

        const deleteImageData = await deleteImageResponse.json();
        console.log("Delete Image Response:", deleteImageData);

        if (!deleteImageResponse.ok) {
          alert(deleteImageData.error || "Failed to delete the image");
          return;
        }
      }

      // Step 2: After successfully deleting all images, delete the listing
      const deleteListingResponse = await fetch(
        `https://fyp-37p-api-a16b479cb42b.herokuapp.com/listing/delete/${listingId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token") || ""}`,
          },
        }
      );

      const deleteListingData = await deleteListingResponse.json();
      console.log("Delete Listing Response:", deleteListingData);

      if (!deleteListingResponse.ok) {
        alert(deleteListingData.error || "Failed to delete the listing");
        return;
      }

      // Notify the user and update the listings
      setOpenSnackbar(true);
      setListings((prevListings) =>
        prevListings?.filter((item) => item.id !== listingId)
      );
    } catch (error) {
      console.error("Error deleting image or listing:", error);
      alert("An error occurred while deleting the image or listing");
    }
  };

  const handleButtonClick = (id, type) => {
    if (type === "current") {
      // Handle view action
      console.log("Viewing auction with ID:", id);
      // You can navigate to the auction page or perform other actions
      navigate(`/SellerMonitorBids/${id}`);
    } else {
      // Handle delete action
      console.log("Deleting auction with ID:", id);
      handleDeleteClick(id); // Your existing delete handler
    }
  };

  return (
    <Container
      id="SAuctionListings"
      sx={{ display: "flex", flexDirection: "column", m: 0 }}
    >
      <Box sx={{ textAlign: "center", width: "100%" }}>
        <Typography
          component="h1"
          variant="h4"
          gutterBottom
          sx={{ fontSize: "2.50rem" }}
        >
          {title}
        </Typography>
      </Box>
      {/* Snackbar for Auto-Closing Notification */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000} // Close after 3 seconds
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity="success"
          sx={{
            fontSize: "1.5rem", // Adjust font size
            padding: "12px", // Add more spacing
          }}
        >
          Listing deleted successfully!
        </Alert>
      </Snackbar>
      <Grid
        container
        spacing={4}
        sx={{ width: "100%", justifyContent: "flex-start", m: 0 }}
      >
        {list.map((item, index) => (
          <Grid item xs={12} sm={4} md={4} key={index} sx={{ display: "flex" }}>
            <Card
              variant="outlined"
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                flexGrow: 1,
                width: "100%",
              }}
            >
              <CardContent>
                <Box
                  component="img"
                  src={
                    Array.isArray(item.image_urls) && item.image_urls.length > 0
                      ? item.image_urls[0]
                      : ""
                  }
                  alt={item.title}
                  sx={{
                    width: "100%",
                    height: "300px",
                    objectFit: "cover",
                    borderRadius: "2px",
                    border: "2px solid grey",
                  }}
                />
              </CardContent>
              <CardHeader
                title={item.title}
                subheader={getSubheader(item, type)}
                sx={{
                  ".MuiCardHeader-title": {
                    fontSize: "2rem",
                    fontWeight: "bold",
                  },
                  ".MuiCardHeader-subheader": {
                    fontSize: "1.35rem",
                    width: "100%",
                  },
                }}
              />
              <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
                {type !== "current" && (
                  <button
                    className="btn btn-primary"
                    style={{
                      borderRadius: "30px",
                      width: "100%",
                    }}
                    onClick={() =>
                      navigate(`/sellerviewalistingpage/${item.id}`)
                    }
                  >
                    View Details
                  </button>
                )}

                <button
                  className="btn btn-primary"
                  style={{
                    borderRadius: "30px",
                    width: "100%",
                    backgroundColor: "grey",
                  }}
                  onClick={() => handleButtonClick(item.id, type)}
                >
                  {type === "current" ? "View" : "Delete"}
                </button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle sx={{ fontSize: "2rem", fontWeight: "bold" }}>
          Confirm Deletion
        </DialogTitle>
        <DialogContent sx={{ fontSize: "1.5rem" }}>
          Are you sure you want to delete this listing?
        </DialogContent>
        <DialogActions>
          <Button sx={{ fontSize: "1.5rem" }} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            sx={{ fontSize: "1.5rem" }}
            onClick={handleConfirmDelete}
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

// Helper function to generate subheader content
function getSubheader(item, type) {
  if (type === "upcoming") {
    return (
      <>
        <div>
          Auction Start Date:
          <br />
          {cleanDateString(item.start_at)}
        </div>
        <div>Starting Price: ${item.minimum_bid}</div>
      </>
    );
  } else if (type === "current") {
    return (
      <>
        <div>Time Left: {calculateTimeLeft(item.end_at)}</div>
      </>
    );
  } else if (type === "past") {
    return (
      <>
        <div>
          Auction ended on:
          <br />
          {cleanDateString(item.end_at)}
        </div>
      </>
    );
  }
}

function cleanDateString(dateString) {
  return dateString.replace("T", " | ").replace("+00:00", "");
}
