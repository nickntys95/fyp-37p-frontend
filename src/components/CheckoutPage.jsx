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
  const {
    id: listing_id,
    title,
    description,
    buy_now,
    image_urls,
  } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState("paypal");
  const [promoCode, setPromoCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const token = sessionStorage.getItem("token");

  // ✅ Extract order ID from PayPal redirect URL
  useEffect(() => {
    const order_id = searchParams.get("token");
    if (order_id) {
      setOrderId(order_id);
      confirmPayment(order_id);
    }
  }, [searchParams]);

  // ✅ Confirm Payment Step (Capture PayPal Payment)
  const confirmPayment = async (order_id) => {
    setIsProcessing(true);

    try {
      const response = await fetch(`https://fyp-37p-api-a16b479cb42b.herokuapp.com/bid/confirm_payment/${order_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log("✅ Payment Confirmation Response:", data);

      if (data.successful) {
        alert("🎉 Payment confirmed successfully!");
        navigate("/success");
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

  // ✅ Initialize Payment & Redirect to PayPal
  const handlePaymentMethodChange = async () => {
    if (paymentMethod !== "paypal") {
      alert("Currently, only PayPal is supported.");
      return;
    }
  
    setIsProcessing(true);
  
    try {
      if (!listing_id) {
        throw new Error("❌ Listing ID is missing. Unable to process payment.");
      }
  
      const requestBody = {
        amount: buy_now.toString(),
        listing_id,
      };
  
      console.log("📌 Sending Payment Request:", requestBody);
  
      const response = await fetch("https://fyp-37p-api-a16b479cb42b.herokuapp.com/bid/init_payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });
  
      const data = await response.json();
      console.log("📌 Full PayPal API Response:", JSON.stringify(data, null, 2));
  
      if (data.successful && data.order && Array.isArray(data.order.links)) {
        console.log("📌 Available PayPal Links:", data.order.links);
  
        // ✅ Extract the correct PayPal approval link
        const approvalLink = data.order.links.find(link => link.rel === "payer-action");
  
        if (approvalLink && approvalLink.href) {
          console.log("✅ Redirecting to PayPal:", approvalLink.href);
          
          // ✅ Store 'fromCheckout' flag in sessionStorage
          sessionStorage.setItem("fromCheckout", "true");
  
          window.location.href = approvalLink.href;
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
    <div className="checkout-page">
      <AppTheme>
        <CssBaseline enableColorScheme />
        <Box>
          <AppAppBar />

          <div className="container py-5" style={{ paddingTop: "100px" }}>
            <div className="py-5 text-center">
              <h2>Checkout</h2>
            </div>
            <div className="row">
              {/* Product Details */}
              <div className="col-md-4 order-md-2 mb-4">
                <h4 className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-muted">Your Item</span>
                  <span className="badge badge-secondary badge-pill">1</span>
                </h4>
                <ul className="list-group mb-3 sticky-top">
                  <li className="list-group-item text-center">
                    <img
                      src={image_urls && image_urls.length > 0 ? image_urls[0] : "/placeholder.jpg"}
                      alt={title || "Product Image"}
                      style={{
                        width: "100%",
                        maxHeight: "300px",
                        objectFit: "cover",
                        borderRadius: "8px",
                      }}
                    />
                  </li>
                  <li className="list-group-item d-flex justify-content-between lh-condensed">
                    <div>
                      <h6 className="my-0">{title}</h6>
                      <small className="text-muted">{description}</small>
                    </div>
                    <span className="text-muted">${buy_now}</span>
                  </li>
                </ul>
              </div>

              {/* Billing Address & Payment Options */}
              <div className="col-md-8 order-md-1">
                <h4 className="mb-3">Billing address</h4>
                <form className="needs-validation" noValidate>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="firstName">First name</label>
                      <input type="text" className="form-control" id="firstName" required />
                      <div className="invalid-feedback">Valid first name is required.</div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="lastName">Last name</label>
                      <input type="text" className="form-control" id="lastName" required />
                      <div className="invalid-feedback">Valid last name is required.</div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="email">Email</label>
                    <input type="email" className="form-control" id="email" />
                    <div className="invalid-feedback">Please enter a valid email address.</div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="address">Address</label>
                    <input type="text" className="form-control" id="address" required />
                    <div className="invalid-feedback">Please enter your shipping address.</div>
                  </div>

                  <hr className="mb-4" />

                  {/* Payment Options */}
                  <h4 className="mb-3">Payment</h4>
                  <div className="custom-control custom-radio">
                    <input
                      id="paypal"
                      name="paymentMethod"
                      type="radio"
                      className="custom-control-input"
                      checked={paymentMethod === "paypal"}
                      onChange={() => setPaymentMethod("paypal")}
                    />
                    <label className="custom-control-label" htmlFor="paypal">
                      PayPal
                    </label>
                  </div>

                  {/* PayPal Redirection Message */}
                  {paymentMethod === "paypal" && (
                    <div className="mt-3">
                      <p className="text-muted">
                        You will be redirected to PayPal to complete your payment.
                      </p>
                    </div>
                  )}

                  <hr className="mb-4" />

                  <button className="btn btn-primary btn-lg" type="button" onClick={handlePaymentMethodChange} disabled={isProcessing}>
                    {isProcessing ? "Processing..." : "Continue to Checkout"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </Box>
      </AppTheme>
    </div>
  );
}

export default CheckoutPage;
