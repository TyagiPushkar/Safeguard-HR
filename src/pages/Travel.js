"use client"

import { useState } from "react"
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Stack,
  Fab,
  useTheme,
  useMediaQuery,
  alpha,
  Paper,
} from "@mui/material"
import { Add, FlightTakeoff } from "@mui/icons-material"
import { useAuth } from "../components/auth/AuthContext"
import PageWrapper from "../components/layout/PageWrapper"
import ApplyTravel from "../components/travel/ApplyTravel"
import ViewTravel from "../components/travel/ViewTravel"

function Travel() {
  const { user } = useAuth()
  const [openApplyExpenseDialog, setOpenApplyExpenseDialog] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  const handleOpenApplyExpenseDialog = () => setOpenApplyExpenseDialog(true)
  const handleCloseApplyExpenseDialog = () => setOpenApplyExpenseDialog(false)

  const handleExpenseApplied = () => {
    handleCloseApplyExpenseDialog()
  }

  return (
    <PageWrapper title="Travel Management">
      <Box sx={{ p: { xs: 1, md: 2 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
        {/* Header Section */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 2, 
            background: 'white',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <FlightTakeoff sx={{ mr: 2, color: "#8d0638ff", fontSize: 32 }} />
            <Box>
              <Typography variant="h4" fontWeight="700" color="#8d0638ff">
                Travel Management
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage travel requests and track expense applications
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Action Section */}
        <Card 
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            background: 'white',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Stack
              direction={isMobile ? "column" : "row"}
              justifyContent="space-between"
              alignItems={isMobile ? "stretch" : "center"}
              spacing={2}
            >
              <Box>
                <Typography variant="h6" fontWeight="600" gutterBottom>
                  Quick Actions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Apply for travel expenses and manage your requests
                </Typography>
              </Box>
              <Button
                variant="contained"
                onClick={handleOpenApplyExpenseDialog}
                startIcon={<Add />}
                sx={{
                  borderRadius: 2,
                  bgcolor: "#8d0638ff",
                  fontWeight: "600",
                  minWidth: 180,
                  "&:hover": {
                    bgcolor: "#6d052cff",
                  },
                }}
              >
                Apply for Travel
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Travel Requests Table */}
        <Paper 
          elevation={0} 
          sx={{ 
            borderRadius: 2, 
            background: 'white',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            overflow: 'hidden'
          }}
        >
          {user && user.emp_id && <ViewTravel EmpId={user.emp_id} />}
        </Paper>

        {/* Apply Travel Dialog */}
        <ApplyTravel
          open={openApplyExpenseDialog}
          onClose={handleCloseApplyExpenseDialog}
          onExpenseApplied={handleExpenseApplied}
        />

        {/* Floating Action Button for Mobile */}
        {isMobile && (
          <Fab
            sx={{
              position: "fixed",
              bottom: 16,
              right: 16,
              zIndex: 1000,
              bgcolor: "#8d0638ff",
              "&:hover": { 
                bgcolor: "#6d052cff",
              }
            }}
            aria-label="add travel request"
            onClick={handleOpenApplyExpenseDialog}
          >
            <Add />
          </Fab>
        )}
      </Box>
    </PageWrapper>
  )
}

export default Travel