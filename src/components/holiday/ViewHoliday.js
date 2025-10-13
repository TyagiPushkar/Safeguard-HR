"use client"

import React, { useState, useEffect } from "react"
import axios from "axios"
import { Calendar, momentLocalizer } from "react-big-calendar"
import moment from "moment"
import "react-big-calendar/lib/css/react-big-calendar.css"
import {
  Button,
  TextField,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  Paper,
  useTheme,
  useMediaQuery,
  Alert,
  CircularProgress,
  Tooltip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Stack,
} from "@mui/material"
import {
  Event,
  CalendarMonth,
  Add,
  Refresh,
  ViewList,
  ViewModule,
  Today,
  EventAvailable,
  Celebration,
  Download,
  Filter,
} from "@mui/icons-material"
import { LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { DateTime } from "luxon"
import { motion, AnimatePresence } from "framer-motion"
import AddHoliday from "./AddHoliday"
import EditHoliday from "./EditHoliday"
import { useAuth } from "../auth/AuthContext"

const localizer = momentLocalizer(moment)

// Stats Card Component
const StatsCard = ({ icon, title, value, color, subtitle }) => {
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
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
          </Box>
          <Avatar sx={{ bgcolor: `${color}20`, color: color, width: 48, height: 48 }}>{icon}</Avatar>
        </Box>
      </CardContent>
    </Card>
  )
}

// Holiday List Item Component
const HolidayListItem = ({ holiday, index }) => {
  const theme = useTheme()

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <ListItem
        sx={{
          borderRadius: 2,
          mb: 1,
          bgcolor: "background.paper",
          "&:hover": {
            bgcolor: theme.palette.action.hover,
            transform: "translateX(4px)",
            transition: "all 0.2s ease",
          },
        }}
      >
        <ListItemAvatar>
          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
            <Celebration />
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Typography variant="subtitle1" fontWeight="medium">
              {holiday.title}
            </Typography>
          }
          secondary={
            <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
              <CalendarMonth fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary">
                {moment(holiday.start).format("MMMM DD, YYYY")}
              </Typography>
              <Chip
                label={moment(holiday.start).format("dddd")}
                size="small"
                variant="outlined"
                sx={{ ml: 1 }}
              />
            </Box>
          }
        />
      </ListItem>
    </motion.div>
  )
}

