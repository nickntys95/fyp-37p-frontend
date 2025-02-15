import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import AppAppBar from './appbar';
import AppTheme from '../shared-theme/AppTheme';
import ViewADetail from './sellerviewalisting';
import { useParams } from 'react-router-dom';

export default function SellerViewAListingPage(props) {
    const { itemId } = useParams(); // Access the item ID from the URL
    // Use this itemId to fetch the item details or display relevant info
    console.log('Item ID:', itemId);

    return (
        <AppTheme {...props}>
            <CssBaseline enableColorScheme />
            <AppAppBar />
            <Box sx={{ mt: 10 }}>
                <div>
                    <ViewADetail itemId={itemId} /> {/* Pass itemId as a prop */}
                </div>
            </Box>
        </AppTheme>
    );
}
