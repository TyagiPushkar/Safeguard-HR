"use client"

import React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
  useTheme,
  Stack,
  IconButton,
} from "@mui/material"
import {
  Search,
  Refresh,
  Person,
  CheckCircle,
  Cancel,
  Schedule,
  HowToReg,
  DateRange,
  Clear,
} from "@mui/icons-material"
import { format, parseISO } from "date-fns"
import axios from "axios"
import { useAuth } from "../components/auth/AuthContext"

const StatusBadge = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case "Present":
        return { color: "success", label: "Present", icon: <CheckCircle fontSize="small" /> }
      case "Absent":
        return { color: "error", label: "Absent", icon: <Cancel fontSize="small" /> }
      case "On Leave":
        return { color: "warning", label: "On Leave", icon: <Schedule fontSize="small" /> }
      default:
        return { color: "default", label: "Not Marked", icon: <Person fontSize="small" /> }
    }
  }
  

  const config = getStatusConfig()

  return (
    <Chip
      size="small"
      icon={config.icon}
      label={config.label}
      color={config.color}
      variant="outlined"
    />
  )
}

const ManualAttendancePage = () => {
  const { user } = useAuth()
  const theme = useTheme()
  
  const [employees, setEmployees] = useState([])
  const [filteredEmployees, setFilteredEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [markAttendanceDialog, setMarkAttendanceDialog] = useState(false)
  const [attendanceDate, setAttendanceDate] = useState(new Date())
  const [attendanceStatus, setAttendanceStatus] = useState("Present")
  const [submitting, setSubmitting] = useState(false)

  // Fetch employees data
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await axios.get(
          `https://namami-infotech.com/SAFEGUARD/src/employee/list_employee.php?Tenent_Id=${user.tenent_id}`,
          { timeout: 10000 }
        )

        if (response.data.success && response.data.data) {
          const employeesData = response.data.data.map(emp => ({
            ...emp,
            Name: emp.Name || emp.EmpName || "Unknown",
            EmpId: emp.EmpId,
            Department: emp.Department || emp.Dept || "N/A",
            Designation: emp.Designation || emp.Role || "N/A",
            TodayStatus: "Not Marked", // Default status
          }))
          
          setEmployees(employeesData)
          setFilteredEmployees(employeesData)
        } else {
          setError("No employee data found")
        }
      } catch (error) {
        console.error("Error fetching employees:", error)
        setError("Failed to load employee data")
      } finally {
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [user.tenent_id])

  const mapStatusToEvent = (status) => {
    switch (status) {
      case "Present":
        return "In"
      case "Absent":
        return "Absent"
      case "On Leave":
        return "Leave"
      case "Late":
        return "In"
      default:
        return "In"
    }
  }
  

  // Filter employees
  useEffect(() => {
    let result = [...employees]

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(emp =>
        (emp.Name && emp.Name.toLowerCase().includes(term)) ||
        (emp.EmpId && emp.EmpId.toLowerCase().includes(term)) ||
        (emp.Department && emp.Department.toLowerCase().includes(term))
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(emp => emp.TodayStatus === statusFilter)
    }

    setFilteredEmployees(result)
  }, [employees, searchTerm, statusFilter])

  const handleMarkAttendance = (employee) => {
    setSelectedEmployee(employee)
    setMarkAttendanceDialog(true)
  }

  const handleSubmitAttendance = async () => {
    try {
      setSubmitting(true)
  
      const payload = {
        EmpId: selectedEmployee.EmpId,
        LocationId: user.location_id || "3", // adjust if dynamic
        Event: mapStatusToEvent(attendanceStatus),
        GeoLocation: "29.954650,78.074980", // or from GPS
        MobileDateTime: format(attendanceDate, "yyyy-MM-dd HH:mm:ss"),
        app_ver: "Manual",
      }
  
      console.log("Submitting attendance:", payload)
  
      const response = await axios.post(
        "https://namami-infotech.com/SAFEGUARD/src/attendance/mark_attendance.php",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
  
      if (!response.data?.success) {
        throw new Error(response.data?.message || "Attendance failed")
      }
  
      // Update UI
      setEmployees(prev =>
        prev.map(emp =>
          emp.EmpId === selectedEmployee.EmpId
            ? { ...emp, TodayStatus: attendanceStatus }
            : emp
        )
      )
  
      setSuccess(`Attendance marked as ${attendanceStatus} for ${selectedEmployee.Name}`)
      setError(null)
      setMarkAttendanceDialog(false)
      setSelectedEmployee(null)
  
    } catch (err) {
      console.error(err)
      setError("Failed to mark attendance. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }
  

  const refreshData = () => {
    window.location.reload()
  }

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
  }

  return (
    <Box sx={{ p: 3, backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: "primary.main", color: "white" }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Manual Attendance
            </Typography>
            <Typography variant="body1">
              Mark attendance for employees manually
            </Typography>
          </Box>
          <IconButton onClick={refreshData} sx={{ color: "white" }}>
            <Refresh />
          </IconButton>
        </Box>
      </Paper>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ flex: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm("")}>
                    <Clear fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="Present">Present</MenuItem>
              <MenuItem value="Absent">Absent</MenuItem>
              <MenuItem value="On Leave">On Leave</MenuItem>
              <MenuItem value="Not Marked">Not Marked</MenuItem>
            </Select>
          </FormControl>

          {(searchTerm || statusFilter !== "all") && (
            <Button size="small" onClick={clearFilters} startIcon={<Clear />}>
              Clear Filters
            </Button>
          )}
        </Box>
      </Paper>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Loading */}
      {loading ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <LinearProgress sx={{ mb: 2, maxWidth: 400, mx: "auto" }} />
          <Typography>Loading employees...</Typography>
        </Box>
      ) : (
        <>
          {/* Results Count */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Showing {filteredEmployees.length} of {employees.length} employees
          </Typography>

          {/* Employee Table */}
          <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: "grey.100" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.EmpId} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ bgcolor: "primary.main" }}>
                            {employee.Name?.charAt(0) || employee.EmpId.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography fontWeight={600}>{employee.Name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {employee.Designation || "N/A"}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{employee.EmpId}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{employee.Department}</Typography>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={employee.TodayStatus} />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleMarkAttendance(employee)}
                          startIcon={<HowToReg />}
                        >
                          Mark
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* No Results */}
          {filteredEmployees.length === 0 && !loading && (
            <Paper sx={{ p: 8, textAlign: "center", borderRadius: 2, mt: 3 }}>
              <Person sx={{ fontSize: 60, color: "grey.400", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No employees found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Try adjusting your search or filter criteria
              </Typography>
            </Paper>
          )}
        </>
      )}

      {/* Mark Attendance Dialog */}
      <Dialog
        open={markAttendanceDialog}
        onClose={() => !submitting && setMarkAttendanceDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <HowToReg color="primary" />
            Mark Attendance
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedEmployee && (
            <Stack spacing={3} mt={1}>
              {/* Employee Info */}
              <Box p={2} sx={{ bgcolor: "grey.50", borderRadius: 1 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: "primary.main", width: 60, height: 60 }}>
                    {selectedEmployee.Name?.charAt(0) || selectedEmployee.EmpId.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {selectedEmployee.Name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedEmployee.EmpId} • {selectedEmployee.Department}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Current Status */}
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Current Status:
                </Typography>
                <StatusBadge status={selectedEmployee.TodayStatus} />
              </Box>

              {/* Attendance Date */}
              <TextField
                label="Attendance Date"
                type="date"
                value={format(attendanceDate, "yyyy-MM-dd")}
                onChange={(e) => setAttendanceDate(parseISO(e.target.value))}
                fullWidth
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DateRange />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Status Selection */}
              <FormControl fullWidth>
                <InputLabel>Attendance Status</InputLabel>
                <Select
                  value={attendanceStatus}
                  label="Attendance Status"
                  onChange={(e) => setAttendanceStatus(e.target.value)}
                >
                  <MenuItem value="Present">Present</MenuItem>
                  <MenuItem value="Absent">Absent</MenuItem>
                  <MenuItem value="On Leave">On Leave</MenuItem>
                  <MenuItem value="Late">Late</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setMarkAttendanceDialog(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitAttendance}
            disabled={submitting}
            startIcon={<HowToReg />}
          >
            {submitting ? 'Saving...' : 'Mark Attendance'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ManualAttendancePage