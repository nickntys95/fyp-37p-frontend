import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppAppBar from "./appbar";
import AppTheme from "../shared-theme/AppTheme";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";

function CheckoutPageForMyBids() {
  const location = useLocation();
  const navigate = useNavigate();

  // Ensure safe extraction of state data
  const locationState = location.state || {};
  const productName = locationState.productName || "Auction Item";
  const price = locationState.price || "0.00";

  const [paymentMethod, setPaymentMethod] = useState("credit");
  const [promoCode, setPromoCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);

  const handlePromoCodeSubmit = (event) => {
    event.preventDefault();
    if (promoCode.toUpperCase() === "WINNER5") {
      setDiscountApplied(true);
    } else {
      alert("Invalid Promo Code");
    }
  };

  const totalPrice = discountApplied ? (parseFloat(price) - 5).toFixed(2) : parseFloat(price).toFixed(2);

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
  };

  return (
    <div className="checkout-page">
      <AppTheme>
        <CssBaseline enableColorScheme />
        <Box>
          <AppAppBar />

          <div className="container py-5" style={{ paddingTop: "100px" }}>
            <div className="py-5 text-center">
              <h2>Checkout - My Bids</h2>
              <p className="text-muted">Complete your purchase for the auction item.</p>
            </div>

            <div className="row">
              {/* Order Summary */}
              <div className="col-md-4 order-md-2 mb-4">
                <h4 className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-muted">Your Item</span>
                  <span className="badge badge-secondary badge-pill">1</span>
                </h4>
                <ul className="list-group mb-3 sticky-top">
                  <li className="list-group-item d-flex justify-content-between lh-condensed" style={{ color: "#000" }}>
                    <div>
                      <h6 className="my-0">{productName}</h6>
                      <h6 className="my-0">Auction Winning</h6>
                    </div>
                  </li>

                  {/* Apply discount if promo code is valid */}
                  {discountApplied && (
                    <li className="list-group-item d-flex justify-content-between bg-light">
                      <div className="text-success">
                        <h6 className="my-0">Promo code</h6>
                        <small>WINNER5</small>
                      </div>
                      <span className="text-success">-$5</span>
                    </li>
                  )}

                  <li className="list-group-item d-flex justify-content-between">
                    <h4>Total</h4>
                    <h4>${totalPrice}</h4>
                  </li>
                </ul>

                {/* Promo Code Input */}
                <form className="card p-2" onSubmit={handlePromoCodeSubmit}>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                    />
                    <div className="input-group-append">
                      <button type="submit" className="btn btn-secondary">
                        Redeem
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Billing & Payment */}
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
                    <label htmlFor="email">Email (Optional)</label>
                    <input type="email" className="form-control" id="email" />
                    <div className="invalid-feedback">Please enter a valid email address for shipping updates.</div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="address">Shipping Address</label>
                    <input type="text" className="form-control" id="address" required />
                    <div className="invalid-feedback">Please enter your shipping address.</div>
                  </div>

                  <hr className="mb-4" />

                  <h4 className="mb-3">Payment</h4>
                  <div className="d-block my-3">
                    <div className="custom-control custom-radio">
                      <input
                        id="credit"
                        name="paymentMethod"
                        type="radio"
                        className="custom-control-input"
                        checked={paymentMethod === "credit"}
                        onChange={() => handlePaymentMethodChange("credit")}
                      />
                      <label className="custom-control-label" htmlFor="credit">
                        Credit card
                      </label>
                    </div>
                    <div className="custom-control custom-radio">
                      <input
                        id="paypal"
                        name="paymentMethod"
                        type="radio"
                        className="custom-control-input"
                        checked={paymentMethod === "paypal"}
                        onChange={() => handlePaymentMethodChange("paypal")}
                      />
                      <label className="custom-control-label" htmlFor="paypal">
                        PayPal
                      </label>
                    </div>
                  </div>

                  {/* Conditional Rendering for PayPal */}
                  {paymentMethod === "paypal" && (
                    <div className="mt-3">
                      <p className="text-muted">You will be redirected to PayPal to complete your payment.</p>
                    </div>
                  )}

                   {/* Conditional Rendering for Credit Card */}
               {paymentMethod === "credit" && (
                <div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="cc-name">Name on card</label>
                      <input
                        type="text"
                        className="form-control"
                        id="cc-name"
                        required
                      />
                      <small className="text-muted">Full name as displayed on card</small>
                      <div className="invalid-feedback">Name on card is required</div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="cc-number">Credit card number</label>
                      <input
                        type="text"
                        className="form-control"
                        id="cc-number"
                        required
                      />
                      <div className="invalid-feedback">Credit card number is required</div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-3 mb-3">
                      <label htmlFor="cc-expiration">Expiration</label>
                      <input
                        type="text"
                        className="form-control"
                        id="cc-expiration"
                        required
                      />
                      <div className="invalid-feedback">Expiration date required</div>
                    </div>
                    <div className="col-md-3 mb-3">
                      <label htmlFor="cc-cvv">CVV</label>
                      <input
                        type="text"
                        className="form-control"
                        id="cc-cvv"
                        required
                      />
                      <div className="invalid-feedback">Security code required</div>
                    </div>
                  </div>
                </div>
                )}

                  <hr className="mb-4" />
                  <div className="d-flex justify-content-between">
                    <button className="btn btn-secondary btn-lg" style={{ marginRight: "10px", flex: 1 }} onClick={() => navigate("/my-bids")}>
                      Cancel
                    </button>
                    <button className="btn btn-primary btn-lg" style={{ flex: 2 }} type="submit">
                      Complete Checkout
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </Box>
      </AppTheme>
    </div>
  );
}

export default CheckoutPageForMyBids;
