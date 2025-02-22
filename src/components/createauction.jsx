import * as React from "react";
import { useState, useEffect } from "react";
import FormLabel from "@mui/material/FormLabel";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import OutlinedInput from "@mui/material/OutlinedInput";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { styled } from "@mui/system";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import Typography from "@mui/material/Typography";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";

const token = sessionStorage.getItem("token") || "";

const FormGrid = styled(Grid)(() => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
}));

const ImageSlider = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = (e) => {
    e.preventDefault();
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + images.length) % images.length
    );
  };

  const handleNext = (e) => {
    e.preventDefault();
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const handleDotClick = (index) => {
    setCurrentIndex(index);
  };

  if (images.length === 1) {
    return (
      <div className="image-slider">
        <img src={images[0]} alt="Image" />
      </div>
    );
  }

  return (
    <div className="image-slider">
      <img src={images[currentIndex]} alt={`Image ${currentIndex + 1}`} />
      <a className="prev" onClick={handlePrevious}>
        &#10094;
      </a>
      <a className="next" onClick={handleNext}>
        &#10095;
      </a>
      <div style={{ textAlign: "center" }}>
        {images.map((image, index) => (
          <span
            key={index + 1}
            className={`dot ${currentIndex === index ? "active" : ""}`}
            onClick={() => handleDotClick(index)}
          ></span>
        ))}
      </div>
    </div>
  );
};

