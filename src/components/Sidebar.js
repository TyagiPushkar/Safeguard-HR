"use client"

import { useState } from "react"
import { useLocation, Link } from "react-router-dom"
import {
  Drawer,
  List,
  ListItem,
  Box,
  ListItemIcon,
  Typography,
  Tooltip,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery,
  Collapse,
  Badge,
} from "@mui/material"
import {
  Dashboard,
  HolidayVillage,
  Policy,
  Notifications,
  Person,
  BarChart,
  ChevronLeft,
  ChevronRight,
  Settings,
  Help,
} from "@mui/icons-material"
import {
  AddLocationAlt,
  AccountBalanceWallet,
  LocalAirport,
  HowToReg,
  Map,
  SupportAgent,
  Laptop,
  Summarize,
  Checklist,
  Menu as MenuIcon,
} from "@mui/icons-material"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "./auth/AuthContext"
import logo from "../assets/HRSmileLogo.jpeg"
// Mock logo component since we can't import the actual image
const HRSmileLogo = () => (
  <Box
    sx={{
      width: 50,
      height: 40,
      bgcolor: "#8d0638ff",
      borderRadius: 2,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontWeight: "bold",
      fontSize: "1.2rem",
    }}
  >
    <img src={logo} alt="S-HR Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
  </Box>
)

// Enhanced Navigation Item Component
const NavItem = ({ route, isActive, isExpanded, hasNotification = false }) => {
  const theme = useTheme()

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Tooltip title={!isExpanded ? route.name : ""} placement="right" arrow>
        <ListItem
          component={Link}
          to={route.path}
          sx={{
            display: "flex",
            flexDirection: isExpanded ? "row" : "column",
            alignItems: "center",
            justifyContent: isExpanded ? "flex-start" : "center",
            color: isActive ? "white" : "text.primary",
            bgcolor: isActive ? "#8d0638ff" : "transparent",
            borderRadius: 2,
            mx: 1,
            my: 0.5,
            px: isExpanded ? 2 : 1,
            py: 1.5,
            minHeight: 56,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              bgcolor: isActive ? "#B81652" : "#B81652",
              transform: "translateX(4px)",
              boxShadow: theme.shadows[2],
            },
            "&:before": {
              content: '""',
              position: "absolute",
              left: 0,
              top: "50%",
              transform: "translateY(-50%)",
              width: 3,
              height: isActive ? "60%" : 0,
              bgcolor: "#B81652",
              borderRadius: "0 2px 2px 0",
              transition: "height 0.3s ease",
            },
          }}
        >
          <ListItemIcon
            sx={{
              color: "inherit",
              minWidth: isExpanded ? 40 : "auto",
              mr: isExpanded ? 1 : 0,
              justifyContent: "center",
            }}
          >
            <Badge
              variant="dot"
              color="error"
              invisible={!hasNotification}
              sx={{
                "& .MuiBadge-badge": {
                  right: -2,
                  top: 2,
                },
              }}
            >
              {route.icon}
            </Badge>
          </ListItemIcon>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Typography
                  variant="body2"
                  fontWeight={isActive ? 600 : 400}
                  sx={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                  }}
                >
                  {route.name}
                </Typography>
              </motion.div>
            )}
          </AnimatePresence>
          {!isExpanded && (
            <Typography
              variant="caption"
              sx={{
                mt: 0.5,
                fontSize: "0.65rem",
                textAlign: "center",
                lineHeight: 1,
                opacity: 0.8,
              }}
            >
              {route.name}
            </Typography>
          )}
        </ListItem>
      </Tooltip>
    </motion.div>
  )
}

