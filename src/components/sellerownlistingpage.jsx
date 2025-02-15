import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import AppAppBar from './appbar';
import AppTheme from '../shared-theme/AppTheme';
import SellerViewListing from './sellerownlisting'



export default function SellerOwnListingPage(props) {
    return (
        <AppTheme {...props}>
            <CssBaseline enableColorScheme />
            <AppAppBar />
            <Box sx={{ mt: 10 }}>
                <div>
                    <SellerViewListing />
                </div>
            </Box>
        </AppTheme>
    );
}