export default function CreateAuction() {
  const [formData, setFormData] = useState({
    title: "", // Maps to "title"
    description: "", // Maps to "description"
    item_type: "Product", // Maps to "item_type"
    auction_strategy: "English", // Maps to "auction_strategy"
    image_urls: [], // Will store the uploaded image URL (array)
    minimum_bid: "", // Maps to "minimum_bid"
    minimum_increment: "", // Maps to "minimum_increment"
    buy_now: "", // Maps to "buy_now"
    start_at: "", // Maps to "start_at" (timestamp with timezone)
    end_at: "", // Maps to "end_at" (timestamp with timezone)
  });

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success"); // 'success', 'error'
  const navigate = useNavigate();
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const now = new Date();
    const formattedDateTime = now.toISOString().slice(0, 16);
    setCurrentDateTime(formattedDateTime);
  }, []);

  const auctionDescriptions = {
    English:
      "*English auction starts at a low price and increases until it reaches the auction end date.",
    Dutch:
      "*Dutch auction starts at a high price and will decrease until it reaches the auction end date",
    "Sealed-Bid":
      "*Sealed-Bid auction, all bidders submit their bids in secret, and the highest bid wins.",
  };

  const handleImageChange = (event) => {
    const files = event.target.files;
    if (files) {
      const imageFiles = Array.from(files); // Store actual file objects
      const imagePreviews = imageFiles.map((file) => URL.createObjectURL(file));

      setFormData((prev) => ({
        ...prev,
        image_urls: [...prev.image_urls, ...imagePreviews], // Keep previews
        imageFiles: [...(prev.imageFiles || []), ...imageFiles], // Store files separately
      }));
    }
  };

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
      // Ensure min bid increment is set to 0 if auction strategy is "Sealed-Bid"
      minimum_increment:
        name === "auction_strategy" &&
        (value === "Sealed-Bid" || value === "Dutch")
          ? 0
          : prevState.minimum_increment,
    }));

    if (files) {
      setFormData((prevState) => ({
        ...prevState,
        image: URL.createObjectURL(files[0]),
      }));
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return; // Prevent multiple submissions
    setIsSubmitting(true);

    const { image_urls, ...filteredFormData } = formData;

    try {
      const response = await fetch(
        "https://fyp-37p-api-a16b479cb42b.herokuapp.com/listing/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(filteredFormData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log("Success:", responseData);

      const listingId = responseData.id;
      console.log("Listingid:", listingId);

      if (formData.image_urls.length > 0) {
        // UPDATED
        await uploadImages(listingId, formData.image_urls);
      }

      setSnackbarMessage("Auction successfully created! Redirecting...");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
    } catch (error) {
      console.error("Error submitting form:", error);
      setSnackbarMessage("Failed to create auction. Please try again.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
      }, 3000);
      setTimeout(() => {
        navigate("/sellerownlistingpage");
      }, 3000);
    }
  };

  const uploadImages = async (listingId) => {
    if (!formData.imageFiles || formData.imageFiles.length === 0) return;

    for (const file of formData.imageFiles) {
      const formDataToUpload = new FormData();
      formDataToUpload.append("listing_id", listingId);
      formDataToUpload.append("image", file); // Ensure this is a File object

      try {
        const response = await fetch(
          "https://fyp-37p-api-a16b479cb42b.herokuapp.com/listing/upload_image",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formDataToUpload,
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to upload image. Status: ${response.status}`);
        }

        console.log("Image uploaded successfully");
      } catch (error) {
        console.error("Image upload error:", error);
      }
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="container my-5" style={{ marginTop: "100px" }}>
        <h1 className="mb-4 text-center text-uppercase">Create Listing</h1>
      </div>
      <Grid container spacing={3}>
        {/* Left Sidebar - Upload Images */}
        <Grid item xs={12} md={3}>
          <Box
            sx={{
              border: "1px solid #ccc",
              padding: 2,
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center", // Centers horizontally
              justifyContent: "center", // Centers vertically
              height: "100%", // Ensures full height of the grid item
              marginLeft: 1,
            }}
          >
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => document.getElementById("item-image").click()}
              sx={{ fontSize: "1.30rem", padding: "6px 12px", width: "120px" }}
            >
              Upload Images
            </Button>
            <input
              type="file"
              accept="image/*"
              id="item-image"
              name="image_urls"
              multiple
              style={{ display: "none" }}
              onChange={handleImageChange}
            />
            {formData.image_urls.length > 0 && (
              <ImageSlider images={formData.image_urls} />
            )}
          </Box>
        </Grid>

        {/* Right Content - Form Fields */}
        <Grid item xs={12} md={9}>
          <Grid container spacing={3}>
            <FormGrid item xs={12}>
              <FormLabel sx={{ fontSize: "1.30rem" }} htmlFor="item-name">
                Item Name
              </FormLabel>
              <OutlinedInput
                id="item-name"
                name="title"
                type="text"
                sx={{ fontSize: "1.30rem" }}
                placeholder="The name / title of the item"
                required
                value={formData.title}
                onChange={handleChange}
              />
            </FormGrid>

            <FormGrid item xs={12} md={6}>
              <FormLabel sx={{ fontSize: "1.30rem" }} htmlFor="item-type">
                Category
              </FormLabel>
              <Select
                sx={{ fontSize: "1.30rem" }}
                id="item-type"
                name="item_type"
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
            </FormGrid>

            <FormGrid item xs={12}>
              <FormLabel
                sx={{ fontSize: "1.30rem" }}
                htmlFor="item-description"
              >
                Item Description
              </FormLabel>
              <OutlinedInput
                id="item-description"
                name="description"
                type="text"
                sx={{ fontSize: "1.30rem" }}
                placeholder="Detailed description of the item"
                required
                value={formData.description}
                onChange={handleChange}
              />
            </FormGrid>

            <FormGrid item xs={12} md={6}>
              <FormLabel sx={{ fontSize: "1.30rem" }} htmlFor="auction-type">
                Auction Strategy
              </FormLabel>
              <Box sx={{ fontSize: "1.1rem" }}>
                {auctionDescriptions[formData.auction_strategy]}
              </Box>
              <Select
                sx={{ fontSize: "1.30rem" }}
                id="auction-type"
                name="auction_strategy"
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
            </FormGrid>

            <Grid item xs={12} md={6}></Grid>

            <FormGrid item xs={12} md={4}>
              <FormLabel
                sx={{ fontSize: "1.30rem" }}
                htmlFor="start-price"
                required
              >
                Starting Price
              </FormLabel>
              <OutlinedInput
                id="start-price"
                name="minimum_bid"
                type="number"
                placeholder="USD $"
                required
                size="small"
                sx={{ fontSize: "1.30rem" }}
                inputProps={{ min: 0 }}
                value={formData.minimum_bid}
                onChange={handleChange}
              />
            </FormGrid>

            {formData.auction_strategy !== "Sealed-Bid" &&
              formData.auction_strategy !== "Dutch" && (
                <FormGrid item xs={12} md={4}>
                  <FormLabel sx={{ fontSize: "1.30rem" }} htmlFor="min-bid">
                    {formData.auction_strategy === "Dutch"
                      ? "Min Bid Decrement"
                      : "Min Bid Increment"}
                  </FormLabel>
                  <OutlinedInput
                    id="min-bid"
                    name="minimum_increment"
                    type="number"
                    placeholder="USD $"
                    required
                    size="small"
                    sx={{ fontSize: "1.30rem" }}
                    inputProps={{ min: 0 }}
                    value={formData.minimum_increment}
                    onChange={handleChange}
                    disabled={formData.auction_strategy === "Sealed-Bid"}
                  />
                </FormGrid>
              )}

            <FormGrid item xs={12} md={4}>
              <FormLabel sx={{ fontSize: "1.30rem" }} htmlFor="buy-price">
                Buy Now Price
              </FormLabel>
              <OutlinedInput
                id="buy-price"
                name="buy_now"
                type="number"
                placeholder="USD $"
                size="small"
                sx={{ fontSize: "1.30rem" }}
                inputProps={{ min: 0 }}
                value={formData.buy_now}
                onChange={handleChange}
              />
            </FormGrid>

            <FormGrid item xs={12} md={6}>
              <FormLabel sx={{ fontSize: "1.30rem" }} htmlFor="start-date">
                Auction Start Date
              </FormLabel>
              <OutlinedInput
                id="start-date"
                name="start_at"
                type="datetime-local"
                sx={{ fontSize: "1.30rem" }}
                required
                value={formData.start_at}
                onChange={handleChange}
              />
            </FormGrid>

            <FormGrid item xs={12} md={6}>
              <FormLabel sx={{ fontSize: "1.30rem" }} htmlFor="end-date">
                Auction End Date
              </FormLabel>
              <OutlinedInput
                id="end-date"
                name="end_at"
                type="datetime-local"
                sx={{ fontSize: "1.30rem" }}
                required
                value={formData.end_at}
                onChange={handleChange}
              />
            </FormGrid>
          </Grid>
        </Grid>
      </Grid>

      {/* Submit & Cancel Buttons */}
      <Box
        sx={{
          marginTop: 2,
          paddingRight: 5,
          display: "flex",
          justifyContent: "flex-end",
          gap: 2,
        }}
      >
        <Button
          sx={{
            fontSize: "1.30rem",
            backgroundColor: "gray", // Set background color here
            color: "white", // Set text color here
          }}
          onClick={() => navigate(-1)}
        >
          Cancel
        </Button>
        <Button
          sx={{
            fontSize: "1.30rem",
            backgroundColor: "#0d6efd", // Set background color here
            color: "white", // Set text color here
          }}
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submit" : "Submit"}
        </Button>
      </Box>
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
  );
}
