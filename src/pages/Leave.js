import React, { useState } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import { Button } from '@mui/material';
import ApplyLeave from '../components/leave/ApplyLeave';
import ViewLeave from '../components/leave/ViewLeave';
import { useAuth } from '../components/auth/AuthContext';

function Leave() {
    const { user } = useAuth();
    const [openApplyLeaveDialog, setOpenApplyLeaveDialog] = useState(false);

    const handleOpenApplyLeaveDialog = () => setOpenApplyLeaveDialog(true);
    const handleCloseApplyLeaveDialog = () => setOpenApplyLeaveDialog(false);

    const handleLeaveApplied = () => {
        handleCloseApplyLeaveDialog();
    };

    return (
        <PageWrapper title="Leave Management">
            {/* Apply Leave Button */}
            <Button 
                variant="contained" 
                onClick={handleOpenApplyLeaveDialog} 
                sx={{ 
                    backgroundColor: "#8d0638ff",
                    mb: 3,
                    '&:hover': {
                        backgroundColor: "#6d052cff"
                    }
                }}
            >
                Apply for Leave
            </Button>

            {/* Apply Leave Dialog */}
            <ApplyLeave
                open={openApplyLeaveDialog}
                onClose={handleCloseApplyLeaveDialog}
                onLeaveApplied={handleLeaveApplied}
            />

            {/* View Leave Component */}
            {user && user.emp_id && <ViewLeave EmpId={user.emp_id} />}
        </PageWrapper>
    );
}

export default Leave;