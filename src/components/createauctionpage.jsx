import * as React from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import CreateAuction from './createauction';
import AppAppBar from './appbar';
import AppTheme from '../shared-theme/AppTheme';

export default function CreateAuctionPage(props) {
    return (
        <AppTheme {...props}>
            <CssBaseline enableColorScheme />
            <AppAppBar />
            <Box sx={{ mt: 15 }}>
                <div>
                    <CreateAuction />
                </div>
            </Box>
        </AppTheme>
    );
}
