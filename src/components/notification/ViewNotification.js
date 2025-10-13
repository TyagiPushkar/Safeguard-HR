"use client"

import { useEffect, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Alert,
  TablePagination,
  InputAdornment,
  TextField,
  Stack,
  Divider,
  Badge,
  Fab,
  Zoom,
} from "@mui/material"
import {
  Add,
  Notifications,
  Search,
  Refresh,
  FilterList,
  NotificationsActive,
  Schedule,
  Link as LinkIcon,
  Image as ImageIcon,
  Visibility,
  Edit,
  Delete,
  NotificationImportant,
  AccessTime,
  Launch,
  Download,
  Settings,
} from "@mui/icons-material"
import { motion, AnimatePresence } from "framer-motion"
import { format, parseISO, isValid } from "date-fns"
import axios from "axios"
import AddNotification from "./AddNotification"
import { useAuth } from "../auth/AuthContext"

// Enhanced Stats Card Component
const StatsCard = ({ icon, title, value, color, subtitle, trend }) => {
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
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold" color={color}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}20`, color: color, width: 48, height: 48 }}>{icon}</Avatar>
        </Box>
        {trend && (
          <Box sx={{ mt: 2, display: "flex", alignItems: "center" }}>
            <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
              {trend}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

// Enhanced Notification Card for Mobile View
const NotificationCard = ({ notification, index, onView, onEdit, onDelete, isHR }) => {
  const theme = useTheme()

  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString)
      return isValid(date) ? format(date, "MMM dd, yyyy HH:mm") : "Invalid date"
    } catch {
      return "Invalid date"
    }
  }

  const getNotificationIcon = () => {
    if (notification.image) return <ImageIcon />
    if (notification.url) return <LinkIcon />
    return <NotificationsActive />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card
        sx={{
          mb: 2,
          borderLeft: `4px solid ${theme.palette.primary.main}`,
          "&:hover": {
            boxShadow: theme.shadows[8],
            transform: "translateY(-2px)",
            transition: "all 0.2s ease-in-out",
          },
        }}
      >
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
              <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>{getNotificationIcon()}</Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {notification.subject}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {notification.body}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <Tooltip title="View Details">
                <IconButton size="small" color="#8d0638ff" onClick={() => onView(notification)}>
                  <Visibility fontSize="small" />
                </IconButton>
              </Tooltip>
              {isHR && (
                <>
                  <Tooltip title="Edit">
                    <IconButton size="small" color="info" onClick={() => onEdit(notification)}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => onDelete(notification)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
          </Box>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <AccessTime fontSize="small" sx={{ mr: 1, color: theme.palette.info.main }} />
                <Typography variant="caption">{formatDate(notification.push_time)}</Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              {notification.url && (
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Launch fontSize="small" sx={{ mr: 1, color: theme.palette.secondary.main }} />
                  <Typography
                    variant="caption"
                    component="a"
                    href={notification.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: "primary.main",
                      textDecoration: "none",
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    Open Link
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>

          {notification.image && (
            <Box sx={{ mt: 2 }}>
              <img
                src={notification.image || "/placeholder.svg"}
                alt="Notification"
                style={{
                  width: "100%",
                  maxHeight: 200,
                  objectFit: "cover",
                  borderRadius: 8,
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function ViewNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [refreshing, setRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState("table") // 'table' or 'cards'

  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await axios.get(
        `https://namami-infotech.com/SAFEGUARD/src/notification/get_notification.php?Tenent_Id=${user.tenent_id}`,
      )
      setNotifications(response.data.notifications || [])
    } catch (err) {
      setError("Failed to fetch notifications")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [user.tenent_id])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchNotifications()
    setRefreshing(false)
  }

  const handleOpenDialog = () => setDialogOpen(true)
  const handleCloseDialog = () => setDialogOpen(false)
  const onNotificationAdded = () => fetchNotifications()

  const handleView = (notification) => {
    // Implement view details functionality
    console.log("View notification:", notification)
  }

  const handleEdit = (notification) => {
    // Implement edit functionality
    console.log("Edit notification:", notification)
  }

  const handleDelete = (notification) => {
    // Implement delete functionality
    console.log("Delete notification:", notification)
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  // Filter notifications based on search term
  const filteredNotifications = notifications.filter(
    (notification) =>
      notification.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.body.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Calculate stats
  const totalNotifications = notifications.length
  const recentNotifications = notifications.filter((n) => {
    const notificationDate = new Date(n.push_time)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return notificationDate >= weekAgo
  }).length

  const notificationsWithImages = notifications.filter((n) => n.image).length
  const notificationsWithLinks = notifications.filter((n) => n.url).length

  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString)
      return isValid(date) ? format(date, "MMM dd, yyyy HH:mm") : "Invalid date"
    } catch {
      return "Invalid date"
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 0, md: 0 }, bgcolor: "#f5f7fa", minHeight: "100vh" }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h4" fontWeight="bold" color="#8d0638ff">
            Notification Center
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? <CircularProgress size={20} /> : <Refresh />}
              </IconButton>
            </Tooltip>
            <Button variant="outlined" startIcon={<Download />} size="small">
              Export
            </Button>
            <Button variant="outlined" startIcon={<Settings />} size="small">
              Settings
            </Button>
          </Box>
        </Box>

        {/* Search and Controls */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                variant={viewMode === "table" ? "contained" : "outlined"}
                onClick={() => setViewMode("table")}
                size="small"
              >
                Table
              </Button>
              <Button
                variant={viewMode === "cards" ? "contained" : "outlined"}
                onClick={() => setViewMode("cards")}
                size="small"
              >
                Cards
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            icon={<Notifications />}
            title="Total Notifications"
            value={totalNotifications}
            color={theme.palette.primary.main}
            subtitle="All notifications"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            icon={<NotificationImportant />}
            title="Recent"
            value={recentNotifications}
            color={theme.palette.success.main}
            subtitle="Last 7 days"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            icon={<ImageIcon />}
            title="With Images"
            value={notificationsWithImages}
            color={theme.palette.info.main}
            subtitle="Media notifications"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            icon={<LinkIcon />}
            title="With Links"
            value={notificationsWithLinks}
            color={theme.palette.warning.main}
            subtitle="Action notifications"
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        {viewMode === "cards" || isMobile ? (
          // Card View
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Notifications ({filteredNotifications.length})
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <AnimatePresence>
              {filteredNotifications
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((notification, index) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    index={index}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isHR={user?.role === "HR"}
                  />
                ))}
            </AnimatePresence>
            {filteredNotifications.length === 0 && (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No notifications found
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          // Table View
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: "#8d0638ff" }}>
                <TableRow>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <NotificationsActive sx={{ mr: 1 }} />
                      Subject
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Body</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <LinkIcon sx={{ mr: 1 }} />
                      URL
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Schedule sx={{ mr: 1 }} />
                      Push Time
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <ImageIcon sx={{ mr: 1 }} />
                      Image
                    </Box>
                  </TableCell>
                  {user?.role === "HR" && (
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Actions</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                <AnimatePresence>
                  {filteredNotifications
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((notification, index) => (
                      <motion.tr
                        key={notification.id}
                        component={TableRow}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        sx={{
                          "&:hover": {
                            bgcolor: theme.palette.action.hover,
                            transform: "scale(1.01)",
                            transition: "all 0.2s ease",
                          },
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Avatar sx={{ mr: 2, width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
                              <NotificationsActive fontSize="small" />
                            </Avatar>
                            <Typography variant="body2" fontWeight="medium">
                              {notification.subject}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 200,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {notification.body}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {notification.url ? (
                            <Tooltip title={notification.url}>
                              <Button
                                component="a"
                                href={notification.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                startIcon={<Launch />}
                                size="small"
                                variant="outlined"
                              >
                                Open
                              </Button>
                            </Tooltip>
                          ) : (
                            <Chip label="No URL" size="small" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <AccessTime fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
                            <Typography variant="body2">{formatDate(notification.push_time)}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {notification.image ? (
                            <Box
                              component="img"
                              src={notification.image}
                              alt="Notification"
                              sx={{
                                width: 60,
                                height: 40,
                                objectFit: "cover",
                                borderRadius: 1,
                                cursor: "pointer",
                                "&:hover": {
                                  transform: "scale(1.1)",
                                  transition: "transform 0.2s ease",
                                },
                              }}
                            />
                          ) : (
                            <Chip label="No Image" size="small" variant="outlined" />
                          )}
                        </TableCell>
                        {user?.role === "HR" && (
                          <TableCell>
                            <Box sx={{ display: "flex", gap: 0.5 }}>
                              <Tooltip title="View">
                                <IconButton size="small" color="#8d0638ff" onClick={() => handleView(notification)}>
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit">
                                <IconButton size="small" color="info" onClick={() => handleEdit(notification)}>
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton size="small" color="error" onClick={() => handleDelete(notification)}>
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        )}
                      </motion.tr>
                    ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredNotifications.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Floating Action Button */}
      {user?.role === "HR" && (
        <Zoom in={true}>
          <Fab
            color="#8d0638ff"
            onClick={handleOpenDialog}
            sx={{
              position: "fixed",
              bottom: 16,
              right: 16,
              zIndex: theme.zIndex.speedDial,
            }}
          >
            <Add />
          </Fab>
        </Zoom>
      )}

      {/* Add Notification Dialog */}
      <AddNotification open={dialogOpen} onClose={handleCloseDialog} onNotificationAdded={onNotificationAdded} />
    </Box>
  )
}

export default ViewNotifications