function ViewHoliday() {
  const [holidays, setHolidays] = useState([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(DateTime.now())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [viewMode, setViewMode] = useState("calendar") // 'calendar' or 'list'
  const [refreshing, setRefreshing] = useState(false)

  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  const fetchHolidays = async () => {
    try {
      setLoading(true)
      const response = await axios.get(
        `https://namami-infotech.com/SAFEGUARD/src/holiday/view_holiday.php?Tenent_Id=${user.tenent_id}`,
      )
      if (response.data.success) {
        const holidayEvents = response.data.data.map((holiday) => ({
          title: holiday.title,
          start: new Date(holiday.date),
          end: new Date(holiday.date),
          allDay: true,
          id: holiday.id,
        }))
        setHolidays(holidayEvents)
      } else {
        setError("Failed to fetch holidays")
      }
    } catch (err) {
      setError("Error fetching holidays: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHolidays()
  }, [user.tenent_id])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchHolidays()
    setRefreshing(false)
  }

  const handleMonthYearChange = (date) => {
    if (date) {
      setSelectedDate(date)
    }
  }

  // Calculate statistics
  const currentYear = selectedDate.year
  const currentMonth = selectedDate.month
  const totalHolidays = holidays.length
  const thisMonthHolidays = holidays.filter((holiday) => {
    const holidayDate = moment(holiday.start)
    return holidayDate.year() === currentYear && holidayDate.month() + 1 === currentMonth
  }).length
  const upcomingHolidays = holidays.filter((holiday) => moment(holiday.start).isAfter(moment())).length

  // Get holidays for current month for list view
  const currentMonthHolidays = holidays
    .filter((holiday) => {
      const holidayDate = moment(holiday.start)
      return holidayDate.year() === currentYear && holidayDate.month() + 1 === currentMonth
    })
    .sort((a, b) => moment(a.start).diff(moment(b.start)))

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <CircularProgress size={60} />
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 0, md: 0 }, bgcolor: "#f5f7fa", minHeight: "100vh" }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h4" fontWeight="bold" color="#8d0638ff">
            Holiday Calendar
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Refresh Data">
              <IconButton onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? <CircularProgress size={20} /> : <Refresh />}
              </IconButton>
            </Tooltip>
            <Button
              variant={viewMode === "calendar" ? "contained" : "outlined"}
              startIcon={<ViewModule />}
              onClick={() => setViewMode("calendar")}
              size="small"
            >
              Calendar
            </Button>
            <Button
              variant={viewMode === "list" ? "contained" : "outlined"}
              startIcon={<ViewList />}
              onClick={() => setViewMode("list")}
              size="small"
            >
              List
            </Button>
          </Box>
        </Box>

        {/* Controls */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <LocalizationProvider dateAdapter={AdapterLuxon}>
              <DatePicker
                views={["year", "month"]}
                value={selectedDate}
                onChange={handleMonthYearChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Month and Year"
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <CalendarMonth sx={{ mr: 1, color: "text.secondary" }} />,
                    }}
                  />
                )}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Button variant="outlined" startIcon={<Download />} fullWidth>
              Export Calendar
            </Button>
          </Grid>

          <Grid item xs={12} sm={12} md={4}>
            {user && user.role === "HR" && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setDialogOpen(true)}
                fullWidth
                sx={{ bgcolor: "#8d0638ff" }}
              >
                Add Holiday
              </Button>
            )}
          </Grid>
        </Grid>
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
            icon={<Event />}
            title="Total Holidays"
            value={totalHolidays}
            color={theme.palette.primary.main}
            subtitle="This year"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            icon={<CalendarMonth />}
            title="This Month"
            value={thisMonthHolidays}
            color={theme.palette.success.main}
            subtitle={selectedDate.toFormat("MMMM yyyy")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            icon={<EventAvailable />}
            title="Upcoming"
            value={upcomingHolidays}
            color={theme.palette.warning.main}
            subtitle="Future holidays"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            icon={<Today />}
            title="Next Holiday"
            value={
              upcomingHolidays > 0
                ? moment(
                    holidays.find((h) => moment(h.start).isAfter(moment()))?.start,
                  ).fromNow()
                : "None"
            }
            color={theme.palette.info.main}
            subtitle="Days remaining"
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Calendar/List View */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ borderRadius: 2, height: 600 }}>
            {viewMode === "calendar" ? (
              <Box sx={{ p: 2, height: "100%" }}>
                <Typography variant="h6" gutterBottom>
                  Holiday Calendar - {selectedDate.toFormat("MMMM yyyy")}
                </Typography>
                <Box
                  sx={{
                    height: "calc(100% - 40px)",
                    borderRadius: 1,
                    overflow: "hidden",
                    "& .rbc-calendar": {
                      height: "100%",
                    },
                    "& .rbc-event": {
                      backgroundColor: theme.palette.primary.main,
                      borderRadius: "4px",
                      border: "none",
                      color: "white",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                    },
                    "& .rbc-today": {
                      backgroundColor: `${theme.palette.primary.light}20`,
                    },
                    "& .rbc-header": {
                      backgroundColor: theme.palette.primary.main,
                      color: "white",
                      fontWeight: "bold",
                      padding: "8px",
                    },
                    "& .rbc-month-view": {
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: "8px",
                    },
                  }}
                >
                  <Calendar
                    localizer={localizer}
                    events={holidays}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: "100%" }}
                    views={["month", "agenda", "day"]}
                    date={selectedDate.toJSDate()}
                    onNavigate={(date) => setSelectedDate(DateTime.fromJSDate(date))}
                    selectable={false}
                    popup
                    eventPropGetter={(event) => ({
                      style: {
                        backgroundColor: theme.palette.primary.main,
                        borderRadius: "4px",
                        border: "none",
                        color: "white",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                      },
                    })}
                  />
                </Box>
              </Box>
            ) : (
              <Box sx={{ p: 2, height: "100%", overflow: "auto" }}>
                <Typography variant="h6" gutterBottom>
                  Holidays in {selectedDate.toFormat("MMMM yyyy")}
                </Typography>
                <List sx={{ height: "calc(100% - 40px)", overflow: "auto" }}>
                  <AnimatePresence>
                    {currentMonthHolidays.map((holiday, index) => (
                      <HolidayListItem key={holiday.id || index} holiday={holiday} index={index} />
                    ))}
                  </AnimatePresence>
                  {currentMonthHolidays.length === 0 && (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No holidays found for {selectedDate.toFormat("MMMM yyyy")}
                      </Typography>
                    </Box>
                  )}
                </List>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Quick Info Card */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                  <Celebration sx={{ mr: 1, color: theme.palette.primary.main }} />
                  Quick Info
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Current Month
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {selectedDate.toFormat("MMMM yyyy")}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Holidays This Month
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="#8d0638ff">
                    {thisMonthHolidays}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Working Days
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    {selectedDate.daysInMonth - thisMonthHolidays}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Upcoming Holidays */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                  <EventAvailable sx={{ mr: 1, color: theme.palette.warning.main }} />
                  Upcoming Holidays
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List sx={{ maxHeight: 300, overflow: "auto" }}>
                  {holidays
                    .filter((holiday) => moment(holiday.start).isAfter(moment()))
                    .slice(0, 5)
                    .map((holiday, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: theme.palette.warning.main, width: 32, height: 32 }}>
                            <Event fontSize="small" />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight="medium">
                              {holiday.title}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {moment(holiday.start).format("MMM DD, YYYY")} ({moment(holiday.start).fromNow()})
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  {upcomingHolidays === 0 && (
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="No upcoming holidays"
                        secondary="All holidays for this year have passed"
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>

            {/* Calendar Legend */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Legend
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      bgcolor: theme.palette.primary.main,
                      borderRadius: 1,
                      mr: 1,
                    }}
                  />
                  <Typography variant="body2">Public Holiday</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      bgcolor: `${theme.palette.primary.light}20`,
                      border: `1px solid ${theme.palette.primary.main}`,
                      borderRadius: 1,
                      mr: 1,
                    }}
                  />
                  <Typography variant="body2">Today</Typography>
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* Add/Edit Holiday Modals */}
      <AddHoliday open={dialogOpen} onClose={() => setDialogOpen(false)} onHolidayAdded={fetchHolidays} />
      <EditHoliday open={editDialogOpen} onClose={() => setEditDialogOpen(false)} onHolidayUpdated={fetchHolidays} />
    </Box>
  )
}

export default ViewHoliday
