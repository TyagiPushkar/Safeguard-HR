"use client"

import { useEffect, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Box,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Autocomplete,
  Card,
  CardContent,
  Chip,
  Stack,
  Container,
  Grid,
  Fade,
  Tooltip,
  Alert,
  useTheme,
  useMediaQuery,
} from "@mui/material"
import {
  Visibility,
  RotateLeft,
  RotateRight,
  CalendarToday,
  Person,
  Business,
  Phone,
  Schedule,
  LocationOn,
  Add,
  Search,
} from "@mui/icons-material"
import axios from "axios"
import { useAuth } from "../auth/AuthContext"
import { useNavigate } from "react-router-dom"

function VisitTable() {
  const [visits, setVisits] = useState([])
  const { user } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lng: 78.9629 })
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [markers, setMarkers] = useState([])
  const [directions, setDirections] = useState(null)
  const [distances, setDistances] = useState([])
  const [employees, setEmployees] = useState([])
  const [selectedEmpId, setSelectedEmpId] = useState(user.role === "HR" ? "" : user.emp_id)
  const [showMap, setShowMap] = useState(false)
  const [loading, setLoading] = useState(false)
  const [address, setAddress] = useState("")
  const [noData, setNoData] = useState(false)

  // Popup states for image
  const [openDialog, setOpenDialog] = useState(false)
  const [imageData, setImageData] = useState("")
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    if (user.role === "HR") {
      const fetchEmployees = async () => {
        try {
          const response = await axios.get(
            `https://namami-infotech.com/SAFEGUARD/src/employee/list_employee.php?Tenent_Id=${user.tenent_id}`,
          )

          if (response.data.success) {
            setEmployees(response.data.data)
          } else {
            console.log("Failed to fetch employee list")
          }
        } catch (error) {
          console.log("Error fetching employee list:", error.message)
        }
      }
      fetchEmployees()
    }
  }, [user.role])

  useEffect(() => {
    if (markers.length > 0) {
      const avgLat = markers.reduce((sum, marker) => sum + marker.lat, 0) / markers.length
      const avgLng = markers.reduce((sum, marker) => sum + marker.lng, 0) / markers.length
      setMapCenter({ lat: avgLat, lng: avgLng })
    }
  }, [markers])

  const fetchVisits = async () => {
    setLoading(true)
    setNoData(false)
    try {
      const formattedDate = selectedDate.toISOString().substr(0, 10)
      const url = `https://namami-infotech.com/SAFEGUARD/src/visit/view_visit.php?empId=${selectedEmpId}&date=${formattedDate}`

      const response = await axios.get(url)
      if (response.data.success && response.data.data.length > 0) {
        const visitData = response.data.data
        console.log("Visit Data:", visitData)

        const markerData = visitData.map((visit, index) => {
          const [lat, lng] = visit.VisitLatLong.split(",").map(Number)
          return {
            lat,
            lng,
            label: `${index + 1}`,
            companyName: visit.CompanyName,
            dealerName: visit.DealerName,
            visitTime: new Date(visit.VisitTime).toLocaleString(),
            mobileNo: visit.MobileNo,
          }
        })

        setVisits(visitData)
        setMarkers(markerData)
      } else {
        setVisits([])
        setNoData(true)
      }
    } catch (err) {
      console.error("Error fetching visits:", err)
      setNoData(true)
    }
    setLoading(false)
  }

  const handleDateChange = (event) => {
    setSelectedDate(new Date(event.target.value))
  }

  const planVisit = (event) => {
    navigate("/plan-visit")
  }

  const handleViewImage = async (visitId) => {
    try {
      const response = await axios.get(
        `https://namami-infotech.com/SAFEGUARD/src/visit/view_one_visit.php?visit_id=${visitId}`,
      )
      const base64Data = response.data.data[0].Attachment
      setImageData(`data:image/jpeg;base64,${base64Data}`)
      setRotation(0)
      setOpenDialog(true)

      const address = await fetchAddressFromLatLong(response.data.data[0].VisitLatLong)
      setAddress(address)
    } catch (error) {
      console.error("Error fetching image:", error)
    }
  }

  const handleRotateLeft = () => {
    setRotation((prevRotation) => prevRotation - 90)
  }

  const handleRotateRight = () => {
    setRotation((prevRotation) => prevRotation + 90)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
  }

  const fetchAddressFromLatLong = async (latLong) => {
    const [lat, lng] = latLong.split(",").map(Number)
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`

    try {
      const response = await axios.get(nominatimUrl)
      if (response.data && response.data.display_name) {
        return response.data.display_name
      } else {
        return "Address not found"
      }
    } catch (error) {
      console.error("Error fetching address from Nominatim:", error)
      return "Address not found"
    }
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
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
          Visit Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track and manage employee visits efficiently
        </Typography>
      </Box>

      {/* Controls Section */}
      <Card sx={{ mb: 3, boxShadow: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={user.role === "HR" ? 4 : 6}>
              {user.role === "HR" && (
                <Autocomplete
                  options={employees}
                  getOptionLabel={(option) => `${option.Name} (${option.EmpId})`}
                  value={employees.find((emp) => emp.EmpId === selectedEmpId) || null}
                  onChange={(event, newValue) => {
                    setSelectedEmpId(newValue ? newValue.EmpId : "")
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Employee"
                      variant="outlined"
                      fullWidth
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: <Person sx={{ mr: 1, color: "action.active" }} />,
                      }}
                    />
                  )}
                />
              )}
            </Grid>

            <Grid item xs={12} md={user.role === "HR" ? 3 : 4}>
              <TextField
                type="date"
                value={selectedDate.toISOString().substr(0, 10)}
                onChange={handleDateChange}
                variant="outlined"
                fullWidth
                label="Select Date"
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <CalendarToday sx={{ mr: 1, color: "action.active" }} />,
                }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <Button
                variant="contained"
                fullWidth
                onClick={fetchVisits}
                startIcon={<Search />}
                sx={{
                  height: 56,
                  bgcolor: "primary.main",
                  "&:hover": { bgcolor: "primary.dark" },
                }}
              >
                Search
              </Button>
            </Grid>

            <Grid item xs={12} md={user.role === "HR" ? 3 : 2}>
              <Button
                variant="outlined"
                fullWidth
                onClick={planVisit}
                startIcon={<Add />}
                sx={{
                  height: 56,
                  borderColor: "primary.main",
                  color: "primary.main",
                  "&:hover": {
                    borderColor: "primary.dark",
                    bgcolor: "primary.50",
                  },
                }}
              >
                Plan Visits
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Content Section */}
      {loading ? (
        <Card sx={{ p: 4, textAlign: "center" }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Loading visits...
          </Typography>
        </Card>
      ) : noData ? (
        <Card sx={{ p: 4, textAlign: "center" }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            No visits found for the selected date.
          </Alert>
          <Typography variant="body1" color="text.secondary">
            Try selecting a different date or employee.
          </Typography>
        </Card>
      ) : (
        <Fade in={!loading}>
          <Card sx={{ boxShadow: 3 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "primary.main" }}>
                    <TableCell sx={{ color: "white", fontWeight: 600 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Business fontSize="small" />
                        Company
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 600 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Person fontSize="small" />
                        Dealer
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 600 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Schedule fontSize="small" />
                        Time
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 600 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Phone fontSize="small" />
                        Mobile
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 600 }}>Visit By</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 600 }}>Attachment</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visits
                    .filter((visit) => {
                      const visitDate = new Date(visit.VisitTime).toLocaleDateString()
                      return visitDate === selectedDate.toLocaleDateString()
                    })
                    .sort((a, b) => new Date(b.VisitTime) - new Date(a.VisitTime))
                    .map((visit, index) => (
                      <TableRow
                        key={`${visit.DealerID}-${index}`}
                        sx={{
                          "&:hover": { bgcolor: "action.hover" },
                          "&:nth-of-type(odd)": { bgcolor: "action.selected" },
                        }}
                      >
                        <TableCell>
                          <Tooltip title="View on Google Maps">
                            <Box
                              component="a"
                              href={`https://www.google.com/maps?q=${visit.VisitLatLong}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{
                                color: "primary.main",
                                textDecoration: "none",
                                fontWeight: 500,
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                "&:hover": { textDecoration: "underline" },
                              }}
                            >
                              <LocationOn fontSize="small" />
                              {visit.CompanyName}
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {visit.DealerName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Chip label={formatTime(visit.VisitTime)} size="small" color="#8d0638ff" variant="outlined" />
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(visit.VisitTime)}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{visit.MobileNo}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={visit.EmpId} size="small" color="secondary" />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Attachment">
                            <IconButton
                              onClick={() => handleViewImage(visit.VisitID)}
                              color="#8d0638ff"
                              sx={{
                                "&:hover": { bgcolor: "primary.50" },
                              }}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Fade>
      )}

      {/* Enhanced Image Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "primary.main",
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Visibility />
          Visit Attachment
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {address && (
            <Card sx={{ mb: 2, bgcolor: "grey.50" }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="subtitle2" color="#8d0638ff" gutterBottom>
                  <LocationOn fontSize="small" sx={{ mr: 1, verticalAlign: "middle" }} />
                  Location Details
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {address}
                </Typography>
              </CardContent>
            </Card>
          )}

          <Box sx={{ textAlign: "center", mt: 2 }}>
            {imageData ? (
              <Box
                component="img"
                src={imageData}
                alt="Visit Attachment"
                sx={{
                  maxWidth: "100%",
                  maxHeight: "60vh",
                  transform: `rotate(${rotation}deg)`,
                  transition: "transform 0.3s ease",
                  borderRadius: 1,
                  boxShadow: 2,
                }}
              />
            ) : (
              <Alert severity="warning">No attachment available for this visit.</Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleRotateLeft} startIcon={<RotateLeft />} variant="outlined">
            Rotate Left
          </Button>
          <Button onClick={handleRotateRight} startIcon={<RotateRight />} variant="outlined">
            Rotate Right
          </Button>
          <Button onClick={handleCloseDialog} variant="contained" color="#8d0638ff">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default VisitTable
