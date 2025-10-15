import React, { useState } from "react"
import PageWrapper from "../components/layout/PageWrapper"
import { Button, Paper, Box, Typography, Divider, Stack, Fade } from "@mui/material"
import { EventAvailable, AddCircle } from "@mui/icons-material"
import ApplyLeave from "../components/leave/ApplyLeave"
import ViewLeave from "../components/leave/ViewLeave"
import { useAuth } from "../components/auth/AuthContext"

function Leave() {
  const { user } = useAuth()
  const [openApplyLeaveDialog, setOpenApplyLeaveDialog] = useState(false)

  const handleOpenApplyLeaveDialog = () => setOpenApplyLeaveDialog(true)
  const handleCloseApplyLeaveDialog = () => setOpenApplyLeaveDialog(false)
  const handleLeaveApplied = () => handleCloseApplyLeaveDialog()

  return (
    <PageWrapper title="Leave Management">
      <Fade in timeout={500}>
      <Box sx={{ maxWidth: 1800, mx: 'auto', p: { xs: 2, md: 3 }, bgcolor: '#f5f7fa', minHeight: '100%' }}>
          {/* Header Section */}
          <Paper
            elevation={3}
            sx={{
              p: { xs: 2, sm: 3 },
              mb: 3,
              borderRadius: 3,
              background: "linear-gradient(135deg, #fff 0%, #fff8fa 100%)",
              border: "1px solid #f2d9e0",
            }}
          >
            <Box
              display="flex"
              flexDirection={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              gap={2}
            >
              <Box>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{ color: "#8d0638ff", display: "flex", alignItems: "center", gap: 1 }}
                >
                  <EventAvailable fontSize="medium" /> Leave Management
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  Apply and track your leaves easily.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="contained"
                  startIcon={<AddCircle />}
                  onClick={handleOpenApplyLeaveDialog}
                  sx={{
                    bgcolor: "#8d0638ff",
                    px: 2.5,
                    py: 1,
                    borderRadius: 2,
                    fontWeight: 600,
                    textTransform: "none",
                    boxShadow: "0 2px 8px rgba(141, 6, 56, 0.3)",
                    "&:hover": { bgcolor: "#6d052cff" },
                  }}
                >
                  Apply Leave
                </Button>
              </Stack>
            </Box>

            <Divider sx={{ mt: 2, mb: 1.5 }} />
            <Typography variant="body2" color="text.secondary">
              View your applied leaves below or submit a new request using the button above.
            </Typography>
          </Paper>

          {/* View Leave Section */}
          <Paper
            elevation={1}
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 3,
              border: "1px solid #f0f0f0",
              backgroundColor: "#fff",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            }}
          >
            {user && user.emp_id ? (
              <ViewLeave EmpId={user.emp_id} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                Please log in to view your leave records.
              </Typography>
            )}
          </Paper>
        </Box>
      </Fade>

      {/* Leave Dialog */}
      <ApplyLeave
        open={openApplyLeaveDialog}
        onClose={handleCloseApplyLeaveDialog}
        onLeaveApplied={handleLeaveApplied}
      />
    </PageWrapper>
  )
}

export default Leave