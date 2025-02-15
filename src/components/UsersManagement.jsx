import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import productsData from "../data/products.json";
import AppAppBar from './adminappbar';
import AppTheme from '../shared-theme/AppTheme';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';

function UsersManagement() {
	const [modalShow, setModalShow] = useState(false);
    const [users, setUsers] = useState([]);
	const token = sessionStorage.getItem("token") || "";
	
	const [formData, setFormData] = useState({
		id:'',
		name: '',
		email: '',
		password_hash: '',
		recovery_key_hash: '',
		totp_confirmed: '',
		totp_key: '',
		updated_at: '',
	});
	
	const handleEditDetails = (user) => {
		if (user){
			setFormData({
				id: user.id,
				name: user.name,
				email: user.email,
				password_hash: user.password_hash,
				recovery_key_hash: user.recovery_key_hash,
				totp_confirmed: user.totp_confirmed,
				totp_key: user.totp_key,
				updated_at: user.updated_at,
			});
		} else {
			console.log('User ID no found');
		}
		setModalShow(true);
	};
	
	const handleCloseModal = () => {
		setModalShow(false);
	};
	
	const fetchUserListing = async () => {
		try {
			console.log(" Fetching data...");
			const response = await fetch('/api2/auth/admin_get_all_users', {
				method: "GET",
				headers: {
				  "Content-Type": "application/json",
				  Authorization: `Bearer ${token}`,
				},
			  });
			 
			  if (!response.ok) {
				const errorData = await response.json();
				console.error(" API Error Response:", errorData);
			}
		  
			const data = await response.json();
			console.log("Data received from API:", data);
			if (data.successful && Array.isArray(data.users)) {
			  setUsers(data.users);
			} else {
			  console.error("Expected 'users' to be an array but got", typeof data.users);
			}
		  
		} catch (err) {
		  console.error(" Error fetching listings:", err);
		}
	};
	
	const handleInputChange = (event) => {
		const { name, value } = event.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		console.log('Submitting form:', formData);

		try {
			const response = await fetch('/api2/auth/admin_update_user', {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					user_id: formData.id,
					email: formData.email,
					name: formData.name,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				console.error("API Error Response:", data);
				alert(`Error: ${data.message || "Failed to update user."}`);
				return;
			}
			
			if (data.successful) {
				console.log("Success Response:", data);
				alert("User updated successfully!");
				handleCloseModal();
				window.location.reload()
			}

		} catch (err) {
			console.error("Error updating user:", err);
			alert("An error occurred while updating the user.");
		}
	};
	
	const suspendUser = async (user) => {
		console.log(`Suspending user with ID: ${user.id}`);

		try {
			const response = await fetch('/api2/auth/admin_block_user', {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					user_id: user.id,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				console.error("API Error Response:", data);
				alert(`Error: ${data.message || "Failed to update user."}`);
				return;
			}

			if (data.successful) {
				console.log("Success Response:", data);
				alert("User has been blocked!");
				fetchUserListing(); // Refresh users list after update
			}

		} catch (err) {
			console.error("Error updating user:", err);
			alert("An error occurred while updating the user.");
		}
	};


		
    useEffect(() => {
        fetchUserListing();
    }, []);

    return (
    <AppTheme>
      <CssBaseline enableColorScheme />
      <Box>
        <AppAppBar />
        <div className="container my-5" style={{ marginTop: "100px" }}>
          <h1 className="mb-4 text-center text-uppercase">Manage Users</h1>

          <div className="table-responsive">
            <table className="user-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <button className="approve-btn" onClick={() => handleEditDetails(user)}>
                          Edit
                        </button>
						<button className="suspend-btn" onClick={() => suspendUser(user)}>
                          Block 
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

			{modalShow && formData && (
			  <div className="custom-modal"
				style={{
				  position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
				  backgroundColor: "rgba(0, 0, 0, 0.8)", display: "flex", justifyContent: "center",
				  alignItems: "center", zIndex: 1000,
				}}
			  >
				<form className="custom-modal-content"
				  onSubmit={handleSubmit}
				  style={{
					backgroundColor: "#1c1c1c", color: "#fff", padding: "20px",
					borderRadius: "10px", maxWidth: "600px", width: "90%", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.5)",
				  }}
				>
				  <div style={{ marginBottom: '20px' }}>
					<label htmlFor="name" style={{ display: 'block', marginBottom: '5px', fontSize: '16px' }}>Name:</label>
					<input type="text" id="name" name="name" value={formData.name}
						   onChange={handleInputChange} style={{ width: '100%', fontSize: '16px' }} />
				  </div>
				  <div style={{ marginBottom: '20px' }}>
					<label htmlFor="email" style={{ display: 'block', marginBottom: '5px', fontSize: '16px' }}>Email:</label>
					<input type="email" id="email" name="email" value={formData.email}
						   onChange={handleInputChange} style={{ width: '100%' , fontSize: '16px'}} />
				  </div>
				  <button type="submit" className="btn btn-success" style={{ marginRight: '10px' }}>Save Changes</button>
				  <button type="button" className="btn btn-danger" onClick={handleCloseModal}>Close</button>
				</form>
			  </div>
			)}
          </div>
        </div>
      </Box>

      {/* Table & Button Styles */}
      <style>
        {`
        .user-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        
        .user-table th, .user-table td {
          border: 1px solid #ddd;
          padding: 10px;
          text-align: left;
        }

        .user-table th {
          background-color: #007bff;
          color: white;
        }

        .approve-btn, .suspend-btn {
          padding: 8px 15px;
          margin-right: 5px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        }

        .approve-btn {
          background-color: #28a745;
          color: white;
        }

        .suspend-btn {
          background-color: #dc3545;
          color: white;
        }

        .approve-btn:hover {
          background-color: #218838;
        }

        .suspend-btn:hover {
          background-color: #c82333;
        }
        `}
      </style>
    </AppTheme>
	);
}

export default UsersManagement;