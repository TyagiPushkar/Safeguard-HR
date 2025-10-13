"use client"

import React, { useEffect, useState } from "react"
import {
  TextField,
  Button,
  FormControl,
  Autocomplete,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Chip,
  Avatar,
  Divider,
  Paper,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Alert,
  CircularProgress,
  ListItemAvatar,
  Stack,
} from "@mui/material"
import {
  LocationOn,
  AccessTime,
  DirectionsCar,
  Business,
  Person,
  CalendarToday,
  Timeline,
  MyLocation,
  Route,
  Schedule,
  TrendingUp,
  Refresh,
  Map as MapIcon,
  ListAlt,
  Analytics,
} from "@mui/icons-material"
import { motion } from "framer-motion"
import axios from "axios"
import { useAuth } from "../auth/AuthContext"
import VisitMap from "./VisitMap"

// Enhanced Stats Card Component
const StatsCard = ({ icon, title, value, subtitle, color, trend }) => {
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
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
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
            {trend && (
              <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                <TrendingUp fontSize="small" sx={{ color: theme.palette.success.main, mr: 0.5 }} />
                <Typography variant="caption" color="success.main">
                  {trend}
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}20`, color: color, width: 48, height: 48 }}>{icon}</Avatar>
        </Box>
      </CardContent>
    </Card>
  )
}

// Timeline Item Component
const TimelineItem = ({ visit, index, isFirst, isLast, attendanceData }) => {
  const theme = useTheme()

  // Determine if this is attendance data or visit data
  const isAttendance = visit.type === "attendance"

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card
        sx={{
          mb: 2,
          borderLeft: `4px solid ${
            isAttendance
              ? isFirst
                ? theme.palette.success.main
                : theme.palette.error.main
              : theme.palette.primary.main
          }`,
          "&:hover": {
            boxShadow: theme.shadows[4],
            transform: "translateX(4px)",
            transition: "all 0.2s ease",
          },
        }}
      >
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Avatar
              sx={{
                bgcolor: isAttendance
                  ? isFirst
                    ? theme.palette.success.main
                    : theme.palette.error.main
                  : theme.palette.primary.main,
                width: 32,
                height: 32,
                mr: 2,
              }}
            >
              {isAttendance ? (
                isFirst ? (
                  <MyLocation fontSize="small" />
                ) : (
                  <Schedule fontSize="small" />
                )
              ) : (
                <Business fontSize="small" />
              )}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {isAttendance
                  ? isFirst
                    ? "Check In"
                    : "Check Out"
                  : `${visit.CompanyName || "Visit"}`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isAttendance
                  ? isFirst
                    ? attendanceData?.firstInLocation || "Office Location"
                    : attendanceData?.lastOutLocation || "Office Location"
                  : visit.DealerName || "Client Visit"}
              </Typography>
            </Box>
            <Chip
              label={isAttendance ? (isFirst ? "First In" : "Last Out") : `Visit ${index}`}
              size="small"
              color={isAttendance ? (isFirst ? "success" : "error") : "primary"}
              variant="outlined"
            />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <AccessTime fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} />
              <Typography variant="body2">
                {isAttendance
                  ? isFirst
                    ? attendanceData?.firstIn || "N/A"
                    : attendanceData?.lastOut || "N/A"
                  : new Date(visit.VisitTime).toLocaleTimeString()}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <LocationOn fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary">
                {isAttendance ? "Office" : "Client Location"}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function MapPage() {
  const [visits, setVisits] = useState([])
  const [attendanceData, setAttendanceData] = useState(null)
  const { user } = useAuth()
  const [mapCenter, setMapCenter] = useState({ lat: 28.6139, lng: 77.209 }) // Default to Delhi
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [markers, setMarkers] = useState([])
  const [directions, setDirections] = useState(null)
  const [distances, setDistances] = useState([])
  const [employees, setEmployees] = useState([])
  const [selectedEmpId, setSelectedEmpId] = useState(user.role === "HR" ? "" : user.emp_id)
  const [totalDistance, setTotalDistance] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [viewMode, setViewMode] = useState("map") // 'map' or 'list'

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  // Fetch employees for HR role
  useEffect(() => {
    if (user.role === "HR") {
      const fetchEmployees = async () => {
        try {
          const response = await axios.get(
            `https://namami-infotech.com/SAFEGUARD/src/employee/list_employee.php?Tenent_Id=${user.tenent_id}`,
          )
          if (response.data.success) {
            setEmployees(response.data.data)
          }
        } catch (error) {
          console.error("Error fetching employee list:", error.message)
        }
      }
      fetchEmployees()
    }
  }, [user.role, user.tenent_id])

  // Update map center and calculate total distance when markers change
  useEffect(() => {
    if (markers.length > 0) {
      const avgLat = markers.reduce((sum, marker) => sum + marker.lat, 0) / markers.length
      const avgLng = markers.reduce((sum, marker) => sum + marker.lng, 0) / markers.length
      setMapCenter({ lat: avgLat, lng: avgLng })

      // Calculate total distance covered
      let totalKm = 0
      for (let i = 1; i < markers.length; i++) {
        const prev = markers[i - 1]
        const curr = markers[i]
        totalKm += calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng)
      }
      setTotalDistance(totalKm.toFixed(2))
    }
  }, [markers])

  // Fetch attendance data for the selected date
  const fetchAttendanceData = async (empId, date) => {
    try {
      const response = await axios.get(
        `https://namami-infotech.com/SAFEGUARD/src/attendance/view_attendance.php?EmpId=${empId}`,
      )
      if (response.data.success && response.data.data.length > 0) {
        // Find attendance for the specific date
        const formattedDate = date.toLocaleDateString("en-GB") // DD/MM/YYYY format
        const dayAttendance = response.data.data.find((day) => day.date === formattedDate)
        return dayAttendance || null
      }
      return null
    } catch (error) {
      console.error("Error fetching attendance data:", error)
      return null
    }
  }

  // Fetch visits and attendance data
  const fetchData = async () => {
    if (!selectedEmpId) {
      setError("Please select an employee")
      return
    }

    setLoading(true)
    setError("")

    try {
      const formattedDate = selectedDate.toISOString().substr(0, 10)

      // Fetch visits
      const visitsResponse = await axios.get(
        `https://namami-infotech.com/SAFEGUARD/src/visit/view_visit.php?empId=${selectedEmpId}&date=${formattedDate}`,
      )

      // Fetch attendance data
      const attendance = await fetchAttendanceData(selectedEmpId, selectedDate)
      setAttendanceData(attendance)

      const allMarkers = []
      const combinedTimeline = []

      // Add attendance check-in as first marker if available
      if (attendance && attendance.firstInLocation && attendance.firstInLocation !== "N/A") {
        const [lat, lng] = attendance.firstInLocation.split(",").map(Number)
        if (!isNaN(lat) && !isNaN(lng)) {
          allMarkers.push({
            lat,
            lng,
            label: "IN",
            type: "checkin",
            companyName: "Check In",
            dealerName: "Office Location",
            visitTime: attendance.firstIn,
          })
          combinedTimeline.push({
            type: "attendance",
            isFirst: true,
            time: attendance.firstIn,
          })
        }
      }

      // Add visit markers
      if (visitsResponse.data.success && visitsResponse.data.data.length > 0) {
        const visitData = visitsResponse.data.data
        visitData.forEach((visit, index) => {
          const [lat, lng] = visit.VisitLatLong.split(",").map(Number)
          if (!isNaN(lat) && !isNaN(lng)) {
            allMarkers.push({
              lat,
              lng,
              label: `${index + 1}`,
              type: "visit",
              companyName: visit.CompanyName,
              dealerName: visit.DealerName,
              visitTime: new Date(visit.VisitTime).toLocaleString(),
            })
          }
        })
        setVisits(visitData)
        combinedTimeline.push(...visitData)
      } else {
        setVisits([])
      }

      // Add attendance check-out as last marker if available
      if (attendance && attendance.lastOutLocation && attendance.lastOutLocation !== "N/A") {
        const [lat, lng] = attendance.lastOutLocation.split(",").map(Number)
        if (!isNaN(lat) && !isNaN(lng)) {
          allMarkers.push({
            lat,
            lng,
            label: "OUT",
            type: "checkout",
            companyName: "Check Out",
            dealerName: "Office Location",
            visitTime: attendance.lastOut,
          })
          combinedTimeline.push({
            type: "attendance",
            isFirst: false,
            time: attendance.lastOut,
          })
        }
      }

      setMarkers(allMarkers)
    } catch (err) {
      console.error("Error fetching data:", err)
      setError("Failed to fetch data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (event) => {
    setSelectedDate(new Date(event.target.value))
  }

  // Function to calculate distance between two lat/lng points
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371 // Radius of Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // Distance in km
  }

  // Calculate working hours
  const calculateWorkingHours = () => {
    if (!attendanceData || !attendanceData.firstIn || !attendanceData.lastOut) return "N/A"
    return attendanceData.workingHours || "N/A"
  }

  // Create timeline data combining attendance and visits
  const createTimelineData = () => {
    const timeline = []

    // Add check-in
    if (attendanceData && attendanceData.firstIn !== "N/A") {
      timeline.push({
        type: "attendance",
        isFirst: true,
        time: attendanceData.firstIn,
      })
    }

    // Add visits
    visits.forEach((visit, index) => {
      timeline.push({
        ...visit,
        type: "visit",
        index: index + 1,
      })
    })

    // Add check-out
    if (attendanceData && attendanceData.lastOut !== "N/A") {
      timeline.push({
        type: "attendance",
        isFirst: false,
        time: attendanceData.lastOut,
      })
    }

    return timeline
  }

  const timelineData = createTimelineData()

  return (
    <Box sx={{ p: { xs: 0, md: 0 }, bgcolor: "#f5f7fa", minHeight: "100vh" }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h4" fontWeight="bold" color="#8d0638ff">
            Field Activity Tracker
          </Typography>
          <Grid container spacing={2} alignItems="center">
          {user.role === "HR" && (
            <Grid item xs={12} sm={6} md={4}>
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
                      startAdornment: <Person sx={{ mr: 1, color: "text.secondary" }} />,
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Avatar sx={{ mr: 2, width: 32, height: 32 }}>{option.Name.charAt(0)}</Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {option.Name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.EmpId}
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
            </Grid>
          )}

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              type="date"
              value={selectedDate.toISOString().substr(0, 10)}
              onChange={handleDateChange}
              variant="outlined"
              fullWidth
              InputProps={{
                startAdornment: <CalendarToday sx={{ mr: 1, color: "text.secondary" }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={12} md={2}>
            <Button
              variant="contained"
              onClick={fetchData}
              disabled={loading || !selectedEmpId}
              fullWidth
              startIcon={loading ? <CircularProgress size={20} /> : <Analytics />}
              sx={{ height: 56 }}
            >
              {loading ? "Loading..." : "Analyze"}
            </Button>
          </Grid>
        </Grid>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant={viewMode === "map" ? "contained" : "outlined"}
              onClick={() => setViewMode("map")}
              size="small"
            >
              <MapIcon />
            </Button>
            <Button
              variant={viewMode === "list" ? "contained" : "outlined"}
              onClick={() => setViewMode("list")}
              size="small"
            >
              <ListAlt />
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        
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
            icon={<Business />}
            title="Total Visits"
            value={visits.length}
            subtitle="Client visits today"
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            icon={<DirectionsCar />}
            title="Distance Covered"
            value={`${totalDistance} km`}
            subtitle="Total travel distance"
            color={theme.palette.info.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            icon={<AccessTime />}
            title="Working Hours"
            value={calculateWorkingHours()}
            subtitle="Total hours worked"
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            icon={<Timeline />}
            title="Activities"
            value={timelineData.length}
            subtitle="Total activities today"
            color={theme.palette.warning.main}
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Map/Timeline View */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ borderRadius: 2, height: 600 }}>
            {viewMode === "map" ? (
              <Box sx={{ p: 2, height: "100%" }}>
                <Typography variant="h6" gutterBottom>
                  Route Map
                </Typography>
                <Box sx={{ height: "calc(100% - 40px)", borderRadius: 1, overflow: "hidden" }}>
                  <VisitMap markers={markers} mapCenter={mapCenter} directions={directions} distances={distances} />
                </Box>
              </Box>
            ) : (
              <Box sx={{ p: 2, height: "100%", overflow: "auto" }}>
                <Typography variant="h6" gutterBottom>
                  Activity Timeline
                </Typography>
                <Box sx={{ height: "calc(100% - 40px)", overflow: "auto" }}>
                  {timelineData.map((item, index) => (
                    <TimelineItem
                      key={index}
                      visit={item}
                      index={index}
                      isFirst={item.type === "attendance" && item.isFirst}
                      isLast={item.type === "attendance" && !item.isFirst}
                      attendanceData={attendanceData}
                    />
                  ))}
                  {timelineData.length === 0 && (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No activities found for the selected date
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Summary Panel */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Attendance Summary */}
            {attendanceData && (
              <Card>
                <CardHeader
                  title="Attendance Summary"
                  avatar={
                    <Avatar sx={{ bgcolor: theme.palette.success.main }}>
                      <Schedule />
                    </Avatar>
                  }
                />
                <Divider />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="h6" color="success.main">
                          {attendanceData.firstIn || "N/A"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Check In
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="h6" color="error.main">
                          {attendanceData.lastOut || "N/A"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Check Out
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Visit Details */}
            <Card>
              <CardHeader
                title="Visit Details"
                avatar={
                  <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                    <Business />
                  </Avatar>
                }
              />
              <Divider />
              <CardContent sx={{ p: 0 }}>
                <List sx={{ maxHeight: 300, overflow: "auto" }}>
                  {visits.map((visit, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}>
                            {index + 1}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body1" fontWeight="medium">
                              {visit.CompanyName}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {visit.DealerName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(visit.VisitTime).toLocaleTimeString()}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < visits.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                  {visits.length === 0 && (
                    <ListItem>
                      <ListItemText
                        primary="No visits recorded"
                        secondary="Visit data will appear here when available"
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>

            {/* Route Summary */}
            <Card>
              <CardHeader
                title="Route Summary"
                avatar={
                  <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                    <Route />
                  </Avatar>
                }
              />
              <Divider />
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Distance:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {totalDistance} km
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Stops:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {markers.length}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Efficiency:
                  </Typography>
                  <Chip
                    label={visits.length > 3 ? "High" : visits.length > 1 ? "Medium" : "Low"}
                    color={visits.length > 3 ? "success" : visits.length > 1 ? "warning" : "error"}
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  )
}

export default MapPage
