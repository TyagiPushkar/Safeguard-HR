"use client"

import { useState } from "react"
import {
  Box,
  useMediaQuery,
  Button,
  Stack,
  Typography,
  Paper,
  Chip,
  Avatar,
  useTheme,
  Card,
  CardContent,
  Grid,
  Divider,
} from "@mui/material"
import {
  Map as MapIcon,
  MyLocation,
  Timeline
} from "@mui/icons-material"
import { motion, AnimatePresence } from "framer-motion"
import Navbar from "../components/Navbar"
import Sidebar from "../components/Sidebar"
import MapPage from "../components/dealers/MapPage"
import LiveTrack from "../components/dealers/LiveTrack"

// Enhanced Stats Card Component
const StatsCard = ({ icon, title, value, color, subtitle }) => {
  const theme = useTheme()

  return (
    <Card
      component={motion.div}
      whileHover={{
        translateY: -5,
        boxShadow: theme.shadows[8],
        transition: { duration: 0.2 },
      }}
      sx={{
        height: "100%",
        borderLeft: `4px solid ${color}`,
        background: `linear-gradient(135deg, ${color}10 0%, ${color}05 100%)`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h6" fontWeight="bold" color={color}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}20`, color: color, width: 40, height: 40 }}>{icon}</Avatar>
        </Box>
      </CardContent>
    </Card>
  )
}

// Enhanced Tab Button Component
const TabButton = ({ isActive, onClick, icon, label, description }) => {
  const theme = useTheme()

  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Button
        variant={isActive ? "contained" : "outlined"}
        onClick={onClick}
        startIcon={icon}
        sx={{
          minHeight: 60,
          px: 3,
          py: 1.5,
          borderRadius: 3,
          backgroundColor: isActive ? theme.palette.primary.main : "transparent",
          color: isActive ? "white" : theme.palette.primary.main,
          border: `2px solid ${theme.palette.primary.main}`,
          flexDirection: "column",
          gap: 0.5,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            backgroundColor: isActive ? theme.palette.primary.dark : `${theme.palette.primary.main}10`,
            transform: "translateY(-2px)",
            boxShadow: theme.shadows[4],
          },
        }}
      >
        <Typography variant="body2" fontWeight={isActive ? 600 : 500}>
          {label}
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.8, fontSize: "0.7rem" }}>
          {description}
        </Typography>
      </Button>
    </motion.div>
  )
}

function Maps() {
  const [selectedTab, setSelectedTab] = useState("visitMap")
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const drawerWidth = isMobile ? 0 : 100

  const tabConfig = {
    visitMap: {
      icon: <Timeline />,
      label: "Visit Track",
      description: "Track field visits",
      color: theme.palette.primary.main,
    },
    liveField: {
      icon: <MyLocation />,
      label: "Live Track",
      description: "Real-time tracking",
      color: theme.palette.success.main,
    },
  }

  return (
    <Box sx={{ display: "flex", bgcolor: "#f5f7fa" }}>
      {/* Sidebar */}
      <Box sx={{ width: drawerWidth, flexShrink: 0 }}>
        <Sidebar />
      </Box>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Navbar />

        {/* Enhanced Header Section */}
       

    

        {/* Content Area */}
        <Box sx={{ flexGrow: 1, mx: 2, mb: 2, overflow: "hidden" }}>
         
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                style={{ height: "100%" }}
              >
                <Box sx={{ height: "100%", p: 1 }}>{selectedTab === "visitMap" ? <MapPage /> : <LiveTrack />}</Box>
              </motion.div>
            </AnimatePresence>
        </Box>
      </Box>
    </Box>
  )
}

export default Maps
