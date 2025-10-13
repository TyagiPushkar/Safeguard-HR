"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  TablePagination,
  IconButton,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  useTheme,
  useMediaQuery,
  Alert,
  TextField,
  InputAdornment,
  Stack,
  Divider,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Zoom,
} from "@mui/material"
import {
  Check,
  Cancel,
  Search,
  FilterList,
  Download,
  Refresh,
  EventAvailable,
  Person,
  CalendarToday,
  Schedule,
  Description,
  MoreVert,
  Visibility,
  Edit,
  Delete,
  Add,
  TrendingUp,
  AccessTime,
  Category,
} from "@mui/icons-material"
import { motion, AnimatePresence } from "framer-motion"
import { format, parseISO, isValid, differenceInDays } from "date-fns"
import axios from "axios"
import { useAuth } from "../auth/AuthContext"
import ApplyLeave from "./ApplyLeave"

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
            <TrendingUp fontSize="small" sx={{ color: "success.main", mr: 0.5 }} />
            <Typography variant="caption" color="success.main" fontWeight="600">
              {trend}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

// Enhanced Leave Card for Mobile View
const LeaveCard = ({ leave, employee, onStatusChange, isHR, index }) => {
  const theme = useTheme()
  const [anchorEl, setAnchorEl] = useState(null)

  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString)
      return isValid(date) ? format(date, "MMM dd, yyyy") : "Invalid date"
    } catch {
      return "Invalid date"
    }
  }

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "success"
      case "rejected":
        return "error"
      case "pending":
        return "warning"
      default:
        return "default"
    }
  }

  const calculateDays = () => {
    try {
      const start = parseISO(leave.StartDate)
      const end = parseISO(leave.EndDate)
      return differenceInDays(end, start) + 1
    } catch {
      return 0
    }
  }

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleStatusChange = (status) => {
    onStatusChange(leave.Id, status)
    handleMenuClose()
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
          borderLeft: `4px solid ${theme.palette[getStatusColor(leave.Status)].main}`,
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
              <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                <Person />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {employee?.Name || "Unknown Employee"}
                </Typography>
                <Chip label={leave.Status} color={getStatusColor(leave.Status)} size="small" />
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <Tooltip title="View Details">
                <IconButton size="small" color="#8d0638ff">
                  <Visibility fontSize="small" />
                </IconButton>
              </Tooltip>
              {isHR && leave.Status === "Pending" && (
                <>
                  <IconButton size="small" onClick={handleMenuClick}>
                    <MoreVert fontSize="small" />
                  </IconButton>
                  <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                    <MenuItem onClick={() => handleStatusChange("Approved")}>
                      <Check sx={{ mr: 1, color: "success.main" }} />
                      Approve
                    </MenuItem>
                    <MenuItem onClick={() => handleStatusChange("Rejected")}>
                      <Cancel sx={{ mr: 1, color: "error.main" }} />
                      Reject
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Box>
          </Box>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <CalendarToday fontSize="small" sx={{ mr: 1, color: theme.palette.info.main }} />
                <Typography variant="caption" color="text.secondary">
                  Duration
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight="medium">
                {calculateDays()} day{calculateDays() !== 1 ? "s" : ""}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Category fontSize="small" sx={{ mr: 1, color: theme.palette.secondary.main }} />
                <Typography variant="caption" color="text.secondary">
                  Type
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight="medium">
                {leave.Category}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Schedule fontSize="small" sx={{ mr: 1, color: theme.palette.warning.main }} />
                <Typography variant="caption" color="text.secondary">
                  Dates
                </Typography>
              </Box>
              <Typography variant="body2">
                {formatDate(leave.StartDate)} - {formatDate(leave.EndDate)}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Description fontSize="small" sx={{ mr: 1, color: theme.palette.text.secondary }} />
                <Typography variant="caption" color="text.secondary">
                  Reason
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                {leave.Reason}
              </Typography>
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="caption" color="text.secondary">
              Applied: {leave.CreatedAt}
            </Typography>
            {isHR && leave.Status === "Pending" && (
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  startIcon={<Check />}
                  onClick={() => onStatusChange(leave.Id, "Approved")}
                >
                  Approve
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<Cancel />}
                  onClick={() => onStatusChange(leave.Id, "Rejected")}
                >
                  Reject
                </Button>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function ViewLeave() {
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  const [leaves, setLeaves] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState("table") // 'table' or 'cards'
  const [applyLeaveOpen, setApplyLeaveOpen] = useState(false)

  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString)
      return isValid(date) ? format(date, "dd/MM/yyyy") : "Invalid date"
    } catch {
      return "Invalid date"
    }
  }

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get(
          "https://namami-infotech.com/SAFEGUARD/src/employee/list_employee.php",
          {
            params: { Tenent_Id: user.tenent_id },
          },
        )

        if (response.data.success) {
          setEmployees(response.data.data)
        } else {
          setError(response.data.message)
        }
      } catch (error) {
        setError("Error fetching employee data")
        console.error("Error:", error)
      }
    }

    fetchEmployees()
  }, [user.tenent_id])

  useEffect(() => {
    if (employees.length > 0) {
      fetchLeaves()
    }
  }, [employees])

  const fetchLeaves = async () => {
    if (!user || !user.emp_id) {
      setError("User is not authenticated")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const params = user.role === "HR" ? { role: user.role } : { empId: user.emp_id }
      const response = await axios.get("https://namami-infotech.com/SAFEGUARD/src/leave/get_leave.php", {
        params,
      })

      if (response.data.success) {
        const filteredLeaves = response.data.data.filter((leave) =>
          employees.some((emp) => emp.EmpId === leave.EmpId),
        )
        setLeaves(filteredLeaves)
      } else {
        setError(response.data.message)
      }
    } catch (error) {
      setError("Error fetching leave data")
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchLeaves()
    setRefreshing(false)
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await axios.post("https://namami-infotech.com/SAFEGUARD/src/leave/approve_leave.php", {
        id,
        status: newStatus,
      })

      if (response.data.success) {
        setLeaves(leaves.map((leave) => (leave.Id === id ? { ...leave, Status: newStatus } : leave)))
        fetchLeaves()
      } else {
        setError(response.data.message)
      }
    } catch (error) {
      setError("Error updating leave status")
      console.error("Error:", error)
    }
  }

  const exportToCsv = () => {
    const csvRows = [["Employee Name", "Start Date", "End Date", "Category", "Reason", "Status", "Applied On"]]

    filteredLeaves.forEach(({ EmpId, StartDate, EndDate, Category, Reason, Status, CreatedAt }) => {
      const employee = employees.find((emp) => emp.EmpId === EmpId)
      const employeeName = employee ? employee.Name : "Unknown"
      csvRows.push([employeeName, formatDate(StartDate), formatDate(EndDate), Category, Reason, Status, CreatedAt])
    })

    const csvContent = csvRows.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.href = url
    link.setAttribute("download", `leaves_${format(new Date(), "yyyy-MM-dd")}.csv`)
    link.click()
    URL.revokeObjectURL(url)
  }

  // Filter leaves based on search and status
  const filteredLeaves = leaves.filter((leave) => {
    const employee = employees.find((emp) => emp.EmpId === leave.EmpId)
    const employeeName = employee ? employee.Name.toLowerCase() : ""

    const matchesSearch =
      employeeName.includes(searchTerm.toLowerCase()) ||
      leave.Reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.Category.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "" || leave.Status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Calculate stats
  const totalLeaves = leaves.length
  const pendingLeaves = leaves.filter((leave) => leave.Status === "Pending").length
  const approvedLeaves = leaves.filter((leave) => leave.Status === "Approved").length
  const rejectedLeaves = leaves.filter((leave) => leave.Status === "Rejected").length

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "success"
      case "rejected":
        return "error"
      case "pending":
        return "warning"
      default:
        return "default"
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
            Leave Management
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? <CircularProgress size={20} /> : <Refresh />}
              </IconButton>
            </Tooltip>
            <Button variant="outlined" startIcon={<Download />} onClick={exportToCsv} size="small">
              Export CSV
            </Button>
          </Box>
        </Box>

        {/* Search and Filters */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by employee name, reason, or category..."
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
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Filter by Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Approved">Approved</MenuItem>
              <MenuItem value="Rejected">Rejected</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <Stack direction="row" spacing={1}>
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
            icon={<EventAvailable />}
            title="Total Leaves"
            value={totalLeaves}
            color={theme.palette.primary.main}
            subtitle="All applications"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            icon={<AccessTime />}
            title="Pending"
            value={pendingLeaves}
            color={theme.palette.warning.main}
            subtitle="Awaiting approval"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            icon={<Check />}
            title="Approved"
            value={approvedLeaves}
            color={theme.palette.success.main}
            subtitle="Approved leaves"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            icon={<Cancel />}
            title="Rejected"
            value={rejectedLeaves}
            color={theme.palette.error.main}
            subtitle="Rejected leaves"
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        {viewMode === "cards" || isMobile ? (
          // Card View
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Leave Applications ({filteredLeaves.length})
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <AnimatePresence>
              {filteredLeaves.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((leave, index) => {
                const employee = employees.find((emp) => emp.EmpId === leave.EmpId)
                return (
                  <LeaveCard
                    key={leave.Id}
                    leave={leave}
                    employee={employee}
                    onStatusChange={handleStatusChange}
                    isHR={user.role === "HR"}
                    index={index}
                  />
                )
              })}
            </AnimatePresence>
            {filteredLeaves.length === 0 && (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No leave applications found
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
                      <Person sx={{ mr: 1 }} />
                      Employee
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <CalendarToday sx={{ mr: 1 }} />
                      Dates
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Category sx={{ mr: 1 }} />
                      Category
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Description sx={{ mr: 1 }} />
                      Reason
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Status</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Schedule sx={{ mr: 1 }} />
                      Applied On
                    </Box>
                  </TableCell>
                  {user.role === "HR" && <TableCell sx={{ color: "white", fontWeight: "bold" }}>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                <AnimatePresence>
                  {filteredLeaves
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((leave, index) => {
                      const employee = employees.find((emp) => emp.EmpId === leave.EmpId)
                      const employeeName = employee ? employee.Name : "Unknown"

                      return (
                        <motion.tr
                          key={leave.Id}
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
                                <Person fontSize="small" />
                              </Avatar>
                              <Typography variant="body2" fontWeight="medium">
                                {employeeName}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(leave.StartDate)} - {formatDate(leave.EndDate)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={leave.Category} variant="outlined" size="small" />
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
                              {leave.Reason}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={leave.Status} color={getStatusColor(leave.Status)} size="small" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{leave.CreatedAt}</Typography>
                          </TableCell>
                          {user.role === "HR" && (
                            <TableCell>
                              <Box sx={{ display: "flex", gap: 0.5 }}>
                                <Tooltip title="Approve">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleStatusChange(leave.Id, "Approved")}
                                    disabled={leave.Status === "Approved" || leave.Status === "Rejected"}
                                  >
                                    <Check fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reject">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleStatusChange(leave.Id, "Rejected")}
                                    disabled={leave.Status === "Approved" || leave.Status === "Rejected"}
                                  >
                                    <Cancel fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="View Details">
                                  <IconButton size="small" color="info">
                                    <Visibility fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          )}
                        </motion.tr>
                      )
                    })}
                </AnimatePresence>
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredLeaves.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Floating Action Button */}
      <Zoom in={true}>
        <Fab
          color="#8d0638ff"
          onClick={() => setApplyLeaveOpen(true)}
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

      {/* Apply Leave Dialog */}
      <ApplyLeave
        open={applyLeaveOpen}
        onClose={() => setApplyLeaveOpen(false)}
        onLeaveApplied={() => {
          fetchLeaves()
          setApplyLeaveOpen(false)
        }}
      />
    </Box>
  )
}

export default ViewLeave
