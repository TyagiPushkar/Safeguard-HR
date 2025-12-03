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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material"
import { GetApp, DateRange, Schedule } from "@mui/icons-material"
import axios from "axios"
import { saveAs } from "file-saver"
import { useAuth } from "../auth/AuthContext"

const AttendanceReport = () => {
  const { user } = useAuth()
  const [employees, setEmployees] = useState([])
  const [attendance, setAttendance] = useState([])
  const [leaveData, setLeaveData] = useState([])
  const [month, setMonth] = useState("")
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  const monthNames = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN", 
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
  ]

  // Normal shift timing: 9:00 AM to 6:00 PM (9 hours)
  const SHIFT_START_HOUR = 9
  const SHIFT_END_HOUR = 18
  const NORMAL_SHIFT_HOURS = 9
  const LATE_THRESHOLD_MINUTES = 5 // 9:05 AM threshold

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [employeesResponse, attendanceResponse, leaveResponse] = await Promise.all([
          axios.get(
            `https://namami-infotech.com/SAFEGUARD/src/employee/list_employee.php?Tenent_Id=${user.tenent_id}`,
          ),
          axios.get("https://namami-infotech.com/SAFEGUARD/src/attendance/get_attendance.php"),
          axios.get("https://namami-infotech.com/SAFEGUARD/src/leave/get_leave.php?role=HR"),
        ])

        if (employeesResponse.data.success) {
          setEmployees(employeesResponse.data.data)
        }

        if (attendanceResponse.data.success) {
          setAttendance(attendanceResponse.data.data)
        }

        if (leaveResponse.data.success) {
          setLeaveData(leaveResponse.data.data)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user.tenent_id])

  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate()
  }

  const isSunday = (dateString) => {
    const date = new Date(dateString)
    return date.getDay() === 0 // 0 = Sunday
  }

  const calculateOTHours = (inTime, outTime) => {
    if (!inTime || !outTime) return 0

    const inDate = new Date(inTime)
    const outDate = new Date(outTime)
    
    // Calculate total worked hours
    const totalWorkedHours = (outDate - inDate) / (1000 * 60 * 60)
    
    // Calculate OT (anything beyond normal shift hours + 1 hour threshold)
    const otHours = Math.max(0, totalWorkedHours - NORMAL_SHIFT_HOURS - 1) // 1 hour buffer
    
    return Math.round(otHours * 100) / 100 // Round to 2 decimal places
  }

  const isLatePunch = (inTime) => {
    if (!inTime) return false
    
    const inDate = new Date(inTime)
    const hours = inDate.getHours()
    const minutes = inDate.getMinutes()
    
    // Check if punch in is after 9:05 AM
    return hours > 9 || (hours === 9 && minutes > 5)
  }

  // Check if employee has approved leave for a specific date
  const hasApprovedLeave = (employeeId, date) => {
    const approvedLeaves = leaveData.filter(leave => 
      leave.EmpId === employeeId && 
      leave.Status === "Approved" &&
      new Date(date) >= new Date(leave.StartDate) &&
      new Date(date) <= new Date(leave.EndDate)
    )

    if (approvedLeaves.length > 0) {
      return {
        hasLeave: true,
        category: approvedLeaves[0].Category // CL or SL
      }
    }
    
    return { hasLeave: false, category: null }
  }

  const getAttendanceStatus = (employeeId, date) => {
    const approvedLeave = hasApprovedLeave(employeeId, date)
    
    // Check if there's any attendance record for this day (including Sunday)
    const attendanceRecords = attendance.filter(
      (record) => 
        record.EmpId === employeeId && 
        record.InTime && 
        record.InTime.startsWith(date)
    )

    // RULE: If attendance found for Sunday, mark as Present (P)
    if (isSunday(date) && attendanceRecords.length > 0) {
      return "P"
    }
    
    // RULE: If it's Sunday with no attendance, mark as Week Off (WO)
    if (isSunday(date)) {
      return "WO"
    }

    // RULE: If employee has approved leave, mark according to leave category
    if (approvedLeave.hasLeave) {
      return approvedLeave.category // "CL" or "SL"
    }

    // If no records at all (no attendance, no leave), mark as Absent
    if (attendanceRecords.length === 0) return "A"

    const record = attendanceRecords[0]
    
    // RULE: If only In entry exists (no Out entry), mark as Present
    if (!record.OutTime) return "P"
    
    const inTime = new Date(record.InTime)
    const outTime = new Date(record.OutTime)
    const workDuration = (outTime - inTime) / (1000 * 60 * 60) // hours
    
    // RULE: If punched in after 9:05 AM, mark as Half Day (HD)
    if (isLatePunch(record.InTime)) {
      return "HD"
    }
    
    // Regular status determination based on work duration
    if (workDuration >= 8) {
      return "P" // Present
    } else if (workDuration >= 4) {
      return "HD" // Half day
    } else {
      return "A" // Absent for very short duration
    }
  }

  const getOTForDate = (employeeId, date) => {
    // No OT on Sundays (Week Off) unless there's attendance
    const attendanceRecords = attendance.filter(
      (record) => 
        record.EmpId === employeeId && 
        record.InTime && 
        record.InTime.startsWith(date)
    )

    if (attendanceRecords.length === 0) return 0

    const record = attendanceRecords[0]
    
    // No OT calculation if no OutTime
    if (!record.OutTime) return 0

    // Allow OT calculation for Sundays with attendance
    return calculateOTHours(record.InTime, record.OutTime)
  }

  const calculateSummary = (employeeId, month, year) => {
    const daysInMonth = getDaysInMonth(month, year)
    let presentCount = 0
    let absentCount = 0
    let weeklyOffCount = 0
    let halfDayCount = 0
    let totalOTHours = 0
    let clCount = 0
    let slCount = 0
    let sundayWorkingCount = 0
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const status = getAttendanceStatus(employeeId, date)
      const otHours = getOTForDate(employeeId, date)
      
      if (status === "P") {
        presentCount++
        // Check if this is a Sunday working day
        if (isSunday(date)) {
          sundayWorkingCount++
        }
      }
      if (status === "A") absentCount++
      if (status === "WO") weeklyOffCount++
      if (status === "HD") halfDayCount++
      if (status === "CL") clCount++
      if (status === "SL") slCount++
      totalOTHours += otHours
    }

    return {
      presentCount,
      absentCount,
      weeklyOffCount,
      halfDayCount,
      totalOTHours,
      clCount,
      slCount,
      sundayWorkingCount,
      totalDays: presentCount + weeklyOffCount + halfDayCount + clCount + slCount,
    }
  }

  const exportAttendanceToExcelFormat = () => {
    if (!month) {
      alert("Please select a month")
      return
    }

    const selectedMonth = parseInt(month)
    const daysInMonth = getDaysInMonth(selectedMonth, year)
    const monthName = monthNames[selectedMonth - 1]

    // Create header row matching your Excel format
    const header = [
      "S.R NO.", 
      "UAN", 
      "ESI", 
      "Emp. Code", 
      "Name of Emp.", 
      "Father Name", 
      "Designation", 
      "CADRE", 
      "DOJ",
      "", // Empty column for "Status"
    ]

    // Add date columns for each day with INCE. header
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')} 00:00:00`
      header.push(date, "", "INCE.")
    }

    // Add summary columns (removed MONTHLY SALARY)
    const summaryColumns = [
      "P", "NT", "CL", "SL", "LWP", "GH", "PWO", "WO", "C-OFF", "ABSENT", "WI",
      "TOTAL DAYS", "SUN WORKING (DOUBLE)", 
      "WORKING DAY OT (EXTRA HOURS WORKING@1.25)",
      "WORKING DAY OT (EXTRA HOURS WORKING@1.25)",
      "(Inc1DM+Inc2 DN)@1.25", "TOTAL DAYS FOR EMP", "OT WAGES"
    ]

    header.push(...summaryColumns)

    const csvRows = [header]

    // Add employee rows
    employees.forEach((employee, index) => {
      const summary = calculateSummary(employee.EmpId, selectedMonth, year)
      
      const row = [
        index + 1, // S.R NO.
        employee.UAN || "", // UAN
        employee.ESI || "", // ESI
        employee.EmpId, // Emp. Code
        employee.Name, // Name of Emp.
        employee.FatherName || "", // Father Name
        employee.Designation || "", // Designation
        employee.Grade || "", // CADRE
        employee.JoinDate ? new Date(employee.JoinDate).toISOString().split('T')[0] + " 00:00:00" : "", // DOJ
        "Status" // Status column
      ]

      // Add daily attendance status and INCE. values
      for (let day = 1; day <= daysInMonth; day++) {
        const date = `${year}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const status = getAttendanceStatus(employee.EmpId, date)
        const otHours = getOTForDate(employee.EmpId, date)
        
        // Add status twice as per Excel format
        row.push(status, status)
        
        // Add INCE. value - blank if no OT, otherwise OT hours
        row.push(otHours > 0 ? otHours : "")
      }

      // Calculate OT wages (simplified calculation)
      const otWages = summary.totalOTHours > 0 ? Math.round(summary.totalOTHours * 100 * 1.25) : 0

      // Add summary calculations
      row.push(
        summary.presentCount, // P
        0, // NT
        summary.clCount, // CL
        summary.slCount, // SL
        0, // LWP
        0, // GH
        0, // PWO
        summary.weeklyOffCount, // WO
        0, // C-OFF
        summary.absentCount, // ABSENT
        0, // WI
        summary.totalDays, // TOTAL DAYS
        summary.sundayWorkingCount, // SUN WORKING (DOUBLE)
        summary.totalOTHours, // WORKING DAY OT HOURS
        summary.totalOTHours, // WORKING DAY OT HOURS (duplicate as in Excel)
        summary.totalOTHours * 1.25, // (Inc1DM+Inc2 DN)@1.25
        summary.totalDays, // TOTAL DAYS FOR EMP
        otWages // OT WAGES (removed monthly salary)
      )

      csvRows.push(row)
    })

    // Convert to CSV with proper formatting
    const csvContent = csvRows.map(row => 
      row.map(field => `"${field}"`).join(",")
    ).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    saveAs(blob, `ATTENDANCE_${monthName}_${year}.csv`)
  }

  const getCurrentStats = () => {
    if (!month) return { totalEmployees: employees.length, month: "", year: "" }

    // Calculate some stats from attendance data
    const uniqueEmployees = [...new Set(attendance.map(record => record.EmpId))].length
    const totalRecords = attendance.length
    const approvedLeaves = leaveData.filter(leave => leave.Status === "Approved").length

    return {
      totalEmployees: employees.length,
      activeEmployees: uniqueEmployees,
      totalRecords,
      approvedLeaves,
      month: new Date(year, parseInt(month) - 1).toLocaleString('default', { month: 'long' }),
      year: year
    }
  }

  const stats = getCurrentStats()

  return (
    <Card sx={{ boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h5" component="h2" sx={{ mb: 3, color: "primary.main", fontWeight: 600 }}>
          <Schedule sx={{ mr: 1, verticalAlign: "middle" }} />
          Monthly Attendance Report (Excel Format)
        </Typography>

        {/* Controls */}
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Month</InputLabel>
              <Select
                value={month}
                label="Month"
                onChange={(e) => setMonth(e.target.value)}
              >
                <MenuItem value="1">January</MenuItem>
                <MenuItem value="2">February</MenuItem>
                <MenuItem value="3">March</MenuItem>
                <MenuItem value="4">April</MenuItem>
                <MenuItem value="5">May</MenuItem>
                <MenuItem value="6">June</MenuItem>
                <MenuItem value="7">July</MenuItem>
                <MenuItem value="8">August</MenuItem>
                <MenuItem value="9">September</MenuItem>
                <MenuItem value="10">October</MenuItem>
                <MenuItem value="11">November</MenuItem>
                <MenuItem value="12">December</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              label="Year"
              type="number"
              variant="outlined"
              size="small"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Stack direction={isMobile ? "column" : "row"} spacing={2} justifyContent="flex-end">
              <Button
                variant="contained"
                onClick={exportAttendanceToExcelFormat}
                disabled={!month || loading}
                sx={{
                  bgcolor: "primary.main",
                  "&:hover": { bgcolor: "primary.dark" },
                }}
              >
                <GetApp />
              </Button>
            </Stack>
          </Grid>
        </Grid>

        {/* Stats */}
        {month && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              Report for {stats.month} {stats.year}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Total Employees</Typography>
                <Typography variant="h6">{stats.totalEmployees}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Active Employees</Typography>
                <Typography variant="h6">{stats.activeEmployees}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Approved Leaves</Typography>
                <Typography variant="h6">{stats.approvedLeaves}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Attendance Records</Typography>
                <Typography variant="h6">{stats.totalRecords}</Typography>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
            <CircularProgress size={40} sx={{ mr: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Loading attendance data...
            </Typography>
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

export default AttendanceReport