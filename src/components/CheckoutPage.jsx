import React, { useState, useEffect } from "react";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import AppAppBar from "./appbar";
import AppTheme from "../shared-theme/AppTheme";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";

function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = sessionStorage.getItem("token");

  const { id: listing_id, title, buy_now, image_urls } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState("paypal");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState(null);

  // ✅ Extract order ID from PayPal redirect URL
  useEffect(() => {
    const order_id = searchParams.get("token");
    if (order_id) {
      setOrderId(order_id);
      confirmPayment(order_id);
    }
  }, [searchParams]);

  // ✅ Confirm Payment & Redirect to Confirmation Page
  const confirmPayment = async (order_id) => {
    setIsProcessing(true);
    try {
      const response = await fetch(
        `https://fyp-37p-api-a16b479cb42b.herokuapp.com/bid/confirm_payment/${order_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      console.log("✅ Payment Confirmation Response:", data);

      if (data.successful) {
        sessionStorage.setItem("bidAmount", buy_now); // Save bid amount
        navigate("/confirmation");
      } else {
        alert(`❌ Payment confirmation failed: ${data.error}`);
      }
    } catch (error) {
      console.error("❌ Error confirming payment:", error);
      alert("An error occurred while confirming your payment.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ Redirect to PayPal Payment
  const handlePayment = async () => {
    if (paymentMethod !== "paypal") {
      alert("Currently, only PayPal is supported.");
      return;
    }

    setIsProcessing(true);

    try {
      if (!listing_id) {
        throw new Error("❌ Listing ID is missing. Unable to process payment.");
      }

      const response = await fetch(
        "https://fyp-37p-api-a16b479cb42b.herokuapp.com/bid/init_payment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount: buy_now.toString(), listing_id }),
        }
      );

      const data = await response.json();
      console.log(
        "📌 Full PayPal API Response:",
        JSON.stringify(data, null, 2)
      );

      if (data.successful && data.order && Array.isArray(data.order.links)) {
        const approvalLink = data.order.links.find(
          (link) => link.rel === "payer-action"
        );

        if (approvalLink && approvalLink.href) {
          console.log("✅ Redirecting to PayPal:", approvalLink.href);
          window.location.href = approvalLink.href; // Redirect to PayPal
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

  return (
    <AppTheme>
      <CssBaseline enableColorScheme />
      <Box>
        <AppAppBar />
        <div className="container py-5" style={{ paddingTop: "100px" }}>
          <h2 className="text-center">Checkout</h2>
          <div className="row">
            <div className="col-md-4 order-md-2 mb-4">
              <h4>Your Item</h4>
              <img
                src={image_urls?.[0] || "/placeholder.jpg"}
                alt={title || "Product Image"}
                style={{
                  width: "100%",
                  maxHeight: "300px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
              <p>{title}</p>
              <p>${buy_now}</p>
            </div>
            <div className="col-md-8 order-md-1">
              <h4>Payment</h4>
              <input type="radio" checked readOnly /> PayPal
              <button
                className="btn btn-primary btn-lg mt-3"
                onClick={handlePayment}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Continue to Checkout"}
              </button>
            </div>
          </div>
        </div>
      </Box>
    </AppTheme>
  );
}

export default CheckoutPage;
