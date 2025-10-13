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
  TableFooter,
  TablePagination,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Alert,
  Container,
  useTheme,
  useMediaQuery,
} from "@mui/material"
import {
  Business,
  Person,
  LocationOn,
  Phone,
  Email,
  GetApp,
  Store,
} from "@mui/icons-material"
import axios from "axios"
import { useAuth } from "../auth/AuthContext"

function DealerList() {
  const { user } = useAuth()
  const [dealers, setDealers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user || !user.emp_id || !user.tenent_id) {
          setError("User is not authenticated")
          setLoading(false)
          return
        }

        const employeeResponse = await axios.get(
          `https://namami-infotech.com/SAFEGUARD/src/employee/list_employee.php`,
          { params: { Tenent_Id: user.tenent_id } },
        )

        if (!employeeResponse.data.success) {
          setError("Error fetching employee data")
          setLoading(false)
          return
        }

        const employeeEmpIds = new Set(employeeResponse.data.data.map((emp) => emp.EmpId))

        const dealerResponse = await axios.get(
          "https://namami-infotech.com/SAFEGUARD/src/dealer/get_dealers.php",
          { params: { empId: user.emp_id, role: user.role } },
        )

        if (!dealerResponse.data.success) {
          setError(dealerResponse.data.message)
          setLoading(false)
          return
        }

        setDealers(dealerResponse.data.data.reverse())
      } catch (error) {
        setError("Error fetching data")
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const exportToCsv = () => {
    const csvRows = [
      [
        "Dealer ID",
        "Dealer Name",
        "Company Name",
        "Address",
        "Contact Info",
        "Email",
        "Remarks",
        "Added By",
      ],
    ]

    dealers.forEach(({ DealerID, DealerName, Address, ContactInfo, CompanyName, MailId, Remarks, AddedByName }) => {
      csvRows.push([
        `"${DealerID}"`,
        `"${DealerName}"`,
        `"${CompanyName}"`,
        `"${Address}"`,
        `"${ContactInfo}"`,
        `"${MailId}"`,
        `"${Remarks}"`,
        `"${AddedByName}"`,
      ])
    })

    const csvContent = csvRows.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.href = url
    link.setAttribute("download", "dealers.csv")
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
          <CircularProgress size={60} sx={{ mr: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Loading dealer data...
          </Typography>
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Container>
    )
  }

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
          <Store sx={{ mr: 2, verticalAlign: "middle" }} />
          Dealer Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage and track all dealer information
        </Typography>
      </Box>

      {/* Stats and Export Section */}
      <Card sx={{ mb: 3, boxShadow: 2 }}>
        <CardContent>
          <Stack
            direction={isMobile ? "column" : "row"}
            justifyContent="space-between"
            alignItems={isMobile ? "stretch" : "center"}
            spacing={2}
          >
            <Box>
              <Typography variant="h6" color="primary.main" fontWeight={600}>
                Total Dealers: {dealers.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active dealer records in the system
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={exportToCsv}
              startIcon={<GetApp />}
              sx={{
                bgcolor: "primary.main",
                "&:hover": { bgcolor: "primary.dark" },
                minWidth: 150,
              }}
            >
              Export CSV
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Dealers Table */}
      <Card sx={{ boxShadow: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "primary.main" }}>
                <TableCell sx={{ color: "white", fontWeight: 600 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Business fontSize="small" />
                    Dealer ID
                  </Box>
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: 600 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Store fontSize="small" />
                    Company
                  </Box>
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: 600 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Person fontSize="small" />
                    Contact Person
                  </Box>
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: 600 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LocationOn fontSize="small" />
                    Address
                  </Box>
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: 600 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Phone fontSize="small" />
                    Contact
                  </Box>
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: 600 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Email fontSize="small" />
                    Email
                  </Box>
                </TableCell>
                <TableCell sx={{ color: "white", fontWeight: 600 }}>Remarks</TableCell>
                <TableCell sx={{ color: "white", fontWeight: 600 }}>Added By</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dealers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((dealer, index) => (
                <TableRow
                  key={dealer.DealerID}
                  sx={{
                    "&:hover": { bgcolor: "action.hover" },
                    "&:nth-of-type(odd)": { bgcolor: "action.selected" },
                  }}
                >
                  <TableCell>
                    <Chip label={dealer.DealerID} size="small" color="#8d0638ff" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {dealer.CompanyName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{dealer.DealerName}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {dealer.Address}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{dealer.ContactInfo}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {dealer.MailId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {dealer.Remarks}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={dealer.AddedByName} size="small" color="secondary" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  count={dealers.length}
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
      </Card>
    </Container>
  )
}

export default DealerList
