"use client"

import { useState } from "react"
import { useLocation, Link } from "react-router-dom"
import {
  List,
  ListItem,
  Box,
  ListItemIcon,
  Typography,
  Tooltip,
  Divider,
  useTheme,
  useMediaQuery,
  Badge,
  Drawer,
} from "@mui/material"
import {
  Dashboard,
  HolidayVillage,
  Policy,
  Notifications,
  Person,
  BarChart,
  AccountBalanceWallet,
  AddLocationAlt,
  LocalAirport,
  HowToReg,
  Map,
  SupportAgent,
  Laptop,
  Summarize,
} from "@mui/icons-material"
import { useAuth } from "./auth/AuthContext"
import logo from "../assets/HRSmileLogo.jpeg"

// Simple logo
const HRSmileLogo = () => (
  <Box
    sx={{
      width: 45,
      height: 45,
      borderRadius: 2,
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      bgcolor: "#8d0638ff",
    }}
  >
    <img
      src={logo}
      alt="S-HR Logo"
      style={{ width: "100%", height: "100%", objectFit: "contain" }}
    />
  </Box>
)

// --- Simplified Nav Item ---
const NavItem = ({ route, isActive, isExpanded, hasNotification = false }) => {
  const theme = useTheme()
  return (
    <Tooltip title={!isExpanded ? route.name : ""} placement="right" arrow>
      <ListItem
        component={Link}
        to={route.path}
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: isExpanded ? "flex-start" : "center",
          flexDirection: isExpanded ? "row" : "column",
          color: isActive ? "white" : theme.palette.text.primary,
          bgcolor: isActive ? "#8d0638ff" : "transparent",
          borderRadius: 2,
          mx: 1,
          my: 0.6,
          px: isExpanded ? 2 : 1,
          py: 1.2,
          transition: "all 0.25s ease",
          "&:hover": {
            bgcolor: isActive ? "#9a1f4b" : theme.palette.action.hover,
            boxShadow: isActive ? theme.shadows[2] : theme.shadows[1],
          },
          textDecoration: 'none',
        }}
      >
        <ListItemIcon
          sx={{
            color: "inherit",
            minWidth: isExpanded ? 40 : "auto",
            mr: isExpanded ? 1.2 : 0,
            display: "flex",
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

        {isExpanded ? (
          <Typography
            variant="body2"
            fontWeight={isActive ? 600 : 400}
            sx={{
              whiteSpace: "nowrap",
              opacity: 0.95,
            }}
          >
            {route.name}
          </Typography>
        ) : (
          <Typography
            variant="caption"
            sx={{
              mt: 0.5,
              fontSize: "0.65rem",
              textAlign: "center",
              opacity: 0.8,
            }}
          >
            {route.name}
          </Typography>
        )}
      </ListItem>
    </Tooltip>
  )
}

// --- Sidebar ---
function Sidebar({ open, onClose, variant = "permanent" }) { // Add props for mobile
  const location = useLocation()
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const [isExpanded, setIsExpanded] = useState(true)

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

  const defaultRoutes = [
    { path: "/dashboard", name: "Dashboard", icon: <Dashboard />, category: "Main" },
    { path: "/notification", name: "Notifications", icon: <Notifications />, category: "Main", hasNotification: true },
  ]

  const userModules = user?.modules || []
  const allowedRoutes = userModules.map((id) => moduleMapping[id]).filter(Boolean)

  if (user?.role === "HR") {
    allowedRoutes.push(
      { path: "/employees", name: "Employees", icon: <Person />, category: "HR" },
      { path: "/report", name: "Reports", icon: <Summarize />, category: "Analytics" },
    )
  }

  if (userModules.includes(5)) {
    allowedRoutes.push({ path: "/maps", name: "Maps", icon: <Map />, category: "Field" })
  }

  const routes = [...defaultRoutes, ...allowedRoutes]
  const groupedRoutes = routes.reduce((acc, r) => {
    const cat = r.category || "Other"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(r)
    return acc
  }, {})

  const sidebarContent = (
    <>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: isExpanded ? "space-between" : "center",
          p: 2,
          bgcolor: theme.palette.primary.main,
          color: "white",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <HRSmileLogo />
          
        </Box>
      </Box>

      {/* User Info */}
     

      {/* Navigation */}
      <Box sx={{ flexGrow: 1, py: 1 }}>
        {Object.entries(groupedRoutes).map(([category, categoryRoutes]) => (
          <Box key={category} sx={{ mb: 1 }}>
            {isExpanded && (
              <Typography
                variant="overline"
                sx={{
                  px: 2,
                  color: "text.secondary",
                  fontWeight: 600,
                  letterSpacing: 0.8,
                }}
              >
                {category}
              </Typography>
            )}
            <List sx={{ py: 0 }}>
              {categoryRoutes.map((route) => (
                <NavItem
                  key={route.path}
                  route={route}
                  isActive={location.pathname === route.path}
                  isExpanded={isExpanded}
                  hasNotification={route.hasNotification}
                />
              ))}
            </List>
            <Divider sx={{ mx: 2, opacity: 0.3 }} />
          </Box>
        ))}
      </Box>
    </>
  )

  // For mobile, use temporary drawer
  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
          },
        }}
      >
        {sidebarContent}
      </Drawer>
    )
  }

  // For desktop, use permanent drawer
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
          borderRight: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      {sidebarContent}
    </Drawer>
  )
}

export default Sidebar