import { BrowserRouter, Routes, Route } from 'react-router-dom';
import React, { useState, useEffect } from "react";
import { Navigation } from "./components/navigation";
import { Header } from "./components/header";
import { Features } from "./components/features";
import { About } from "./components/about";
import { Services } from "./components/services";
import { Team } from "./components/team";
import { Contact } from "./components/contact";
import JsonData from "./data/data.json";
import SmoothScroll from "smooth-scroll";
import Login from "./components/login";
import Error from "./components/error";
import Verify2FA from "./components/verify2FA";
import Setup2FA from "./components/setup2FA";
import Home from "./components/home";
import AdminHome from "./components/adminhome";
import ProtectedRoute from "./components/protectedroute";
import "./App.css";
import { SessionProvider } from './context/session';
import CreateAuction from './components/createauctionpage';
import SellerListing from './components/sellerownlistingpage';
import SellerViewInfo from './components/sellerviewalistingpage';
import MarketData from "./components/MarketData";
import PlaceBid from "./components/PlaceBid";
import ReviewPurchase from "./components/ReviewPurchase";
import BiddingPage from "./components/Biddingpage"; 
import CheckoutPage from "./components/CheckoutPage";
import UsersManagement from './components/UsersManagement';
import TransactionsManagement from './components/TransactionsManagement';
import MyAccount from './components/myaccount';
import MyBids from './components/MyBids';
import SupportUser from './components/supportuser';
import Wishlist from './components/Wishlist';
import AdminEdit from './components/adminedit';
import SellerMonitorBids from './components/SellerMonitorBids';

export const scroll = new SmoothScroll('a[href*="#"]', {
  speed: 1000,
  speedAsDuration: true,
});

const Layout = () => {
  const [landingPageData, setLandingPageData] = useState({});
  useEffect(() => {
    setLandingPageData(JsonData);
  }, []);

  return (
    <>
    <Navigation />
    <Header data={landingPageData.Header} />
    <Features data={landingPageData.Features} />
    <About data={landingPageData.About} />
    <Services data={landingPageData.Services} />
    <Team data={landingPageData.Team} />
    <Contact data={landingPageData.Contact} />
    </>
    
    );
};

function App() {
  return (
  <SessionProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />} />

        <Route 
          path="/login" 
          element={
            <div>
              <div className="login">
                <div className="container">
                  <div className="row">
                    <div className="login-text">
                      <Login />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          } 
          errorElement={<Error />}
        />
        <Route path="/marketdata" element={<MarketData />} />
        <Route element={<ProtectedRoute />}>
          <Route 
            path="/setup-2fa" 
            element={
              <div className="twofa">
                <div className="container">
                  <div className="row">
              <div className="twofa-text">
                <Setup2FA />
                </div>
              </div>
              </div>
              </div>
            } 
            errorElement={<Error />}
          />
          <Route 
            path="/verify-2fa" 
            element={
              <div className="twofa">
                <div className="container">
                  <div className="row">
              <div className="twofa-text">
                <Verify2FA />
                </div>
              </div>
              </div>
              </div>
            } 
            errorElement={<Error />}
          />
          <Route 
            path="/home" 
            element={
              <div className="container">
                <Home />
              </div>
            } 
            errorElement={<Error />}
          />
          <Route path="/createauctionpage" element={<CreateAuction />} />
          <Route path="/sellerownlistingpage" element={<SellerListing />} />
          <Route path="/sellerviewalistingpage/:itemId" element={<SellerViewInfo />} />
          <Route path="/place-bid" element={<PlaceBid />} />
          <Route path="/review-purchase" element={<ReviewPurchase />} />
          <Route path="/bidding-page" element={<BiddingPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/myaccount" element={<MyAccount />} />
          <Route path="/my-bids" element={<MyBids />} />
          <Route path="/Wishlist" element={<Wishlist />} />
          <Route path="AdminEdit/:itemId" element={<AdminEdit />} />
          <Route path="/SellerMonitorBids/:itemId" element={<SellerMonitorBids />} />
          <Route 
            path="/adminhome" 
            element={
              <div className="container">
                <AdminHome />
              </div>
            } 
            errorElement={<Error />}
          />
          </Route>
		  <Route path="users" element={<UsersManagement />} />
          <Route path="transactions" element={<TransactionsManagement />} />
		  <Route path="support" element={<SupportUser />} />

      </Routes>
    </BrowserRouter>
    </SessionProvider>
  );
}

export default App;
