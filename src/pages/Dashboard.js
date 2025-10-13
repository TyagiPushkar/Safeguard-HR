"use client"

import React, { useState } from "react"
import {
  Box,
  useMediaQuery,
  Container,
  useTheme,
  Drawer,
  IconButton,
  AppBar,
  Toolbar,
  Typography,
} from "@mui/material"
import { Menu as MenuIcon, Close } from "@mui/icons-material"
import { motion, AnimatePresence } from "framer-motion"
import Navbar from "../components/Navbar"
import Sidebar from "../components/Sidebar"
import DashboardData from "../components/dashboard/DashboardData"

function Dashboard() {
  const theme = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down("md")) // < 900px
  const isTablet = useMediaQuery(theme.breakpoints.between("md", "lg")) // 900px - 1200px
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg")) // > 1200px

  // Dynamic drawer width based on screen size
  const getDrawerWidth = () => {
    if (isMobile) return 0 // Hidden on mobile
    if (isTablet) return 80 // Compact on tablet
    return 50 // Full width on desktop
  }

  const drawerWidth = getDrawerWidth()

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  // Mobile drawer content
  const mobileDrawer = (
    <Box sx={{ width: 280, height: "100%" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          bgcolor: theme.palette.primary.main,
          color: "white",
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          HR Smile
        </Typography>
        <IconButton onClick={handleDrawerToggle} sx={{ color: "white" }}>
          <Close />
        </IconButton>
      </Box>
      <Sidebar />
    </Box>
  )

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Desktop/Tablet Sidebar */}
      {!isMobile && (
        <motion.div
          initial={{ x: -drawerWidth }}
          animate={{ x: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{ width: drawerWidth, flexShrink: 0 }}
        >
          <Box
            sx={{
              width: drawerWidth,
              height: "100vh",
              position: "fixed",
              left: 0,
              top: 0,
              zIndex: theme.zIndex.drawer,
            }}
          >
            <Sidebar />
          </Box>
        </motion.div>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          PaperProps={{
            sx: {
              width: 280,
              borderRadius: "0 16px 16px 0",
              boxShadow: theme.shadows[16],
            },
          }}
        >
          {mobileDrawer}
        </Drawer>
      )}

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
          ml: { xs: 0, md: `${drawerWidth}px` },
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Mobile Header */}
        {isMobile && (
          <AppBar
            position="static"
            elevation={0}
            sx={{
              bgcolor: "background.paper",
              borderBottom: `1px solid ${theme.palette.divider}`,
              zIndex: theme.zIndex.appBar,
            }}
          >
            <Toolbar>
              <IconButton
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, color: "text.primary" }}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" sx={{ color: "text.primary", fontWeight: 600 }}>
                Dashboard
              </Typography>
            </Toolbar>
          </AppBar>
        )}

        {/* Navbar */}
        <Box sx={{ flexShrink: 0 }}>
          <Navbar />
        </Box>

        {/* Content Container */}
        <Box
          sx={{
            flexGrow: 1,
            overflow: "auto",
            bgcolor: "#f5f7fa",
            position: "relative",
          }}
        >
          <Container
            maxWidth={false}
            sx={{
              height: "100%",
              px: { xs: 1, sm: 2, md: 3 },
              py: { xs: 1, sm: 2, md: 3 },
              maxWidth: {
                xs: "100%",
                sm: "100%",
                md: "100%",
                lg: "1400px",
                xl: "1600px",
              },
            }}
          >
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{ height: "100%" }}
              >
                <DashboardData />
              </motion.div>
            </AnimatePresence>
          </Container>
        </Box>
      </Box>

      {/* Mobile Overlay */}
      {isMobile && mobileOpen && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: "rgba(0, 0, 0, 0.5)",
            zIndex: theme.zIndex.drawer - 1,
          }}
          onClick={handleDrawerToggle}
        />
      )}
    </Box>
  )
}

export default Dashboard
