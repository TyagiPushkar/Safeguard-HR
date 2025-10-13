"use client"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  TableCell,
  TableRow,
  Table,
  TableHead,
  TableContainer,
  Paper,
  Container,
  TableBody,
  Divider,
  Card,
  CardContent,
  Grid,
  Stack,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from "@mui/material"
import {
  GetApp,
  Person,
  CalendarMonth,
  Receipt,
  Download,
} from "@mui/icons-material"
import { useAuth } from "../auth/AuthContext"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

function SalarySlip() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [salarySlip, setSalarySlip] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const salarySlipRef = useRef(null)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get(
          `https://namami-infotech.com/SAFEGUARD/src/employee/list_employee.php?Tenent_Id=${user.tenent_id}`,
        )
        if (response.data.success) setEmployees(response.data.data)
      } catch (error) {
        console.error("Error fetching employees:", error)
        setError("Failed to fetch employees")
      }
    }
    fetchEmployees()
  }, [user.tenent_id])

  useEffect(() => {
    if (selectedEmployee) {
      const fetchSalarySlip = async () => {
        setLoading(true)
        setError("")
        try {
          const response = await axios.get(
            `https://namami-infotech.com/SAFEGUARD/src/salary/salary_slip.php?month=${selectedMonth}&year=${selectedYear}&EmpId=${selectedEmployee}`,
          )
          setSalarySlip(response.data.data)
        } catch (error) {
          console.error("Error fetching salary slip:", error)
          setError("Failed to fetch salary slip")
          setSalarySlip(null)
        } finally {
          setLoading(false)
        }
      }
      fetchSalarySlip()
    } else {
      setSalarySlip(null)
    }
  }, [selectedEmployee, selectedMonth, selectedYear])

  const downloadPDF = () => {
    const input = salarySlipRef.current
    if (!input) return
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF()
      const imgWidth = 190
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight)
      pdf.save(`salary_slip_${selectedEmployee}_${selectedMonth}_${selectedYear}.pdf`)
    })
  }

  const handleEmployeeChange = (e) => {
    setSelectedEmployee(e.target.value)
    setSalarySlip(null)
  }

  const employeeDetails = salarySlip
    ? [
        ["Employee ID", salarySlip.EmpId, "PF No.", "-"],
        ["Employee Name", salarySlip.Name, "Bank", "Bank Name"],
        ["Designation", salarySlip.Designation, "Account No.", "xxxxxxxxxxxxx"],
        ["Location", "Delhi", "Date of Joining", "23-07-2024"],
      ]
    : []

  const salaryDetails = salarySlip
    ? [
        ["Gross Wages", `₹${salarySlip.BasicSalary}`, "Total Deductions", "₹0"],
        ["Total Working Days", salarySlip.TotalDaysInMonth, "Net Salary", `₹${salarySlip.Salary}`],
        ["Leaves", salarySlip.LeaveDays, "Paid Days", salarySlip.PresentDays],
        ["Week Offs", salarySlip.WeekOffs, "Present Days", salarySlip.PresentDays],
      ]
    : []

  const earnings = salarySlip
    ? [
        ["Basic", salarySlip.BasicSalary],
        ["HRA", "0"],
        ["Conveyance Allowance", "0"],
        ["Medical Allowance", "0"],
        ["Other Allowances", "0"],
      ]
    : []

  const deductions = [
    ["EPF", "0"],
    ["ESI", "0"],
    ["Professional Tax", "0"],
  ]

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 600,
            color: "primary.main",
            mb: 1,
          }}
        >
          <Receipt sx={{ mr: 2, verticalAlign: "middle" }} />
          Salary Slip Generator
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Generate and download employee salary slips
        </Typography>
      </Box>

      {/* Controls Section */}
      <Card sx={{ mb: 4, boxShadow: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Employee</InputLabel>
                <Select
                  value={selectedEmployee}
                  onChange={handleEmployeeChange}
                  label="Employee"
                  startAdornment={<Person sx={{ mr: 1, color: "action.active" }} />}
                >
                  {employees.map((emp) => (
                    <MenuItem key={emp.EmpId} value={emp.EmpId}>
                      {emp.Name} ({emp.EmpId})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Month</InputLabel>
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  label="Month"
                  startAdornment={<CalendarMonth sx={{ mr: 1, color: "action.active" }} />}
                >
                  {months.map((month, index) => (
                    <MenuItem key={index + 1} value={index + 1}>
                      {month}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Year</InputLabel>
                <Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} label="Year">
                  {[2024, 2025, 2026].map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                fullWidth
                onClick={downloadPDF}
                startIcon={<Download />}
                disabled={!salarySlip || loading}
                sx={{
                  height: 40,
                  bgcolor: "primary.main",
                  "&:hover": { bgcolor: "primary.dark" },
                }}
              >
                Download PDF
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card sx={{ p: 4, textAlign: "center" }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Generating salary slip...
          </Typography>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* No Selection State */}
      {!selectedEmployee && !loading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Please select an employee to generate salary slip
        </Alert>
      )}

      {/* Salary Slip */}
      {salarySlip && !loading && (
        <Card elevation={4} sx={{ maxWidth: 800, mx: "auto" }}>
          <Box ref={salarySlipRef} sx={{ p: 4, bgcolor: "white" }}>
            {/* Company Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
              <Box sx={{ width: 80, height: 80, bgcolor: "grey.200", borderRadius: 1 }}>
                {/* Logo placeholder */}
              </Box>
              <Box sx={{ textAlign: "right", flex: 1, ml: 2 }}>
                <Typography variant="h5" fontWeight="bold" color="primary.main">
                  Namami Infotech India Pvt. Ltd.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  DPT-303, DLF Prime Towers, Okhla Phase 1, New Delhi - 110020
                </Typography>
                <Typography variant="h6" sx={{ mt: 2, color: "primary.main" }}>
                  Pay Slip for {months[selectedMonth - 1]} {selectedYear}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Employee Details */}
            <TableContainer component={Paper} elevation={0} sx={{ mb: 3, border: "1px solid", borderColor: "grey.300" }}>
              <Table size="small">
                <TableBody>
                  {employeeDetails.map((row, index) => (
                    <TableRow key={index} sx={{ "&:nth-of-type(odd)": { bgcolor: "grey.50" } }}>
                      {row.map((cell, idx) => (
                        <TableCell key={idx} sx={{ fontWeight: idx % 2 === 0 ? 600 : 400, py: 1 }}>
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Salary Summary */}
            <TableContainer component={Paper} elevation={0} sx={{ mb: 3, border: "1px solid", borderColor: "grey.300" }}>
              <Table size="small">
                <TableBody>
                  {salaryDetails.map((row, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        bgcolor: index === 0 ? "primary.50" : index % 2 === 0 ? "grey.50" : "white",
                      }}
                    >
                      {row.map((cell, idx) => (
                        <TableCell
                          key={idx}
                          sx={{
                            fontWeight: idx % 2 !== 0 ? 600 : 400,
                            py: 1,
                            color: idx % 2 !== 0 && typeof cell === "string" && cell.includes("₹") ? "success.main" : "inherit",
                          }}
                        >
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Earnings and Deductions */}
            <TableContainer component={Paper} elevation={0} sx={{ mb: 3, border: "1px solid", borderColor: "grey.300" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "primary.main" }}>
                    <TableCell sx={{ color: "white", fontWeight: 600 }}>Earnings</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 600 }}>Amount (₹)</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 600 }}>Deductions</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 600 }}>Amount (₹)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {earnings.map((earn, index) => (
                    <TableRow key={index} sx={{ "&:nth-of-type(odd)": { bgcolor: "grey.50" } }}>
                      <TableCell sx={{ py: 1 }}>{earn[0]}</TableCell>
                      <TableCell sx={{ py: 1, fontWeight: 500 }}>{earn[1]}</TableCell>
                      <TableCell sx={{ py: 1 }}>{deductions[index]?.[0] || ""}</TableCell>
                      <TableCell sx={{ py: 1, fontWeight: 500 }}>{deductions[index]?.[1] || ""}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Net Salary */}
            <Box sx={{ textAlign: "right", p: 2, bgcolor: "success.50", borderRadius: 1 }}>
              <Typography variant="h5" fontWeight="bold" color="success.main">
                Net Salary: ₹{salarySlip.Salary}
              </Typography>
            </Box>

            {/* Footer */}
            <Box sx={{ mt: 4, pt: 2, borderTop: "1px solid", borderColor: "grey.300" }}>
              <Typography variant="caption" color="text.secondary">
                This is a computer-generated salary slip and does not require a signature.
              </Typography>
            </Box>
          </Box>
        </Card>
      )}
    </Container>
  )
}

export default SalarySlip
