import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AppAppBar() {
    const [showDropdown, setShowDropdown] = useState(false);
    const [showSellDropdown, setShowSellDropdown] = useState(false);
    const [showNotDropdown, setShowNotDropdown] = useState(false);
    const [showAccDropdown, setShowAccDropdown] = useState(false);

    const navigate = useNavigate();

    const handleLogout = () => {
        sessionStorage.clear();
        navigate('/');
    };
    

    return (
        <nav id="menu" className="navbar navbar-default navbar-fixed-top">
        <div className="container">
            <div className="navbar-header">
            <button
                type="button"
                className="navbar-toggle collapsed"
                data-toggle="collapse"
                data-target="#bs-example-navbar-collapse-1"
            >
                <span className="sr-only">Toggle navigation</span>
                <span className="icon-bar"></span>
                <span className="icon-bar"></span>
                <span className="icon-bar"></span>
            </button>
            <a className="navbar-brand page-scroll" href="adminhome">
                Admin Platform
            </a>
            </div>

            <div
            className="collapse navbar-collapse"
            id="bs-example-navbar-collapse-1"
            >
            <ul className="nav navbar-nav navbar-right">

                {/*transactions */}
                <li
                className="dropdown"
                onMouseEnter={() => setShowDropdown(true)}
                onMouseLeave={() => setShowDropdown(false)}
                style={{ position: "relative" }}
                >
                <a href="transactions">
                   Manage transactions
                </a>
                </li>
				{/*users */}
                <li
                className="dropdown"
                onMouseEnter={() => setShowDropdown(true)}
                onMouseLeave={() => setShowDropdown(false)}
                style={{ position: "relative" }}
                >
                <a href="users">
                    Manage users
                </a>
                </li>
                {/* Dropdown Menu for Account*/}
                <li
                className="dropdown"
                onMouseEnter={() => setShowAccDropdown(true)}
                onMouseLeave={() => setShowAccDropdown(false)}
                style={{ position: "relative" }}
                >
                    <div
                    style={{
                    width: "100px",            // Control the width of the box
                    height: "50px",            // Control the height of the box
                    display: "flex",           // Use flexbox to center the image
                    justifyContent: "center", // Center the image horizontally
                    alignItems: "center",     // Center the image vertically
                    backgroundColor: "transparent", // Invisible background
                    borderRadius: "10px",     // Optional: rounded corners for the box
                    overflow: "hidden",       // Ensures the image doesn't overflow
                    }}
                >

        
                <img
                        src="/img/profile-icon.jpg"  // Path to your profile icon image
                        alt="Profile"                    // Alternative text for accessibility
                        style={{
                        width: "50px",                  // Size of the icon
                        height: "50px",                 // Size of the icon
                        borderRadius: "50%",            // Make the image circular if it's a square image
                        }}
                    />
                </div>

                {/* Dropdown Content */}
                {showAccDropdown && (
                    <ul style={dropdownMenuStyle}>
                    <li>
                    </li>
                    <li>
                    <button
                        style={{
                            backgroundColor: "white", // Set background to white
                            color: "#333", // Set text color
                            border: "none", // Remove border
                            outline: "none", // Remove outline
                            padding: "5px 5px", // Adjust padding
                            fontSize: "16px", // Optional: adjust font size
                            cursor: "pointer" // Optional: to make it look like a clickable button
                        }}
                        onClick={handleLogout}
                        
                    >
                        Logout
                    </button>
                    </li>
                    </ul>
                )}
            </li>
            </ul>
            </div>
        </div>
        </nav>
    );
    }

const browseItemsStyle = {
        fontFamily: "Lato, sans-serif",
        fontSize: "16px",
        fontWeight: "400",
        textDecoration: "none",
        color: "#333",
};

const dropdownMenuStyle = {
        fontFamily: "Lato, sans-serif",
        fontSize: "16px",
        fontWeight: "400",
        listStyle: "none",
        backgroundColor: "white",
        color: "#333",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        padding: "8px 0",
        margin: 0,
        zIndex: 10,
};

const dropdownItemStyle = {
        textDecoration: "none",
        color: "#333",
};