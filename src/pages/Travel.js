"use client"

import { useState } from "react"
import {
  Box,
  Button,
  useMediaQuery,
  Container,
  Typography,
  Card,
  CardContent,
  Stack,
  Fab,
  useTheme,
} from "@mui/material"
import { Add, FlightTakeoff } from "@mui/icons-material"
import { useAuth } from "../components/auth/AuthContext"
import Navbar from "../components/Navbar"
import Sidebar from "../components/Sidebar"
import ApplyTravel from "../components/travel/ApplyTravel"
import ViewTravel from "../components/travel/ViewTravel"

function Travel() {
  const { user } = useAuth()
  const [openApplyExpenseDialog, setOpenApplyExpenseDialog] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const drawerWidth = isMobile ? 0 : 11

  const handleOpenApplyExpenseDialog = () => setOpenApplyExpenseDialog(true)
  const handleCloseApplyExpenseDialog = () => setOpenApplyExpenseDialog(false)

  const handleExpenseApplied = () => {
    handleCloseApplyExpenseDialog()
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "grey.50" }}>
      {/* Sidebar */}
      <Box sx={{ width: drawerWidth, flexShrink: 0 }}>
        <Sidebar />
      </Box>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, ml: drawerWidth }}>
        <Navbar />

        <Container maxWidth="xl" sx={{ py: 3 }}>
          {/* Header Section */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 600,
                color: "primary.main",
                mb: 1,
              }}
            >
              <FlightTakeoff sx={{ mr: 2, verticalAlign: "middle" }} />
              Travel Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage travel requests and track expense applications
            </Typography>
          </Box>

          {/* Action Section */}
          <Card sx={{ mb: 4, boxShadow: 2 }}>
            <CardContent>
              <Stack
                direction={isMobile ? "column" : "row"}
                justifyContent="space-between"
                alignItems={isMobile ? "stretch" : "center"}
                spacing={2}
              >
                <Box>
                  <Typography variant="h6" color="primary.main" fontWeight={600}>
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
                    bgcolor: "primary.main",
                    "&:hover": { bgcolor: "primary.dark" },
                    minWidth: 200,
                    height: 48,
                  }}
                >
                  Apply for Travel
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Travel Requests Table */}
          {user && user.emp_id && <ViewTravel EmpId={user.emp_id} />}

          {/* Apply Travel Dialog */}
          <ApplyTravel
            open={openApplyExpenseDialog}
            onClose={handleCloseApplyExpenseDialog}
            onExpenseApplied={handleExpenseApplied}
          />

          {/* Floating Action Button for Mobile */}
          {isMobile && (
            <Fab
              color="#8d0638ff"
              aria-label="add travel request"
              onClick={handleOpenApplyExpenseDialog}
              sx={{
                position: "fixed",
                bottom: 16,
                right: 16,
                zIndex: 1000,
              }}
            >
              <Add />
            </Fab>
          )}
        </Container>
      </Box>
    </Box>
  )
}

export default Travel
