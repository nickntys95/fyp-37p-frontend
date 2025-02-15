import React, { useState, useEffect } from "react";
import {
  CssBaseline,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import AppAppBar from "./adminappbar";
import AppTheme from "../shared-theme/AppTheme";

function TransactionsManagement() {
  const [transactions, setTransactions] = useState([]);
  const token = sessionStorage.getItem("token") || "";

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch(
          "https://fyp-37p-api-a16b479cb42b.herokuapp.com/listing/admin_get_all_transactions",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error("API Error:", errorData);
          return;
        }

        const data = await response.json();
        console.log(data);
        if (data.successful && Array.isArray(data.transactions)) {
          setTransactions(data.transactions);
        } else {
          console.error("Data format error:", data);
        }
      } catch (error) {
        console.error("Network error:", error);
      }
    };

    fetchTransactions();
  }, []);

  function cleanDateString(dateString) {
    return dateString.replace("T", " | ").replace("+00:00", "").split(".")[0];
  }

  return (
    <AppTheme>
      <CssBaseline />
      <Box>
        <AppAppBar />
        <div className="container my-5" style={{ marginTop: "100px" }}>
          <h1 className="mb-4 text-center text-uppercase">
            Manage Transactions
          </h1>
          <TableContainer sx={{ mt: 3 }} component={Paper}>
            <Table sx={{ minWidth: 65 }} aria-label="simple table">
              <TableHead
                sx={{
                  backgroundColor: "#007bff",
                  color: "white",
                }}
              >
                <TableRow>
                  <TableCell sx={{ fontSize: 15, color: "white" }}>
                    Transaction ID
                  </TableCell>
                  <TableCell align="left" sx={{ fontSize: 15, color: "white" }}>
                    Timestamp
                  </TableCell>
                  <TableCell align="left" sx={{ fontSize: 15, color: "white" }}>
                    User ID
                  </TableCell>
                  <TableCell align="left" sx={{ fontSize: 15, color: "white" }}>
                    Listing ID
                  </TableCell>
                  <TableCell align="left" sx={{ fontSize: 15, color: "white" }}>
                    PayPal Transaction ID
                  </TableCell>
                  <TableCell align="left" sx={{ fontSize: 15, color: "white" }}>
                    Confirmed
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow
                    key={transaction.id}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell component="th" scope="row" sx={{ fontSize: 15 }}>
                      {transaction.id}
                    </TableCell>
                    <TableCell align="left" sx={{ fontSize: 15 }}>
                      {cleanDateString(transaction.inserted_at)}
                    </TableCell>
                    <TableCell align="left" sx={{ fontSize: 15 }}>
                      {transaction.user_id}
                    </TableCell>
                    <TableCell align="left" sx={{ fontSize: 15 }}>
                      {transaction.listing_id}
                    </TableCell>
                    <TableCell align="left" sx={{ fontSize: 15 }}>
                      {transaction.paypal_transaction_id}
                    </TableCell>
                    <TableCell align="left" sx={{ fontSize: 15 }}>
                      {transaction.reversed ? "Yes" : "No"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </Box>
    </AppTheme>
  );
}

export default TransactionsManagement;
