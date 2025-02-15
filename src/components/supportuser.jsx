import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppAppBar from './appbar';
import AppTheme from '../shared-theme/AppTheme';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

function SupportUser() {
    const navigate = useNavigate();
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success'); // 'success', 'error'
    const user_email = sessionStorage.getItem('email'); // Retrieve user email from sessionStorage
    const [emailData, setEmailData] = useState({
        subject: '',
        message: '',
        recipient: user_email // Directly using user_email here
    });
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState(null);

    const handleChange = (event) => {
        setEmailData({ ...emailData, [event.target.name]: event.target.value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSending(true);
        setError(null);
        setSuccess('');

        try {
            const response = await fetch('/api1/send_email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emailData)
            });
            if (!response.ok) throw new Error('Failed to send email');
            setSnackbarMessage('Email Sent Succesfully...');
            setSnackbarSeverity('success');
            setOpenSnackbar(true);
            setEmailData({
                subject: '',
                message: '',
                recipient: user_email
            });
        } catch (err) {
            setSnackbarMessage(err.message);
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
        } finally {
            setSending(false);
        }
    };

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    };

    return (
        <>
            <AppTheme>
                <CssBaseline enableColorScheme />
                <Box>
                    <AppAppBar />
                    <div className="container my-5" style={{ marginTop: "100px" }}>
                        <h1 className="mb-4 text-center text-uppercase">Support</h1>
                        <form onSubmit={handleSubmit}>
                            <p>We will pass your question on to our admin who will personally reply to you as soon as poosible.</p>
                            <input
                                type="email"
                                name="recipient"
                                placeholder="Email *"
                                value={emailData.recipient}
                                onChange={handleChange}
                                disabled
                            />
                            <p class="small-text">your email address</p>
                            <input
                                type="text"
                                name="subject"
                                placeholder="Subject *"
                                value={emailData.subject}
                                onChange={handleChange}
                                required
                            />
                            <p class="small-text1">Description *</p>
                            <textarea
                                name="message"
                                value={emailData.message}
                                onChange={handleChange}
                                required
                            />
                            <p class="small-text3" >Please enter the details of you requrest. An admin of our support will response as soon as possible.</p>
                            <button type="submit" disabled={sending}>
                                {sending ? 'Sending...' : 'Send Email'}
                            </button>
                            {error && <p style={{ color: 'red' }}>{error}</p>}
                            
                            <Snackbar
                                open={openSnackbar}
                                autoHideDuration={4000}  // Duration in ms before Snackbar auto closes
                                onClose={handleCloseSnackbar}
                                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                            >
                                <MuiAlert
                                    onClose={handleCloseSnackbar}
                                    severity={snackbarSeverity}
                                    sx={{ width: '100%', fontSize: '1.50rem' }}
                                >
                                    {snackbarMessage}
                                </MuiAlert>
                            </Snackbar>
                        </form>
                    </div>
                </Box>
            </AppTheme>
            <style>{`
                textarea {
                    min-width: 100%;
                    max-width: 100%;
                    min-height: 40%;
                    max-height: 40%;
                    padding: 8px;
                    margin-bottom: 10px;
                    box-sizing: border-box;
                }
                input {
                    width: 100%;
                    padding: 8px;
                    box-sizing: border-box;
                }
                form {
                    max-width: 500px;
                    margin: auto;
                }
                button {
                    width: 100%;
                    padding: 10px;
                    background-color: #007bff;
                    color: white;
                    border: none;
                    cursor: pointer;
                }
                button:disabled {
                    background-color: #ccc;
                }
                
                p {
                    text-align: center;
                }

                .small-text {
                    font-size: 12px;
                    color: #ccc;
                    font-style: italic;
                    text-align: left;
                }

                .small-text1 {
                    font-size: 12px;
                    color: #ccc;
                    font-style: italic;
                    text-align: left;
                    padding-top:10px;
                    margin: 0px;
                }

                .small-text3 {
                    font-size: 12px;
                    color: #666;
                    font-style: italic;
                    text-align: left;
                }
            `}</style>
        </>
    );
}

export default SupportUser;
