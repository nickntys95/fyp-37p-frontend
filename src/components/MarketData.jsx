import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";
import marketData from "../data/marketdata.json"; // Import the JSON file
import AppAppBar from "./appbar";
import AppTheme from "../shared-theme/AppTheme";
import CssBaseline from "@mui/material/CssBaseline";

const assignRandomBiddingStrategy = (entries) => {
  const strategies = ["English", "Dutch", "Sealed-Bid"];
  return entries.map((entry) => ({
    ...entry,
    biddingStrategy: strategies[Math.floor(Math.random() * strategies.length)],
  }));
};

function MarketData() {
  const location = useLocation();
  const navigate = useNavigate();
  const { productName } = location.state || { productName: marketData.marketData.productName };

  const [pricingHistory, setPricingHistory] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const colors = ["#FF6384", "#36A2EB", "#FFCE56", "#A9DFBF", "#F9E79F"]; // Highlight colors

  useEffect(() => {
    setPricingHistory(assignRandomBiddingStrategy(marketData.marketData.pricingHistory));
    setRecentSales(assignRandomBiddingStrategy(marketData.marketData.recentSales));
  }, []);

  useEffect(() => {
    const ctx = document.getElementById("polar-chart").getContext("2d");
    let chartInstance = new Chart(ctx, {
      type: "polarArea",
      data: {
        labels: recentSales.map((sale) => sale.buyer),
        datasets: [
          {
            label: "Sale Prices",
            data: recentSales.map((sale) => sale.price),
            backgroundColor: colors,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
          },
        },
      },
    });

    return () => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  }, [recentSales]);

  return (
    <AppTheme>
      <CssBaseline />
      <AppAppBar />
      <div className="container mt-5">
         {/* Title and Close Button */}
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <h1 className="mb-4 text-primary" style={{ margin: 30 }}>
      {productName} - Market Data
    </h1>
    <button
      onClick={() => navigate("/home")}
      style={{
        backgroundColor: "#007bff",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        padding: "8px 16px",
        fontSize: "1rem",
        cursor: "pointer",
        boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
      }}
    >
      Close
    </button>
  </div>
  <p className="text-muted text-center">
    Explore detailed insights including pricing history and recent sales.
  </p>
        {/* Pricing History */}
        <div className="mt-5">
          <h4 className="text-info">Pricing History</h4>
          <div className="table-wrapper">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Price</th>
                  <th>Bidding Strategy</th>
                </tr>
              </thead>
              <tbody>
                {pricingHistory.map((entry, index) => (
                  <tr key={index}>
                    <td>{entry.date}</td>
                    <td>${entry.price}</td>
                    <td>{entry.biddingStrategy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="mt-5">
          <h4 className="text-info">Recent Sales</h4>
          <div className="table-wrapper">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Buyer</th>
                  <th>Date</th>
                  <th>Price</th>
                  <th>Item</th>
                  <th>Bidding Strategy</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale, index) => (
                  <tr key={index} style={{ backgroundColor: colors[index % colors.length] }}>
                    <td>{sale.buyer}</td>
                    <td>{sale.date}</td>
                    <td>${sale.price}</td>
                    <td>{sale.item}</td>
                    <td>{sale.biddingStrategy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Polar Chart */}
        <div className="card mb-3 mt-5 shadow-sm">
          <div className="card-body p-5">
            <h4 className="mb-4 text-center">Recent Sales Distribution</h4>
            <div className="chart" style={{ maxWidth: "400px", margin: "0 auto" }}>
              <canvas
                id="polar-chart"
                className="chart-canvas"
                style={{ maxHeight: "300px", maxWidth: "100%" }}
              ></canvas>
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          .table-wrapper {
            background: linear-gradient(90deg, #6a11cb, #2575fc);
            border-radius: 10px;
            padding: 20px;
          }
          .styled-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 1rem;
          }
          .styled-table th,
          .styled-table td {
            padding: 15px;
            text-align: left;
            color: #fff;
          }
          .styled-table th {
            background-color: #4c4c4c;
            font-weight: bold;
          }
          .styled-table tr:nth-child(even) {
            background-color: rgba(255, 255, 255, 0.1);
          }
        `}
      </style>
    </AppTheme>
  );
}

export default MarketData;