function Sidebar() {
  const location = useLocation()
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const [isExpanded, setIsExpanded] = useState(false)

  // Module Mapping with enhanced icons and categories
  const moduleMapping = {
    1: { path: "/attendance", name: "Attendance", icon: <BarChart />, category: "Analytics" },
    2: { path: "/leave", name: "Leave", icon: <Person />, category: "HR" },
    3: { path: "/expense", name: "Expense", icon: <AccountBalanceWallet />, category: "Finance" },
    4: { path: "/registration", name: "Leads", icon: <HowToReg />, category: "Sales" },
    5: { path: "/visit", name: "Visit", icon: <AddLocationAlt />, category: "Field" },
    6: { path: "/travel", name: "Travel", icon: <LocalAirport />, category: "Travel" },
    8: { path: "/policy", name: "Policy", icon: <Policy />, category: "Compliance" },
    9: { path: "/holiday", name: "Holiday", icon: <HolidayVillage />, category: "HR" },
    10: { path: "/tickets", name: "Tickets", icon: <SupportAgent />, category: "Support" },
    11: { path: "/assets", name: "Assets", icon: <Laptop />, category: "IT" },
    15: { path: "/docket", name: "Docket", icon: <HowToReg />, category: "Operations" },
  }

  // Default routes visible to everyone
  const defaultRoutes = [
    { path: "/dashboard", name: "Dashboard", icon: <Dashboard />, category: "Main" },
    { path: "/notification", name: "Notifications", icon: <Notifications />, category: "Main", hasNotification: true },
  ]

  const userModules = user?.modules || []
  const allowedRoutes = userModules.map((moduleId) => moduleMapping[moduleId]).filter(Boolean)

  // HR-specific routes
  if (user?.role === "HR") {
    allowedRoutes.push(
      { path: "/employees", name: "Employees", icon: <Person />, category: "HR" },
      { path: "/report", name: "Reports", icon: <Summarize />, category: "Analytics" },
    )
  }

  // If module 5 (Visit) exists, also add Maps
  if (userModules.includes(5)) {
    allowedRoutes.push({ path: "/maps", name: "Maps", icon: <Map />, category: "Field" })
  }

  // Combine all available routes
  const routes = [...defaultRoutes, ...allowedRoutes]

  // Group routes by category
  const groupedRoutes = routes.reduce((acc, route) => {
    const category = route.category || "Other"
    if (!acc[category]) acc[category] = []
    acc[category].push(route)
    return acc
  }, {})

  const drawerWidth = isExpanded ? 280 : 100

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          bgcolor: "background.paper",
          borderRight: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[3],
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          overflowX: "hidden",
          "&::-webkit-scrollbar": {
            width: 6,
          },
          "&::-webkit-scrollbar-track": {
            bgcolor: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: theme.palette.divider,
            borderRadius: 3,
          },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: isExpanded ? "space-between" : "center",
          p: 2,
          minHeight: 64,
          bgcolor: theme.palette.primary.main,
          color: "white",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <HRSmileLogo  />
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Typography variant="h6" fontWeight="bold" sx={{ ml: 2 }}>
                  HR Smile
                </Typography>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
        {/* <IconButton
          onClick={() => setIsExpanded(!isExpanded)}
          sx={{
            color: "white",
            "&:hover": {
              bgcolor: "rgba(255, 255, 255, 0.1)",
            },
          }}
        >
          {isExpanded ? <ChevronLeft /> : <ChevronRight />}
        </IconButton> */}
      </Box>

      {/* User Info */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Box
              sx={{
                p: 2,
                bgcolor: theme.palette.grey[50],
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: theme.palette.primary.main,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "bold",
                    mr: 2,
                  }}
                >
                  {user?.username?.charAt(0)?.toUpperCase() || "U"}
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    {user?.username || "User"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.role || "Employee"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <Box sx={{ flexGrow: 1, py: 1 }}>
        {Object.entries(groupedRoutes).map(([category, categoryRoutes]) => (
          <Box key={category}>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      px: 2,
                      py: 1,
                      color: "text.secondary",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      display: "block",
                    }}
                  >
                    {category}
                  </Typography>
                </motion.div>
              )}
            </AnimatePresence>
            <List sx={{ py: 0 }}>
              {categoryRoutes.map((route, index) => (
                <NavItem
                  key={route.path}
                  route={route}
                  isActive={location.pathname === route.path}
                  isExpanded={isExpanded}
                  hasNotification={route.hasNotification}
                />
              ))}
            </List>
            {category !== "Other" && <Divider sx={{ mx: 2, my: 1 }} />}
          </Box>
        ))}
      </Box>

      
    </Drawer>
  )
}

export default Sidebar
