"use client"

import { useState } from "react"
import {
  Box,
  Button,
  Stack,
  Typography,
  useTheme,
  alpha,
} from "@mui/material"
import {
  MyLocation,
  Timeline
} from "@mui/icons-material"
import { motion, AnimatePresence } from "framer-motion"
import PageWrapper from "../components/layout/PageWrapper"
import MapPage from "../components/dealers/MapPage"

function Maps() {
  const [selectedTab, setSelectedTab] = useState("visitMap")
  const theme = useTheme()

  return (
    <PageWrapper 
      title="Maps & Tracking" 
      maxWidth={false}
      sx={{ 
        bgcolor: '#f8fafc',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Content Area with proper margins */}
      <Box sx={{ 
        flexGrow: 1, 
        m: 2,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Box sx={{ 
          flexGrow: 1,
          borderRadius: 2, 
          overflow: 'hidden',
          background: 'white',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <MapPage />
        </Box>
      </Box>
    </PageWrapper>
  )
}

export default Maps