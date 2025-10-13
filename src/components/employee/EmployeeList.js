"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Typography,
  IconButton,
  Grid,
  TablePagination,
  Box,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  ListItemText,
  Card,
  CardContent,
  Chip,
  Avatar,
  Divider,
  useTheme,
  useMediaQuery,
  Alert,
  CircularProgress,
  Tooltip,
  InputAdornment,
  Fade,
} from "@mui/material"
import {
  Edit,
  Close,
  CheckCircle,
  Search,
  Person,
  Email,
  Phone,
  Work,
  Schedule,
  CalendarToday,
  Badge,
  LocationOn,
  Download,
  Refresh,
  Visibility,
  PersonAdd,
} from "@mui/icons-material"
import { CheckBox } from "@mui/icons-material"
import { motion, AnimatePresence } from "framer-motion"
import axios from "axios"
import { useAuth } from "../auth/AuthContext"

// Enhanced Employee Card Component for Mobile View
const EmployeeCard = ({ employee, onEdit, onToggleStatus, theme }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2, boxShadow: theme.shadows[8] }}
      transition={{ duration: 0.2 }}
    >
      <Card
        sx={{
          mb: 2,
          borderLeft: `4px solid ${employee.IsActive ? theme.palette.success.main : theme.palette.error.main}`,
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: theme.shadows[8],
            transition: "all 0.2s ease",
          },
        }}
      >
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Avatar
                sx={{
                  bgcolor: employee.IsActive ? theme.palette.primary.main : theme.palette.grey[400],
                  mr: 2,
                  width: 48,
                  height: 48,
                }}
              >
                {employee.Name.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {employee.Name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {employee.EmpId}
                </Typography>
              </Box>
            </Box>
            <Chip
              label={employee.IsActive ? "Active" : "Inactive"}
              color={employee.IsActive ? "success" : "error"}
              size="small"
            />
          </Box>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Phone fontSize="small" sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="body2">{employee.Mobile}</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Work fontSize="small" sx={{ mr: 1, color: theme.palette.secondary.main }} />
                <Typography variant="body2">{employee.Role}</Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Email fontSize="small" sx={{ mr: 1, color: theme.palette.info.main }} />
                <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
                  {employee.EmailId}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Schedule fontSize="small" sx={{ mr: 1, color: theme.palette.warning.main }} />
                <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
                  {employee.Shift}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Tooltip title="Edit Employee">
              <IconButton size="small" color="#8d0638ff" onClick={() => onEdit(employee)}>
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={employee.IsActive ? "Deactivate" : "Activate"}>
              <IconButton
                size="small"
                color={employee.IsActive ? "error" : "success"}
                onClick={() => onToggleStatus(employee)}
              >
                {employee.IsActive ? <Close fontSize="small" /> : <CheckCircle fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title="View Details">
              <IconButton size="small" color="info">
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Stats Card Component
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
      }}
    >
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
      </CardContent>
    </Card>
  )
}

