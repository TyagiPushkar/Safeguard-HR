"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../components/auth/AuthContext"
import { useNavigate, useLocation, Link } from "react-router-dom"
import {
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Tooltip,
  Divider,
  useTheme,
  useMediaQuery,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Breadcrumbs,
} from "@mui/material"
import {
  Notifications,
  Menu as MenuIcon,
  Search,
  Settings,
  Person,
  ExitToApp,
  DarkMode,
  LightMode,
  Dashboard,
  ChevronRight,
} from "@mui/icons-material"
import { motion, AnimatePresence } from "framer-motion"

// Mock logo component
const HRSmileLogo = () => (
  <Box
    sx={{
      width: 140,
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
    HR SMILE
  </Box>
)

// Enhanced Notification Item Component
const NotificationItem = ({ notification, onClick }) => {
  const theme = useTheme()

  return (
    <MenuItem
      onClick={onClick}
      sx={{
        py: 2,
        px: 3,
        borderBottom: `1px solid ${theme.palette.divider}`,
        "&:hover": {
          bgcolor: theme.palette.action.hover,
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", width: "100%" }}>
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: notification.type === "urgent" ? "error.main" : "primary.main",
            mr: 2,
          }}
        >
          <Notifications fontSize="small" />
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="body2" fontWeight="medium" gutterBottom>
            {notification.title}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            {notification.message}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {notification.time}
          </Typography>
        </Box>
        {notification.unread && (
          <Box
            sx={{
              width: 8,
              height: 8,
              bgcolor: "primary.main",
              borderRadius: "50%",
              ml: 1,
            }}
          />
        )}
      </Box>
    </MenuItem>
  )
}

function Navbar() {
  const [anchorEl, setAnchorEl] = useState(null)
  const [notificationAnchor, setNotificationAnchor] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [greeting, setGreeting] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [darkMode, setDarkMode] = useState(false)

  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  // Mock notifications
  const notifications = [
    {
      id: 1,
      title: "Leave Request Approved",
      message: "Your leave request for Dec 25-26 has been approved",
      time: "2 hours ago",
      type: "info",
      unread: true,
    },
    {
      id: 2,
      title: "Expense Report Due",
      message: "Please submit your expense report by end of day",
      time: "4 hours ago",
      type: "urgent",
      unread: true,
    },
    {
      id: 3,
      title: "Team Meeting Tomorrow",
      message: "Don't forget about the team meeting at 10 AM",
      time: "1 day ago",
      type: "info",
      unread: false,
    },
  ]

  const unreadCount = notifications.filter((n) => n.unread).length

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) {
      setGreeting("Good Morning")
    } else if (hour < 18) {
      setGreeting("Good Afternoon")
    } else {
      setGreeting("Good Evening")
    }
  }, [])

  const handleMenu = (event) => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)
  const handleNotificationMenu = (event) => setNotificationAnchor(event.currentTarget)
  const handleNotificationClose = () => setNotificationAnchor(null)
  const handleProfile = () => {
    setAnchorEl(null)
    navigate("/profile")
  }
  const handleLogout = () => {
    logout()
    navigate("/")
  }
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen)

  // Generate breadcrumbs from current path
  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split("/").filter((x) => x)
    return pathnames.map((name, index) => {
      const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`
      const isLast = index === pathnames.length - 1
      return {
        name: name.charAt(0).toUpperCase() + name.slice(1),
        path: routeTo,
        isLast,
      }
    })
  }

  const breadcrumbs = generateBreadcrumbs()

  const drawer = (
    <Box sx={{ width: 280, bgcolor: "background.paper", height: "100vh" }}>
      <Box
        sx={{
          p: 3,
          bgcolor: theme.palette.primary.main,
          color: "white",
          display: "flex",
          alignItems: "center",
        }}
      >
        <HRSmileLogo />
      </Box>
      <List sx={{ p: 2 }}>
        <ListItem button component={Link} to="/dashboard" selected={location.pathname === "/dashboard"}>
          <ListItemIcon>
            <Dashboard />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button component={Link} to="/notification" selected={location.pathname === "/notification"}>
          <ListItemIcon>
            <Badge badgeContent={unreadCount} color="error">
              <Notifications />
            </Badge>
          </ListItemIcon>
          <ListItemText primary="Notifications" />
        </ListItem>
      </List>
    </Box>
  )

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "background.paper",
          borderBottom: `1px solid ${theme.palette.divider}`,
          backdropFilter: "blur(8px)",
        }}
      >
        <Toolbar sx={{ minHeight: 64 }}>
          {/* Left Section */}
          <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
            {isMobile && (
              <IconButton onClick={handleDrawerToggle} sx={{ mr: 2 }}>
                <MenuIcon />
              </IconButton>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: "text.primary",
                    fontWeight: 600,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {greeting}, {user?.username || "Guest"}!
                </Typography>
              </motion.div>

              {/* Breadcrumbs */}
              {breadcrumbs.length > 0 && (
                <Breadcrumbs
                  separator={<ChevronRight fontSize="small" />}
                  sx={{ mt: 0.5 }}
                  aria-label="breadcrumb"
                >
                  <Link to="/dashboard" style={{ textDecoration: "none" }}>
                    <Typography variant="caption" color="text.secondary" sx={{ "&:hover": { color: "primary.main" } }}>
                      Home
                    </Typography>
                  </Link>
                  {breadcrumbs.map((crumb) => (
                    <Typography
                      key={crumb.path}
                      variant="caption"
                      color={crumb.isLast ? "text.primary" : "text.secondary"}
                      component={crumb.isLast ? "span" : Link}
                      to={crumb.isLast ? undefined : crumb.path}
                      sx={{
                        textDecoration: "none",
                        fontWeight: crumb.isLast ? 600 : 400,
                        "&:hover": !crumb.isLast ? { color: "primary.main" } : {},
                      }}
                    >
                      {crumb.name}
                    </Typography>
                  ))}
                </Breadcrumbs>
              )}
            </Box>
          </Box>

          {/* Center Section - Search */}
          {!isMobile && (
            <Box sx={{ mx: 4, minWidth: 300 }}>
              <TextField
                size="small"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 3,
                    bgcolor: theme.palette.action.hover,
                    "&:hover": {
                      bgcolor: theme.palette.action.selected,
                    },
                    "&.Mui-focused": {
                      bgcolor: "background.paper",
                    },
                  },
                }}
                fullWidth
              />
            </Box>
          )}

          {/* Right Section */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* Theme Toggle */}
            <Tooltip title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
              <IconButton onClick={() => setDarkMode(!darkMode)}>
                {darkMode ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Tooltip>

            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton onClick={handleNotificationMenu}>
                <Badge badgeContent={unreadCount} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* User Menu */}
            <Box sx={{ display: "flex", alignItems: "center", ml: 1 }}>
              <Chip
                avatar={<Avatar src={user?.image} sx={{ width: 24, height: 24 }} />}
                label={user?.role || "Employee"}
                variant="outlined"
                size="small"
                sx={{ mr: 1 }}
              />
              <Tooltip title="Account">
                <IconButton onClick={handleMenu}>
                  <Avatar
                    src={user?.image}
                    sx={{
                      width: 36,
                      height: 36,
                      border: `2px solid ${theme.palette.primary.main}`,
                    }}
                  />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            borderRadius: 2,
            boxShadow: theme.shadows[8],
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle2" fontWeight="bold">
            {user?.username || "Guest"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.email || "guest@example.com"}
          </Typography>
        </Box>
        <MenuItem onClick={handleProfile}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={() => navigate("/settings")}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
          <ListItemIcon>
            <ExitToApp fontSize="small" sx={{ color: "error.main" }} />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationClose}
        PaperProps={{
          sx: {
            mt: 1,
            maxWidth: 400,
            maxHeight: 500,
            borderRadius: 2,
            boxShadow: theme.shadows[8],
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" fontWeight="bold">
              Notifications
            </Typography>
            <Button size="small" onClick={() => navigate("/notification")}>
              View All
            </Button>
          </Box>
        </Box>
        <Box sx={{ maxHeight: 400, overflow: "auto" }}>
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClick={() => {
                handleNotificationClose()
                // Handle notification click
              }}
            />
          ))}
        </Box>
        {notifications.length === 0 && (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No notifications
            </Typography>
          </Box>
        )}
      </Menu>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            borderRadius: "0 16px 16px 0",
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  )
}

export default Navbar
