"use client"

import { useEffect, useState } from "react"
import {
  Typography,
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Stack,
  useTheme,
  useMediaQuery,
  Fade,
} from "@mui/material"
import { GetApp, DateRange, Schedule } from "@mui/icons-material"
import axios from "axios"
import { saveAs } from "file-saver"
import { useAuth } from "../auth/AuthContext"

const AttendanceReport = () => {
  const { user } = useAuth()
  const [employees, setEmployees] = useState([])
  const [attendance, setAttendance] = useState([])
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [filteredAttendance, setFilteredAttendance] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [employeesResponse, attendanceResponse] = await Promise.all([
          axios.get(
            `https://namami-infotech.com/SAFEGUARD/src/employee/list_employee.php?Tenent_Id=${user.tenent_id}`,
          ),
          axios.get("https://namami-infotech.com/SAFEGUARD/src/attendance/get_attendance.php"),
        ])
        if (employeesResponse.data.success) setEmployees(employeesResponse.data.data)
        if (attendanceResponse.data.success) setAttendance(attendanceResponse.data.data)
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user.tenent_id])

  useEffect(() => {
    const filterAttendance = () => {
      if (!fromDate || !toDate) {
        setFilteredAttendance([])
        return
      }
      const startDate = new Date(fromDate)
      const endDate = new Date(toDate)
      const filtered = attendance.filter((record) => {
        const recordDate = new Date(record.InTime)
        return recordDate >= startDate && recordDate <= endDate
      })
      setFilteredAttendance(filtered)
    }
    filterAttendance()
  }, [fromDate, toDate, attendance])

  const exportAttendanceToCSV = () => {
    if (!filteredAttendance.length) return alert("No data available for export.")
    const uniqueDates = [...new Set(filteredAttendance.map((record) => record.InTime.split(" ")[0]))].sort()
    const csvHeader = ["S. No.", "Employee Name", ...uniqueDates.flatMap((date) => [date + " In", date + " Out"])]
    const csvRows = employees.map((employee, index) => {
      const row = [index + 1, employee.Name]
      uniqueDates.forEach((date) => {
        const attendanceRecords = filteredAttendance.filter(
          (record) => record.EmpId === employee.EmpId && record.InTime.startsWith(date),
        )
        if (attendanceRecords.length > 0) {
          const inTime = attendanceRecords[0].InTime.split(" ")[1] || ""
          const outTime = attendanceRecords[0].OutTime ? attendanceRecords[0].OutTime.split(" ")[1] : ""
          row.push(inTime, outTime)
        } else row.push("Absent", "Absent")
      })
      return row
    })
    const csvContent = [csvHeader, ...csvRows].map((e) => e.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    saveAs(blob, "attendance_report.csv")
  }

  const getAttendanceStats = () => {
    if (!filteredAttendance.length) return { totalRecords: 0, uniqueEmployees: 0, dateRange: 0 }
    const uniqueEmployees = new Set(filteredAttendance.map((record) => record.EmpId)).size
    const uniqueDates = new Set(filteredAttendance.map((record) => record.InTime.split(" ")[0])).size
    return { totalRecords: filteredAttendance.length, uniqueEmployees, dateRange: uniqueDates }
  }

  const stats = getAttendanceStats()

  return (
    <Card sx={{ boxShadow: 4, borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h5" component="h2" sx={{ mb: 3, color: "primary.main", fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
          <Schedule /> Attendance Report
        </Typography>

        {/* Controls */}
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <TextField
              label="From Date"
              type="date"
              size="small"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              InputProps={{ startAdornment: <DateRange sx={{ mr: 1, color: "action.active" }} /> }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="To Date"
              type="date"
              size="small"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              InputProps={{ startAdornment: <DateRange sx={{ mr: 1, color: "action.active" }} /> }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack direction={isMobile ? "column" : "row"} spacing={2} justifyContent="flex-end">
              <Button
                variant="contained"
                onClick={exportAttendanceToCSV}
                startIcon={<GetApp />}
                disabled={!filteredAttendance.length || loading}
                sx={{
                  bgcolor: "primary.main",
                  "&:hover": { bgcolor: "primary.dark", transform: "scale(1.03)" },
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Export Report
              </Button>
            </Stack>
          </Grid>
        </Grid>

        {/* Stats Cards */}
        {fromDate && toDate && filteredAttendance.length > 0 && (
          <Fade in>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {[
                { title: "Total Records", value: stats.totalRecords, bg: "linear-gradient(135deg, #e3f2fd, #bbdefb)" },
                { title: "Active Employees", value: stats.uniqueEmployees, bg: "linear-gradient(135deg, #e8f5e8, #c8e6c9)" },
                { title: "Days Covered", value: stats.dateRange, bg: "linear-gradient(135deg, #fff3e0, #ffcc80)" },
              ].map((stat, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Card
                    sx={{
                      background: stat.bg,
                      borderRadius: 3,
                      boxShadow: 3,
                      transition: "all 0.3s ease",
                      "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
                    }}
                  >
                    <CardContent sx={{ textAlign: "center", py: 3 }}>
                      <Typography variant="h4" fontWeight="bold" color="text.primary">
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.title}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Fade>
        )}

        {/* Loading */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
            <CircularProgress size={40} sx={{ mr: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Loading attendance data...
            </Typography>
          </Box>
        )}

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {/* No Data */}
        {fromDate && toDate && !loading && filteredAttendance.length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            No attendance records found for the selected date range.
          </Alert>
        )}

        {/* Summary Info */}
        {fromDate && toDate && filteredAttendance.length > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Report Period:</strong> {new Date(fromDate).toLocaleDateString()} to{" "}
              {new Date(toDate).toLocaleDateString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Generated:</strong> {new Date().toLocaleDateString()}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default AttendanceReport