function EmployeeList() {
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  const [employees, setEmployees] = useState([])
  const [offices, setOffices] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [openDetail, setOpenDetail] = useState(false)
  const [openForm, setOpenForm] = useState(false)
  const [formMode, setFormMode] = useState("add")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [filterRole, setFilterRole] = useState("")
  const [filterStatus, setFilterStatus] = useState("")

  const [formData, setFormData] = useState({
    EmpId: "",
    Name: "",
    Password: "",
    Mobile: "",
    EmailId: "",
    Role: "",
    OTP: "",
    IsOTPExpired: 1,
    IsGeofence: 0,
    Tenent_Id: "",
    IsActive: 1,
    OfficeId: null,
    OfficeName: "",
    LatLong: "",
    Distance: "",
    OfficeIsActive: 1,
    RM: "",
    Shift: "",
    WeekOff: "",
    Designation: "",
    DOB: "",
    JoinDate: "",
  })

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    fetchEmployees()
    fetchOffices()
  }, [])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const response = await axios.get(
        `https://namami-infotech.com/SAFEGUARD/src/employee/list_employee.php?Tenent_Id=${user.tenent_id}`,
      )
      if (response.data.success) {
        setEmployees(response.data.data)
      } else {
        setError("Failed to fetch employees")
      }
    } catch (error) {
      setError("Error fetching employees: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchOffices = async () => {
    try {
      const response = await axios.get("https://namami-infotech.com/SAFEGUARD/src/employee/get_office.php")
      if (response.data.success) {
        setOffices(response.data.data)
      }
    } catch (error) {
      console.error("Error fetching offices:", error)
    }
  }

  const handleCloseDetail = () => {
    setOpenDetail(false)
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleOpenForm = (mode, employee = null) => {
    setFormMode(mode)
    if (mode === "edit" && employee) {
      setFormData({
        EmpId: employee.EmpId,
        Name: employee.Name,
        Password: "",
        Mobile: employee.Mobile,
        EmailId: employee.EmailId,
        Role: employee.Role,
        OTP: employee.OTP,
        IsOTPExpired: employee.IsOTPExpired || 1,
        IsGeofence: employee.IsGeofence || 0,
        Tenent_Id: user.tenent_id,
        IsActive: employee.IsActive || 1,
        OfficeId: employee.OfficeId || null,
        OfficeName: employee.OfficeName || "",
        LatLong: employee.LatLong || "",
        Distance: employee.Distance || "",
        OfficeIsActive: employee.OfficeIsActive || 1,
        RM: employee.RM,
        Shift: employee.Shift,
        DOB: employee.DOB || "",
        JoinDate: employee.JoinDate || "",
        WeekOff: employee.WeekOff || "",
        Designation: employee.Designation || "",
      })
    } else {
      setFormData({
        EmpId: "",
        Name: "",
        Password: "",
        Mobile: "",
        EmailId: "",
        Role: "",
        OTP: "123456",
        IsOTPExpired: 1,
        IsGeofence: 0,
        Tenent_Id: user.tenent_id,
        IsActive: 1,
        OfficeId: null,
        OfficeName: "",
        LatLong: "",
        Distance: "",
        OfficeIsActive: 1,
        RM: "",
        Shift: "",
        DOB: "",
        JoinDate: "",
        WeekOff: "",
        Designation: "",
      })
    }
    setOpenForm(true)
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    const requiredFields = ["EmpId", "Name", "Mobile", "EmailId", "Role", "OfficeName", "LatLong", "Distance"]
    for (const field of requiredFields) {
      if (!formData[field]) {
        alert(`Please fill in all required fields. Missing: ${field}`)
        setSubmitting(false)
        return
      }
    }

    const formattedFormData = {
      EmpId: formData.EmpId,
      Name: formData.Name,
      Password: formData.Password,
      Mobile: formData.Mobile,
      EmailId: formData.EmailId,
      Role: formData.Role,
      OTP: formData.OTP || "123456",
      IsOTPExpired: formData.IsOTPExpired || 1,
      IsGeofence: formData.IsGeofence || 0,
      Tenent_Id: user.tenent_id,
      IsActive: formData.IsActive || 1,
      RM: formData.RM,
      Shift: formData.Shift,
      DOB: formData.DOB || "",
      JoinDate: formData.JoinDate || "",
      WeekOff: formData.WeekOff || "Sunday",
      Designation: formData.Designation,
      Offices: [
        {
          OfficeName: formData.OfficeName,
          LatLong: formData.LatLong,
        },
      ],
    }

    const url =
      formMode === "add"
        ? "https://namami-infotech.com/SAFEGUARD/src/employee/add_employee.php"
        : "https://namami-infotech.com/SAFEGUARD/src/employee/edit_employee.php"

    try {
      const response = await axios.post(url, formattedFormData)
      alert(response.data)

      if (response.data.success) {
        handleCloseForm()
        fetchEmployees()
      }
      handleCloseForm()
    } catch (error) {
      console.error("Error:", error.response ? error.response.data : error.message)
      alert(`Error: ${error.response ? error.response.data.message : error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleOfficeChange = (event) => {
    const selectedOfficeIds = event.target.value
    const selectedOffices = offices.filter((o) => selectedOfficeIds.includes(o.Id))

    setFormData((prevFormData) => ({
      ...prevFormData,
      OfficeId: selectedOfficeIds.join(","),
      OfficeName: selectedOffices.map((o) => o.OfficeName).join(","),
      LatLong: selectedOffices.map((o) => o.LatLong).join("|"),
      Distance: selectedOffices.map((o) => o.Distance).join(","),
    }))
  }

  const handleCloseForm = () => {
    setOpenForm(false)
    setError("")
  }

  const handleToggleEmployeeStatus = async (employee) => {
    if (!employee || !employee.EmpId) {
      console.error("Please provide both Employee ID and action")
      return
    }

    try {
      const action = employee.IsActive ? "disable" : "enable"
      const response = await axios.post(
        "https://namami-infotech.com/SAFEGUARD/src/employee/disable_employee.php",
        {
          EmpId: employee.EmpId,
          action: action,
        },
      )

      if (response.data.success) {
        fetchEmployees()
      } else {
        console.error("Error:", response.data.message)
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const filteredEmployees = employees.filter((employee) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    const matchesSearch = Object.keys(employee).some((key) => {
      const value = employee[key]
      return value != null && value.toString().toLowerCase().includes(lowerCaseSearchTerm)
    })

    const matchesRole = filterRole === "" || employee.Role === filterRole
    const matchesStatus = filterStatus === "" || employee.IsActive.toString() === filterStatus

    return matchesSearch && matchesRole && matchesStatus
  })

  // Calculate stats
  const totalEmployees = employees.length
  const activeEmployees = employees.filter((emp) => emp.IsActive).length
  const inactiveEmployees = totalEmployees - activeEmployees
  const hrCount = employees.filter((emp) => emp.Role === "HR").length

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <CircularProgress size={60} />
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 0, md: 0 }, bgcolor: "#f5f7fa", minHeight: "100vh" }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h4" fontWeight="bold" color="#8d0638ff">
            Employee Management
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Refresh Data">
              <IconButton onClick={fetchEmployees}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Button variant="outlined" startIcon={<Download />} size="small">
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={() => handleOpenForm("add")}
              sx={{ bgcolor: "#8d0638ff" }}
            >
              Add Employee
            </Button>
          </Box>
        </Box>

        {/* Search and Filters */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search employees..."
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
          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Filter by Role</InputLabel>
              <Select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} label="Filter by Role">
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="HR">HR</MenuItem>
                <MenuItem value="Employee">Employee</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Filter by Status</InputLabel>
              <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} label="Filter by Status">
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="1">Active</MenuItem>
                <MenuItem value="0">Inactive</MenuItem>
              </Select>
            </FormControl>
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
            icon={<Person />}
            title="Total Employees"
            value={totalEmployees}
            color={theme.palette.primary.main}
            subtitle="All registered employees"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            icon={<CheckCircle />}
            title="Active Employees"
            value={activeEmployees}
            color={theme.palette.success.main}
            subtitle="Currently active"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            icon={<Close />}
            title="Inactive Employees"
            value={inactiveEmployees}
            color={theme.palette.error.main}
            subtitle="Currently inactive"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            icon={<Work />}
            title="HR Personnel"
            value={hrCount}
            color={theme.palette.info.main}
            subtitle="HR department"
          />
        </Grid>
      </Grid>

      {/* Employee List */}
      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        {isMobile ? (
          // Mobile Card View
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Employee List ({filteredEmployees.length})
            </Typography>
            <AnimatePresence>
              {filteredEmployees
                .sort((a, b) => a.Name.localeCompare(b.Name))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((employee) => (
                  <EmployeeCard
                    key={employee.EmpId}
                    employee={employee}
                    onEdit={(emp) => handleOpenForm("edit", emp)}
                    onToggleStatus={handleToggleEmployeeStatus}
                    theme={theme}
                  />
                ))}
            </AnimatePresence>
          </Box>
        ) : (
          // Desktop Table View
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: "#8d0638ff" }}>
                <TableRow>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Badge sx={{ mr: 1 }} />
                      Employee ID
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Person sx={{ mr: 1 }} />
                      Name
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Phone sx={{ mr: 1 }} />
                      Mobile
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Email sx={{ mr: 1 }} />
                      Email
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Work sx={{ mr: 1 }} />
                      Role
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Schedule sx={{ mr: 1 }} />
                      Shift
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Status</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <AnimatePresence>
                  {filteredEmployees
                    .sort((a, b) => a.Name.localeCompare(b.Name))
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((employee, index) => (
                      <motion.tr
                        key={employee.EmpId}
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
                          <Typography variant="body2" fontWeight="medium">
                            {employee.EmpId}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Avatar sx={{ mr: 2, width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
                              {employee.Name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" fontWeight="medium">
                              {employee.Name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{employee.Mobile}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}
                          >
                            {employee.EmailId}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={employee.Role}
                            color={employee.Role === "HR" ? "primary" : "default"}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{employee.Shift}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={employee.IsActive ? "Active" : "Inactive"}
                            color={employee.IsActive ? "success" : "error"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            <Tooltip title="Edit Employee">
                              <IconButton size="small" color="#8d0638ff" onClick={() => handleOpenForm("edit", employee)}>
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={employee.IsActive ? "Deactivate" : "Activate"}>
                              <IconButton
                                size="small"
                                color={employee.IsActive ? "error" : "success"}
                                onClick={() => handleToggleEmployeeStatus(employee)}
                              >
                                {employee.IsActive ? <Close fontSize="small" /> : <CheckCircle fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View Details">
                              <IconButton size="small" color="info">
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
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
          count={filteredEmployees.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Enhanced Form Dialog */}
      <Dialog
        open={openForm}
        onClose={handleCloseForm}
        maxWidth="md"
        fullWidth
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: "90vh",
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "#8d0638ff",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <PersonAdd sx={{ mr: 1 }} />
            {formMode === "add" ? "Add New Employee" : "Edit Employee"}
          </Box>
          <IconButton onClick={handleCloseForm} sx={{ color: "white" }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <form onSubmit={handleFormSubmit}>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Personal Information Section */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                  <Person sx={{ mr: 1, color: theme.palette.primary.main }} />
                  Personal Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Employee ID"
                  value={formData.EmpId}
                  onChange={(e) => setFormData({ ...formData, EmpId: e.target.value })}
                  required
                  disabled={formMode === "edit"}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Badge color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.Name}
                  onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.Password}
                  onChange={(e) => setFormData({ ...formData, Password: e.target.value })}
                  required
                  disabled={formMode === "edit"}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Mobile Number"
                  value={formData.Mobile}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value.length <= 10) {
                      setFormData({ ...formData, Mobile: value })
                    }
                  }}
                  required
                  type="number"
                  inputProps={{ maxLength: 10 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={formData.EmailId}
                  onChange={(e) => setFormData({ ...formData, EmailId: e.target.value })}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Designation"
                  value={formData.Designation}
                  onChange={(e) => setFormData({ ...formData, Designation: e.target.value })}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Work color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  type="date"
                  value={formData.DOB}
                  onChange={(e) => setFormData({ ...formData, DOB: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarToday color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date of Joining"
                  type="date"
                  value={formData.JoinDate}
                  onChange={(e) => setFormData({ ...formData, JoinDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarToday color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Work Information Section */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", mt: 2 }}>
                  <Work sx={{ mr: 1, color: theme.palette.primary.main }} />
                  Work Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Role"
                  value={formData.Role}
                  onChange={(e) => setFormData({ ...formData, Role: e.target.value })}
                  required
                >
                  <MenuItem value="HR">HR</MenuItem>
                  <MenuItem value="Employee">Employee</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Shift</InputLabel>
                  <Select
                    value={formData.Shift}
                    onChange={(e) => setFormData({ ...formData, Shift: e.target.value })}
                    label="Shift"
                  >
                    <MenuItem value="9:00 AM - 6:00 PM">9:00 AM - 6:00 PM</MenuItem>
                    <MenuItem value="9:30 AM - 6:30 PM">9:30 AM - 6:30 PM</MenuItem>
                    <MenuItem value="10:00 AM - 7:00 PM">10:00 AM - 7:00 PM</MenuItem>
                    <MenuItem value="11:00 AM - 8:00 PM">11:00 AM - 8:00 PM</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Week Off</InputLabel>
                  <Select
                    multiple
                    value={formData.WeekOff ? formData.WeekOff.split(",") : []}
                    onChange={(e) => setFormData({ ...formData, WeekOff: e.target.value.join(",") })}
                    renderValue={(selected) => selected.join(", ")}
                  >
                    {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                      <MenuItem key={day} value={day}>
                        <CheckBox checked={formData.WeekOff?.split(",").includes(day)} />
                        <ListItemText primary={day} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Office</InputLabel>
                  <Select
                    multiple
                    value={formData.OfficeId ? formData.OfficeId.split(",") : []}
                    onChange={handleOfficeChange}
                    label="Office"
                    renderValue={(selected) =>
                      selected
                        .map((id) => {
                          const office = offices.find((o) => o.Id === id)
                          return office ? office.OfficeName : id
                        })
                        .join(", ")
                    }
                  >
                    {offices.map((office) => (
                      <MenuItem key={office.Id} value={office.Id}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <LocationOn sx={{ mr: 1, color: "text.secondary" }} />
                          {office.OfficeName}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </form>
        </DialogContent>

        <DialogActions sx={{ p: 3, bgcolor: "#f5f5f5" }}>
          <Button onClick={handleCloseForm} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleFormSubmit}
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : <CheckCircle />}
            sx={{ bgcolor: "#8d0638ff" }}
          >
            {submitting ? "Saving..." : formMode === "add" ? "Add Employee" : "Update Employee"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={openDetail} onClose={handleCloseDetail}>
        <DialogTitle>Employee Details</DialogTitle>
        <DialogContent>{/* Employee details content */}</DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail} color="#8d0638ff">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default EmployeeList
