import * as React from "react";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import FormLabel from "@mui/material/FormLabel";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import OutlinedInput from "@mui/material/OutlinedInput";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { styled } from "@mui/system";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const token = sessionStorage.getItem("token") || "";

const FormGrid = styled(Grid)(() => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
}));

const ImageSlider = ({ images, onImageChange }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = (e) => {
    e.preventDefault();
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + images.length) % images.length
    );
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

  return (
    <div className="image-slider">
      <img
        src={images[currentIndex]}
        alt={`Image ${currentIndex + 1}`}
        style={{ width: "100%", maxHeight: "400px", objectFit: "contain" }}
      />
      <a className="prev" onClick={handlePrevious}>
        &#10094;
      </a>
      <a className="next" onClick={handleNext}>
        &#10095;
      </a>
      <div style={{ textAlign: "center" }}>
        {images.map((_, index) => (
          <span
            key={index}
            className={`dot ${currentIndex === index ? "active" : ""}`}
            onClick={() => handleDotClick(index)}
          ></span>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "2px",
          marginTop: "10px",
          marginLeft: "5px",
        }}
      ></div>
    </div>
  );
};

const AdminEdit = () => {
  const { itemId } = useParams(); // Get itemId from the route
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "", // Maps to "title"
    description: "", // Maps to "description"
    item_type: "Product", // Maps to "item_type"
    auction_strategy: "English", // Maps to "auction_strategy"
    image_urls: [], // Will store the uploaded image URL (string)
    minimum_bid: 0, // Maps to "minimum_bid"
    minimum_increment: 0, // Maps to "minimum_increment"
    buy_now: 0, // Maps to "buy_now"
    start_at: "", // Maps to "start_at" (timestamp with timezone)
    end_at: "", // Maps to "end_at" (timestamp with timezone)
  });

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [listings, setListings] = useState([]);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("No file chosen");
  const [currentImageUrl, setCurrentImageUrl] = useState(null);

  const handleImageChange = (imageUrl) => {
    setCurrentImageUrl(imageUrl);
    console.log("Current Image URL:", imageUrl);
  };

  // Load the item data based on itemId
  useEffect(() => {
    const now = new Date();
    setCurrentDateTime(now.toISOString().slice(0, 16));

    const fetchListings = async () => {
      try {
        const response = await fetch(
          "https://fyp-37p-api-a16b479cb42b.herokuapp.com/listing/get_all",
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

        // Find the item by item_id after fetching listings
        const foundItem = data.find((item) => item.id === parseInt(itemId));
        setSelectedItem(foundItem);
      } catch (err) {
        console.error("Network or Parsing Error:", err);
        setError("An error occurred while fetching listings");
      }
    };

    fetchListings();
  }, [itemId]);

  useEffect(() => {
    if (selectedItem) {
      setFormData({
        title: selectedItem.title,
        item_type: selectedItem.item_type,
        description: selectedItem.description,
        auction_strategy: selectedItem.auction_strategy,
        image_urls: selectedItem.image_urls,
        minimum_bid: selectedItem.minimum_bid,
        minimum_increment: selectedItem.minimum_increment,
        buy_now: selectedItem.buy_now,
        start_at: selectedItem.start_at
          ? selectedItem.start_at.slice(0, 16)
          : "",
        end_at: selectedItem.end_at ? selectedItem.end_at.slice(0, 16) : "",
      });
    } else {
      console.log("Item not found for ID:", itemId);
    }
  }, [selectedItem]); // Only re-run the effect when selectedItem changes

  const handleChange = (event) => {
    console.log("Component re-rendered");
    const { name, value } = event.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const { image_urls, ...formDataWithoutImages } = formData;

    if (formData.auction_strategy === "Sealed-Bid") {
      formData.minimum_increment = 0;
    }

    if (!token) {
      alert("You need to be logged in to update the listing.");
      return;
    }

    try {
      const response = await fetch(
        `https://fyp-37p-api-a16b479cb42b.herokuapp.com/listing/admin_update/${itemId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...formDataWithoutImages,
            minimum_bid: parseFloat(formData.minimum_bid),
            minimum_increment: parseFloat(formData.minimum_increment),
            buy_now: parseFloat(formData.buy_now),
            start_at: formData.start_at,
            end_at: formData.end_at,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Failed to update: ${errorData.error}`);
        return;
      } else {
        setSnackbarMessage("Listing updated successfully! Redirecting...");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        // Navigate after a short delay
        setTimeout(() => {
          navigate(`/adminhome`);
        }, 3000);
      }
    } catch (error) {
      console.error("Error updating listing:", error);
      alert("An error occurred while updating the listing.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box id="CreateListing" sx={{ padding: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: 2,
                border: "1px solid #ddd",
                borderRadius: 2,
                boxShadow: 2,
              }}
            >
              <FormLabel sx={{ fontSize: "1.50rem" }}>Item Image</FormLabel>
              <ImageSlider
                images={formData.image_urls}
                onImageChange={handleImageChange}
              />

              <Box sx={{ textAlign: "center", marginTop: "10px" }}>
                <input
                  type="file"
                  accept="image/*"
                  id="file-upload"
                  style={{ display: "none" }} // Hide the default input
                />
                <label htmlFor="file-upload">
                  <Box sx={{ paddingBottom: "60px" }}></Box>
                </label>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={7}>
            <FormGrid>
              <FormLabel
                htmlFor="item-name"
                required
                sx={{ fontSize: "1.30rem" }}
              >
                Item Name
              </FormLabel>
              <OutlinedInput
                id="item-name"
                name="title"
                type="text"
                placeholder="The name / title of the item"
                required
                size="small"
                sx={{ fontSize: "1.30rem" }}
                value={formData.title}
                onChange={handleChange}
              />

              <FormLabel
                htmlFor="item-type"
                required
                sx={{ fontSize: "1.30rem", paddingTop: "5px" }}
              >
                Category
              </FormLabel>
              <Select
                id="item-type"
                name="item_type"
                size="small"
                sx={{ fontSize: "1.30rem" }}
                value={formData.item_type}
                onChange={handleChange}
              >
                <MenuItem sx={{ fontSize: "1.30rem" }} value="Product">
                  Product
                </MenuItem>
                <MenuItem sx={{ fontSize: "1.30rem" }} value="Accessories">
                  Accessories
                </MenuItem>
                <MenuItem sx={{ fontSize: "1.30rem" }} value="Antiques">
                  Antiques
                </MenuItem>
                <MenuItem sx={{ fontSize: "1.30rem" }} value="Electronics">
                  Electronics
                </MenuItem>
                <MenuItem sx={{ fontSize: "1.30rem" }} value="Fashion">
                  Fashion
                </MenuItem>
                <MenuItem sx={{ fontSize: "1.30rem" }} value="Furniture">
                  Furniture
                </MenuItem>
                <MenuItem sx={{ fontSize: "1.30rem" }} value="Industrial">
                  Industrial
                </MenuItem>
                <MenuItem sx={{ fontSize: "1.30rem" }} value="Paintings">
                  Paintings
                </MenuItem>
                <MenuItem sx={{ fontSize: "1.30rem" }} value="Others">
                  Others
                </MenuItem>
              </Select>

              <FormLabel
                htmlFor="item-description"
                required
                sx={{ fontSize: "1.30rem", paddingTop: "5px" }}
              >
                Item Description
              </FormLabel>
              <OutlinedInput
                id="item-description"
                name="description"
                type="text"
                placeholder="Detailed description of the item"
                required
                size="small"
                sx={{ fontSize: "1.30rem" }}
                value={formData.description}
                onChange={handleChange}
              />

              <FormLabel
                htmlFor="auction-type"
                required
                sx={{ fontSize: "1.30rem", paddingTop: "5px" }}
              >
                Auction Strategy
              </FormLabel>
              <Select
                id="auction-type"
                name="auction_strategy"
                size="small"
                sx={{ fontSize: "1.30rem" }}
                value={formData.auction_strategy}
                onChange={handleChange}
              >
                <MenuItem sx={{ fontSize: "1.30rem" }} value="English">
                  English
                </MenuItem>
                <MenuItem sx={{ fontSize: "1.30rem" }} value="Dutch">
                  Dutch
                </MenuItem>
                <MenuItem sx={{ fontSize: "1.30rem" }} value="Sealed-Bid">
                  Sealed-Bid
                </MenuItem>
              </Select>

              <FormLabel
                htmlFor="start-price"
                required
                sx={{ fontSize: "1.30rem", paddingTop: "5px" }}
              >
                Starting Price
              </FormLabel>
              <OutlinedInput
                id="start-price"
                name="minimum_bid"
                type="number"
                required
                size="small"
                sx={{ fontSize: "1.30rem" }}
                value={formData.minimum_bid}
                onChange={handleChange}
              />

              <FormLabel
                htmlFor="min-bid"
                required
                sx={{ fontSize: "1.30rem", paddingTop: "5px" }}
              >
                {formData.auction_strategy === "Sealed-Bid"
                  ? "Disabled for Sealed-Bid auction"
                  : formData.auction_strategy === "Dutch"
                  ? "Min Bid Decrement"
                  : "Min Bid Increment"}
              </FormLabel>
              <OutlinedInput
                id="min-bid"
                name="minimum_increment"
                type="number"
                required
                size="small"
                sx={{ fontSize: "1.30rem" }}
                value={formData.minimum_increment}
                onChange={handleChange}
                disabled={formData.auction_strategy === "Sealed-Bid"}
              />

              <FormLabel
                htmlFor="buy-price"
                required
                sx={{ fontSize: "1.30rem", paddingTop: "5px" }}
              >
                {formData.auction_strategy === "Dutch"
                  ? "Buy Now Price (value to be same as Starting Price)"
                  : "Buy Now Price (value to be higher than Starting Price)"}
              </FormLabel>
              <OutlinedInput
                id="buy-price"
                name="buy_now"
                type="number"
                size="small"
                sx={{ fontSize: "1.30rem" }}
                value={formData.buy_now}
                onChange={handleChange}
              />

              <FormLabel
                htmlFor="start-date"
                required
                sx={{ fontSize: "1.30rem", paddingTop: "5px" }}
              >
                Auction Start Date
              </FormLabel>
              <OutlinedInput
                id="start-date"
                name="start_at"
                type="datetime-local"
                size="small"
                sx={{ fontSize: "1.30rem" }}
                value={formData.start_at}
                onChange={handleChange}
              />

              <FormLabel
                htmlFor="end-date"
                required
                sx={{ fontSize: "1.30rem", paddingTop: "5px" }}
              >
                Auction End Date
              </FormLabel>
              <OutlinedInput
                id="end-date"
                name="end_at"
                type="datetime-local"
                size="small"
                sx={{ fontSize: "1.30rem" }}
                value={formData.end_at}
                onChange={handleChange}
              />
            </FormGrid>

            <Box
              sx={{
                marginTop: 2,
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
              }}
            >
              <Button
                sx={{
                  fontSize: "1.35rem",
                  backgroundColor: "gray",
                  color: "white",
                }}
                size="small"
                onClick={() => {
                  navigate(`/adminhome`);
                }}
              >
                Cancel
              </Button>
              <Button
                sx={{
                  fontSize: "1.35rem",
                  backgroundColor: "#0d6efd",
                  color: "white",
                }}
                type="submit"
                csize="small"
              >
                Save Changes
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%", fontSize: "1.50rem" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </form>
  );
};
export default AdminEdit;
