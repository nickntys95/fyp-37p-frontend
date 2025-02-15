import React from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

export const Contact = (props) => {
  // Styles for the Google Map container
  const mapStyles = {
    height: "400px",
    width: "100%",
  };

  // Latitude and Longitude for 461 Clementi Road, Singapore
  const defaultCenter = {
    lat: 1.3294, // Latitude for Clementi Road
    lng: 103.7762, // Longitude for Clementi Road
  };


  return (
    <div>
      <div id="contact">
        <div className="container">
          <div className="col-md-8">
            <div className="row">
              <div className="section-title">
                <h2>Getting Here</h2>
                <p>Nearest MRT stations: Clementi, Dover, King Albert Park</p>
                <p>Buses: 52, 61, 74, 75, 151, 154, 184</p>
              </div>
            </div>
            {/* Google Map */}
            <LoadScript googleMapsApiKey="AIzaSyDUbz6-xGsi4e_7Flpu7J-EwKt8L8q-aTs">
              <GoogleMap
                mapContainerStyle={mapStyles}
                zoom={17}
                center={defaultCenter}
              >
                <Marker position={defaultCenter} />
              </GoogleMap>
            </LoadScript>
          </div>
          <div className="col-md-3 col-md-offset-1 contact-info">
            <div className="contact-item">
              <h3>Contact Info</h3>
              <p>
                <span>
                  <i className="fa fa-map-marker"></i> Address
                </span>
                {props.data ? props.data.address : "loading"}
              </p>
            </div>
            <div className="contact-item">
              <p>
                <span>
                  <i className="fa fa-phone"></i> Phone
                </span>{" "}
                {props.data ? props.data.phone : "loading"}
              </p>
            </div>
            <div className="contact-item">
              <p>
                <span>
                  <i className="fa fa-envelope-o"></i> Email
                </span>{" "}
                {props.data ? props.data.email : "loading"}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div id="footer">
        <div className="container text-center">
          <p>&copy; 2024 All Rights Reserved Design by FYP-24-S4-37P</p>
        </div>
      </div>
    </div>
  );
};
