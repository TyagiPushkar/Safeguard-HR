"use client"

import { useState } from "react"
import {
  Box,
  Button,
  useMediaQuery,
  Paper,
  Typography,
  Fab,
  Tooltip,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
} from "@mui/material"
import { Add, Receipt, TrendingUp, Assessment, AttachMoney } from "@mui/icons-material"
import { motion, AnimatePresence } from "framer-motion"
import Navbar from "../components/Navbar"
import Sidebar from "../components/Sidebar"
import ApplyExpense from '../components/expense/ApplyExpense';
import { useAuth } from '../components/auth/AuthContext';
import ViewExpense from '../components/expense/ViewExpense';

function EnhancedExpensePage() {
  const { user } = useAuth()
  const [openApplyExpenseDialog, setOpenApplyExpenseDialog] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const isMobile = useMediaQuery("(max-width:600px)")
  const drawerWidth = isMobile ? 0 : 11

  const handleOpenApplyExpenseDialog = () => setOpenApplyExpenseDialog(true)
  const handleCloseApplyExpenseDialog = () => setOpenApplyExpenseDialog(false)

  const handleExpenseApplied = () => {
    setRefreshTrigger((prev) => prev + 1)
    handleCloseApplyExpenseDialog()
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar with fixed width */}
      <Box sx={{ width: drawerWidth, flexShrink: 0 }}>
        <Sidebar />
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          ml: drawerWidth,
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          minHeight: "100vh",
        }}
      >
        <Navbar />

        {/* Enhanced Header Section */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Paper
            elevation={4}
            sx={{
              m: 2,
              p: 3,
              borderRadius: 3,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Background Pattern */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "200px",
                height: "200px",
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "50%",
                transform: "translate(50%, -50%)",
              }}
            />

            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar
                    sx={{
                      bgcolor: "rgba(255, 255, 255, 0.2)",
                      mr: 2,
                      width: 56,
                      height: 56,
                    }}
                  >
                    <Receipt sx={{ fontSize: 30 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                      💰 Expense Management
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9 }}>
                      Track, manage, and approve business expenses
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" gap={2} flexWrap="wrap">
                  <Chip
                    icon={<Assessment />}
                    label="Smart Analytics"
                    sx={{
                      bgcolor: "rgba(255, 255, 255, 0.2)",
                      color: "white",
                      "&:hover": { bgcolor: "rgba(255, 255, 255, 0.3)" },
                    }}
                  />
                  <Chip
                    icon={<TrendingUp />}
                    label="Real-time Tracking"
                    sx={{
                      bgcolor: "rgba(255, 255, 255, 0.2)",
                      color: "white",
                      "&:hover": { bgcolor: "rgba(255, 255, 255, 0.3)" },
                    }}
                  />
                  <Chip
                    icon={<AttachMoney />}
                    label="Cost Control"
                    sx={{
                      bgcolor: "rgba(255, 255, 255, 0.2)",
                      color: "white",
                      "&:hover": { bgcolor: "rgba(255, 255, 255, 0.3)" },
                    }}
                  />
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box display="flex" justifyContent="center">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<Add />}
                      onClick={handleOpenApplyExpenseDialog}
                      sx={{
                        borderRadius: 3,
                        px: 4,
                        py: 2,
                        fontSize: "1.1rem",
                        fontWeight: "bold",
                        background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
                        boxShadow: "0 8px 32px rgba(254, 107, 139, 0.3)",
                        "&:hover": {
                          background: "linear-gradient(45deg, #FE6B8B 60%, #FF8E53 100%)",
                          transform: "translateY(-2px)",
                          boxShadow: "0 12px 40px rgba(254, 107, 139, 0.4)",
                        },
                        transition: "all 0.3s ease",
                      }}
                    >
                      Apply for Expense
                    </Button>
                  </motion.div>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </motion.div>

        {/* Quick Stats Cards */}
        

        {/* Main Content Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Box sx={{ px: 2 }}>
            {user && user.emp_id && <ViewExpense key={refreshTrigger} EmpId={user.emp_id} />}
          </Box>
        </motion.div>

        {/* Floating Action Button for Mobile */}
        <AnimatePresence>
          {isMobile && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Tooltip title="Quick Apply Expense">
                <Fab
                  color="#8d0638ff"
                  onClick={handleOpenApplyExpenseDialog}
                  sx={{
                    position: "fixed",
                    bottom: 24,
                    right: 24,
                    background: "linear-gradient(45deg, #667eea 30%, #764ba2 90%)",
                    "&:hover": {
                      background: "linear-gradient(45deg, #667eea 60%, #764ba2 100%)",
                      transform: "scale(1.1)",
                    },
                    transition: "all 0.3s ease",
                    zIndex: 1000,
                  }}
                >
                  <Add />
                </Fab>
              </Tooltip>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Apply Expense Dialog */}
        <ApplyExpense
          open={openApplyExpenseDialog}
          onClose={handleCloseApplyExpenseDialog}
          onExpenseApplied={handleExpenseApplied}
        />
      </Box>
    </Box>
  )
}

export default EnhancedExpensePage
