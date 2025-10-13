"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TablePagination,
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  useTheme,
  useMediaQuery,
} from "@mui/material"
import { PictureAsPdf, Done, Close, Add, Policy, Visibility } from "@mui/icons-material"
import axios from "axios"
import AddPolicyDialog from "./AddPolicy"
import { useAuth } from "../auth/AuthContext"

function PolicyList() {
  const { user } = useAuth()
  const [policies, setPolicies] = useState([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  const fetchPolicies = async () => {
    setLoading(true)
    try {
      const response = await axios.get(
        `https://namami-infotech.com/SAFEGUARD/src/policy/view_policy.php?Tenent_Id=${user.tenent_id}`,
      )
      if (response.data.success) {
        setPolicies(response.data.data)
      } else {
        setError("Failed to fetch policies")
      }
    } catch (err) {
      setError("Error fetching policies")
      console.error("Error fetching policies:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePolicyStatus = async (policyId, action) => {
    try {
      const response = await axios.post("https://namami-infotech.com/SAFEGUARD/src/policy/disable_policy.php", {
        PolicyId: policyId,
        action,
      })
      if (response.data.success) {
        fetchPolicies()
      } else {
        setError(`Failed to ${action} policy`)
      }
    } catch (err) {
      setError(`Error ${action}ing policy`)
      console.error(`Error ${action}ing policy:`, err)
    }
  }

  const handleOpenDialog = () => setDialogOpen(true)
  const handleCloseDialog = () => setDialogOpen(false)
  const handlePolicyAdded = () => fetchPolicies()

  useEffect(() => {
    fetchPolicies()
  }, [user.tenent_id])

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleViewPDF = (pdfBase64) => {
    try {
      const byteCharacters = atob(pdfBase64)
      const byteArrays = []

      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512)
        const byteNumbers = new Array(slice.length)
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        byteArrays.push(byteArray)
      }

      const blob = new Blob(byteArrays, { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank")
    } catch (error) {
      console.error("Error opening PDF:", error)
      setError("Error opening PDF file")
    }
  }

  const filteredPolicies = policies.filter((policy) => {
    if (user && user.role === "HR") return true
    return policy.IsActive === 1
  })

  const getPolicyStats = () => {
    const active = policies.filter((policy) => policy.IsActive === 1).length
    const inactive = policies.filter((policy) => policy.IsActive === 0).length
    return { active, inactive, total: policies.length }
  }

  const stats = getPolicyStats()

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
                <Policy sx={{ mr: 1, verticalAlign: "middle" }} />
                Company Policies
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage and view company policies and documents
              </Typography>
            </Box>
            {user && user.role === "HR" && (
              <Button
                variant="contained"
                onClick={handleOpenDialog}
                startIcon={<Add />}
                sx={{
                  bgcolor: "primary.main",
                  "&:hover": { bgcolor: "primary.dark" },
                  minWidth: 150,
                }}
              >
                Add Policy
              </Button>
            )}
          </Stack>
        </Box>

        {/* Stats Cards for HR */}
        {user && user.role === "HR" && policies.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Stack direction={isMobile ? "column" : "row"} spacing={2}>
              <Card sx={{ flex: 1, bgcolor: "primary.50", border: "1px solid", borderColor: "primary.200" }}>
                <CardContent sx={{ textAlign: "center", py: 2 }}>
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Policies
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1, bgcolor: "success.50", border: "1px solid", borderColor: "success.200" }}>
                <CardContent sx={{ textAlign: "center", py: 2 }}>
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {stats.active}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1, bgcolor: "error.50", border: "1px solid", borderColor: "error.200" }}>
                <CardContent sx={{ textAlign: "center", py: 2 }}>
                  <Typography variant="h4" color="error.main" fontWeight="bold">
                    {stats.inactive}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Inactive
                  </Typography>
                </CardContent>
              </Card>
            </Stack>
          </Box>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {/* Table */}
        {filteredPolicies.length === 0 && !loading ? (
          <Alert severity="info">No policies available.</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "primary.main" }}>
                  <TableCell sx={{ color: "white", fontWeight: 600 }}>Policy Name</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 600 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Visibility fontSize="small" />
                      View
                    </Box>
                  </TableCell>
                  {user && user.role === "HR" && (
                    <TableCell sx={{ color: "white", fontWeight: 600 }}>Actions</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPolicies.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((policy) => (
                  <TableRow
                    key={policy.PolicyId}
                    sx={{
                      "&:hover": { bgcolor: "action.hover" },
                      "&:nth-of-type(odd)": { bgcolor: "action.selected" },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {policy.PolicyName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 300,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {policy.PolicyDescription}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={policy.IsActive ? "Active" : "Inactive"}
                        size="small"
                        color={policy.IsActive ? "success" : "error"}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View PDF">
                        <IconButton
                          onClick={() => handleViewPDF(policy.PolicyPDF)}
                          color="#8d0638ff"
                          sx={{
                            "&:hover": { bgcolor: "primary.50" },
                          }}
                        >
                          <PictureAsPdf />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    {user && user.role === "HR" && (
                      <TableCell>
                        {policy.IsActive ? (
                          <Tooltip title="Deactivate Policy">
                            <IconButton
                              onClick={() => handleTogglePolicyStatus(policy.Id, "disable")}
                              color="error"
                              sx={{
                                "&:hover": { bgcolor: "error.50" },
                              }}
                            >
                              <Close />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Activate Policy">
                            <IconButton
                              onClick={() => handleTogglePolicyStatus(policy.Id, "enable")}
                              color="success"
                              sx={{
                                "&:hover": { bgcolor: "success.50" },
                              }}
                            >
                              <Done />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination */}
        {filteredPolicies.length > 0 && (
          <TablePagination
            component="div"
            count={filteredPolicies.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
            sx={{
              "& .MuiTablePagination-toolbar": {
                bgcolor: "grey.50",
              },
            }}
          />
        )}

        {/* Add Policy Dialog */}
        <AddPolicyDialog open={dialogOpen} onClose={handleCloseDialog} onPolicyAdded={handlePolicyAdded} />
      </CardContent>
    </Card>
  )
}

export default PolicyList
