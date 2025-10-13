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
  CircularProgress,
  TableFooter,
  TablePagination,
  Button,
  IconButton,
  Card,
  CardContent,
  Chip,
  Stack,
  Alert,
  Container,
  useTheme,
  useMediaQuery,
  Tooltip,
} from "@mui/material"
import {
  Check,
  Cancel,
  GetApp,
  FlightTakeoff,
  Person,
  CalendarToday,
  LocationOn,
  DirectionsCar,
} from "@mui/icons-material"
import axios from "axios"
import { useAuth } from "../auth/AuthContext"

function ViewTravel({ EmpId }) {
  const [travelExpenses, setTravelExpenses] = useState([])
  const [employeeData, setEmployeeData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
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

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const response = await axios.get(
          "https://namami-infotech.com/SAFEGUARD/src/employee/list_employee.php",
          {
            params: { Tenent_Id: user.tenent_id },
          },
        )

        if (response.data.success) {
          const filteredEmployees = response.data.data.filter((emp) => emp.Tenent_Id === user.tenent_id)
          setEmployeeData(filteredEmployees)
        } else {
          setError(response.data.message)
        }
      } catch (error) {
        setError("Error fetching employee data")
        console.error("Error:", error)
      }
    }

    fetchEmployeeData()
  }, [user.tenent_id])

  useEffect(() => {
    const fetchTravelExpenses = async () => {
      try {
        if (!EmpId) {
          setError("Employee ID is missing")
          setLoading(false)
          return
        }

        const response = await axios.get("https://namami-infotech.com/SAFEGUARD/src/travel/get_travel.php", {
          params: { empId: user.emp_id, role: user.role },
        })

        if (response.data.success) {
          const updatedTravelExpenses = response.data.data.filter((expense) =>
            employeeData.some((emp) => emp.EmpId === expense.empId && emp.Tenent_Id === user.tenent_id),
          )

          const travelWithNames = updatedTravelExpenses.map((expense) => {
            const employee = employeeData.find((emp) => emp.EmpId === expense.empId)
            return {
              ...expense,
              employeeName: employee ? employee.Name : "Unknown",
            }
          })
          setTravelExpenses(travelWithNames)
        } else {
          setError(response.data.message)
        }
      } catch (error) {
        setError("Error fetching travel expenses data")
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    if (employeeData.length > 0) {
      fetchTravelExpenses()
    }
  }, [EmpId, user.emp_id, user.role, employeeData, user.tenent_id])

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleStatusChange = async (id, status) => {
    try {
      const response = await axios.post("https://namami-infotech.com/SAFEGUARD/src/travel/update_status.php", {
        id,
        status,
      })

      if (response.data.success) {
        setTravelExpenses(travelExpenses.map((expense) => (expense.id === id ? { ...expense, status } : expense)))
      } else {
        setError(response.data.message)
      }
    } catch (error) {
      setError("Error updating travel status")
      console.error("Error:", error)
    }
  }

  const exportToCsv = () => {
    const csvRows = [["Employee Name", "Date", "Destination", "From", "To", "Type", "Status"]]

    travelExpenses.forEach(({ employeeName, travelDate, travelDestination, travelFrom, travelTo, travelType, status }) => {
      csvRows.push([employeeName, formatDate(travelDate), travelDestination, travelFrom, travelTo, travelType, status])
    })

    const csvContent = csvRows.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.href = url
    link.setAttribute("download", "travel_requests.csv")
    link.click()
    URL.revokeObjectURL(url)
  }

  const getTravelStats = () => {
    const pending = travelExpenses.filter((expense) => expense.status === "Pending").length
    const approved = travelExpenses.filter((expense) => expense.status === "Approved").length
    const rejected = travelExpenses.filter((expense) => expense.status === "Rejected").length

    return { pending, approved, rejected, total: travelExpenses.length }
  }

  const stats = getTravelStats()

  if (loading) {
    return (
      <Card sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Loading travel requests...
        </Typography>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    )
  }

  return (
    <Card sx={{ boxShadow: 3 }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Stack
            direction={isMobile ? "column" : "row"}
            justifyContent="space-between"
            alignItems={isMobile ? "stretch" : "center"}
            spacing={2}
          >
            <Box>
              <Typography variant="h5" component="h2" sx={{ color: "primary.main", fontWeight: 600, mb: 1 }}>
                <FlightTakeoff sx={{ mr: 1, verticalAlign: "middle" }} />
                Travel Requests
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage and track all travel requests
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={exportToCsv}
              startIcon={<GetApp />}
              disabled={travelExpenses.length === 0}
              sx={{
                bgcolor: "primary.main",
                "&:hover": { bgcolor: "primary.dark" },
                minWidth: 150,
              }}
            >
              Export CSV
            </Button>
          </Stack>
        </Box>

        {/* Stats Cards */}
        {travelExpenses.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Stack direction={isMobile ? "column" : "row"} spacing={2}>
              <Card sx={{ flex: 1, bgcolor: "warning.50", border: "1px solid", borderColor: "warning.200" }}>
                <CardContent sx={{ textAlign: "center", py: 2 }}>
                  <Typography variant="h4" color="warning.main" fontWeight="bold">
                    {stats.pending}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1, bgcolor: "success.50", border: "1px solid", borderColor: "success.200" }}>
                <CardContent sx={{ textAlign: "center", py: 2 }}>
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {stats.approved}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approved
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1, bgcolor: "error.50", border: "1px solid", borderColor: "error.200" }}>
                <CardContent sx={{ textAlign: "center", py: 2 }}>
                  <Typography variant="h4" color="error.main" fontWeight="bold">
                    {stats.rejected}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rejected
                  </Typography>
                </CardContent>
              </Card>
            </Stack>
          </Box>
        )}

        {/* Table */}
        {travelExpenses.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No travel requests found.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "primary.main" }}>
                  <TableCell sx={{ color: "white", fontWeight: 600 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Person fontSize="small" />
                      Employee
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 600 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CalendarToday fontSize="small" />
                      Date
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 600 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LocationOn fontSize="small" />
                      Destination
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 600 }}>From</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 600 }}>To</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 600 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <DirectionsCar fontSize="small" />
                      Type
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 600 }}>Status</TableCell>
                  {user && user.role === "HR" && (
                    <TableCell sx={{ color: "white", fontWeight: 600 }}>Actions</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {travelExpenses.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((expense) => (
                  <TableRow
                    key={expense.id}
                    sx={{
                      "&:hover": { bgcolor: "action.hover" },
                      "&:nth-of-type(odd)": { bgcolor: "action.selected" },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {expense.employeeName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatDate(expense.travelDate)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {expense.travelDestination}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{expense.travelFrom}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{expense.travelTo}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={expense.travelType} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip label={expense.status} size="small" color={getStatusColor(expense.status)} />
                    </TableCell>
                    {user && user.role === "HR" && (
                      <TableCell>
                        {expense.status === "Pending" && (
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="Approve Request">
                              <IconButton
                                onClick={() => handleStatusChange(expense.id, "Approved")}
                                color="success"
                                size="small"
                                sx={{
                                  "&:hover": { bgcolor: "success.50" },
                                }}
                              >
                                <Check />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject Request">
                              <IconButton
                                onClick={() => handleStatusChange(expense.id, "Rejected")}
                                color="error"
                                size="small"
                                sx={{
                                  "&:hover": { bgcolor: "error.50" },
                                }}
                              >
                                <Cancel />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    count={travelExpenses.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    sx={{
                      "& .MuiTablePagination-toolbar": {
                        bgcolor: "grey.50",
                      },
                    }}
                  />
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  )
}

export default ViewTravel
