"use client"

import { useEffect, useState } from "react"
import {
  CircularProgress,
  Typography,
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Alert,
  Chip,
  Stack,
  useTheme,
  useMediaQuery,
  Fade,
} from "@mui/material"
import {
  GetApp,
  DateRange,
  Assessment,
  TrendingUp,
  FileDownload,
} from "@mui/icons-material"
import axios from "axios"
import { saveAs } from "file-saver"
import AttendanceReport from "./AttendanceReport"
import SalaryList from "../employee/SalaryList"
import SalarySlip from "../employee/SalarySlip"

const VisitList = () => {
  const [employees, setEmployees] = useState([])
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get(
          "https://namami-infotech.com/SAFEGUARD/src/employee/list_employee.php?Tenent_Id=1",
        )
        if (response.data.success) {
          setEmployees(response.data.data)
        }
      } catch (error) {
        console.error("Error fetching employees:", error)
      }
    }

    fetchEmployees()
  }, [])

  useEffect(() => {
    const fetchVisits = async () => {
      if (!fromDate || !toDate) return

      setLoading(true)
      setError("")
      try {
        const response = await axios.get(
          `https://namami-infotech.com/SAFEGUARD/src/visit/get_visits_entry.php?role=HR`,
        )
        if (response.data.success) {
          const filteredVisits = response.data.data.filter((visit) => {
            const visitDate = new Date(visit.VisitDateTime)
            return visitDate >= new Date(fromDate) && visitDate <= new Date(toDate)
          })
          setVisits(filteredVisits)
        } else {
          setVisits([])
          setError("No visits found.")
        }
      } catch (error) {
        setError("Error fetching visit history.")
        setVisits([])
      } finally {
        setLoading(false)
      }
    }

    fetchVisits()
  }, [fromDate, toDate])

  const handleDateChange = (event, type) => {
    type === "from" ? setFromDate(event.target.value) : setToDate(event.target.value)
  }

  const exportSummaryToCSV = () => {
    const summaryData = employees.map((employee) => {
      const dealerVisits = visits.filter(
        (visit) => visit.EmpId === employee.EmpId && visit.SourceEvent !== "In" && visit.SourceEvent !== "Out",
      )
      const totalDistance = dealerVisits
        .reduce((total, visit) => total + parseFloat(visit.Distance || 0), 0)
        .toFixed(2)

      return {
        Employee: employee.Name,
        DateRange: `${new Date(fromDate).toLocaleDateString()} - ${new Date(toDate).toLocaleDateString()}`,
        TotalVisits: dealerVisits.length,
        TotalDistance: `${totalDistance} km`,
      }
    })

    const csvContent = [
      ["Employee", "Date Range", "Total Visits", "Total Distance (km)"],
      ...summaryData.map((row) => Object.values(row)),
    ]
      .map((e) => e.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    saveAs(blob, "summary_report.csv")
  }

  const exportDetailToCSV = () => {
    const csvData = visits
      .filter((visit) => visit.SourceEvent !== "In" && visit.SourceEvent !== "Out")
      .map((visit) => ({
        Employee: employees.find((emp) => emp.EmpId === visit.EmpId)?.Name || "N/A",
        Event: visit.SourceEvent,
        DateTime: `"${new Date(visit.SourceTime).toLocaleString()}"`,
        Distance: `${visit.Distance} km`,
      }))

    const csvContent = [
      ["Employee", "Event", "DateTime", "Distance (km)"],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((e) => e.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    saveAs(blob, "detailed_report.csv")
  }

  const getVisitStats = () => {
    const dealerVisits = visits.filter((visit) => visit.SourceEvent !== "In" && visit.SourceEvent !== "Out")
    const totalDistance = dealerVisits.reduce((total, visit) => total + parseFloat(visit.Distance || 0), 0)
    const uniqueEmployees = new Set(dealerVisits.map((visit) => visit.EmpId)).size

    return {
      totalVisits: dealerVisits.length,
      totalDistance: totalDistance.toFixed(2),
      uniqueEmployees,
    }
  }

  const stats = getVisitStats()

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
          <Assessment sx={{ mr: 2, verticalAlign: "middle" }} />
          Reports Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Comprehensive reporting system for visits, attendance, and salary management
        </Typography>
      </Box>

      {/* Visit Report Section */}
      <Card sx={{ mb: 4, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" component="h2" sx={{ mb: 3, color: "primary.main", fontWeight: 600 }}>
            <TrendingUp sx={{ mr: 1, verticalAlign: "middle" }} />
            Visit Report
          </Typography>

          {/* Date Range Controls */}
          <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <TextField
                label="From Date"
                type="date"
                variant="outlined"
                size="small"
                value={fromDate}
                onChange={(e) => handleDateChange(e, "from")}
                fullWidth
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <DateRange sx={{ mr: 1, color: "action.active" }} />,
                }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                label="To Date"
                type="date"
                variant="outlined"
                size="small"
                value={toDate}
                onChange={(e) => handleDateChange(e, "to")}
                fullWidth
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <DateRange sx={{ mr: 1, color: "action.active" }} />,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Stack direction={isMobile ? "column" : "row"} spacing={2}>
                <Button
                  variant="contained"
                  onClick={exportSummaryToCSV}
                  startIcon={<FileDownload />}
                  disabled={!fromDate || !toDate || loading}
                  sx={{
                    bgcolor: "primary.main",
                    "&:hover": { bgcolor: "primary.dark" },
                  }}
                >
                  Summary Report
                </Button>
                <Button
                  variant="outlined"
                  onClick={exportDetailToCSV}
                  startIcon={<GetApp />}
                  disabled={!fromDate || !toDate || loading}
                  sx={{
                    borderColor: "primary.main",
                    color: "primary.main",
                    "&:hover": {
                      borderColor: "primary.dark",
                      bgcolor: "primary.50",
                    },
                  }}
                >
                  Detailed Report
                </Button>
              </Stack>
            </Grid>
          </Grid>

          {/* Stats Cards */}
          {fromDate && toDate && !loading && (
            <Fade in={true}>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <Card sx={{ bgcolor: "primary.50", border: "1px solid", borderColor: "primary.200" }}>
                    <CardContent sx={{ textAlign: "center", py: 2 }}>
                      <Typography variant="h4" color="primary.main" fontWeight="bold">
                        {stats.totalVisits}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Visits
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ bgcolor: "success.50", border: "1px solid", borderColor: "success.200" }}>
                    <CardContent sx={{ textAlign: "center", py: 2 }}>
                      <Typography variant="h4" color="success.main" fontWeight="bold">
                        {stats.totalDistance}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Distance (km)
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ bgcolor: "info.50", border: "1px solid", borderColor: "info.200" }}>
                    <CardContent sx={{ textAlign: "center", py: 2 }}>
                      <Typography variant="h4" color="info.main" fontWeight="bold">
                        {stats.uniqueEmployees}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Active Employees
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Fade>
          )}

          {/* Loading and Error States */}
          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
              <CircularProgress size={40} sx={{ mr: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Loading visit data...
              </Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Other Report Components */}
      <Stack spacing={4}>
        <AttendanceReport />
        <SalaryList />
        <SalarySlip />
      </Stack>
    </Container>
  )
}

export default VisitList
