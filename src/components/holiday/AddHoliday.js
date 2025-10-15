"use client"

import { useState } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  IconButton,
  Alert,
  CircularProgress,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  Chip,
  Tooltip,
  Fade,
  useTheme,
  alpha,
  Stack,
} from "@mui/material"
import { Close, Event, Save, Add, CalendarToday, Title, DeleteOutline, EventAvailable } from "@mui/icons-material"
import { motion, AnimatePresence } from "framer-motion"
import axios from "axios"
import { useAuth } from "../auth/AuthContext"

const AddHoliday = ({ open, onClose, onHolidayAdded }) => {
  const { user } = useAuth()
  const theme = useTheme()
  const [holidays, setHolidays] = useState([{ date: "", title: "" }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [validationErrors, setValidationErrors] = useState({})

  const handleHolidayChange = (index, field, value) => {
    const newHolidays = [...holidays]
    newHolidays[index][field] = value
    setHolidays(newHolidays)

    // Clear validation error for this field
    if (validationErrors[`${index}-${field}`]) {
      const newErrors = { ...validationErrors }
      delete newErrors[`${index}-${field}`]
      setValidationErrors(newErrors)
    }
  }

  const handleAddHoliday = () => {
    setHolidays([...holidays, { date: "", title: "" }])
  }

  const handleRemoveHoliday = (index) => {
    if (holidays.length > 1) {
      setHolidays(holidays.filter((_, i) => i !== index))
      // Clear validation errors for removed holiday
      const newErrors = { ...validationErrors }
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith(`${index}-`)) {
          delete newErrors[key]
        }
      })
      setValidationErrors(newErrors)
    }
  }

  const validateForm = () => {
    const errors = {}
    let isValid = true

    holidays.forEach((holiday, index) => {
      if (!holiday.date.trim()) {
        errors[`${index}-date`] = "Date is required"
        isValid = false
      }
      if (!holiday.title.trim()) {
        errors[`${index}-title`] = "Title is required"
        isValid = false
      }
    })

    setValidationErrors(errors)
    return isValid
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      setError("Please fill in all required fields")
      return
    }

    // Check for duplicate dates
    const dates = holidays.map((h) => h.date)
    const duplicates = dates.filter((date, index) => dates.indexOf(date) !== index)
    if (duplicates.length > 0) {
      setError("Duplicate dates are not allowed")
      return
    }

    setLoading(true)
    setError("")

    try {
      const payload = {
        Tenent_Id: user.tenent_id,
        holidays: holidays.map((holiday) => ({
          date: holiday.date,
          title: holiday.title.trim(),
        })),
      }

      const response = await axios.post(
        "https://namami-infotech.com/SAFEGUARD/src/holiday/add_holiday.php",
        payload,
      )

      if (response.data.success) {
        onHolidayAdded()
        handleClose()
      } else {
        setError(response.data.message || "Failed to add holidays")
      }
    } catch (err) {
      setError("Error adding holidays: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setHolidays([{ date: "", title: "" }])
    setError("")
    setValidationErrors({})
    onClose()
  }

  const formatDate = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const completedHolidays = holidays.filter((h) => h.date && h.title).length

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      TransitionComponent={Fade}
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: "90vh",
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`,
          backdropFilter: "blur(10px)",
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          bgcolor: "#8d0638ff",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 3,
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            right: 0,
            width: "100%",
            height: "100%",
            background: `linear-gradient(45deg, ${alpha("#8d0638ff", 0.9)} 0%, ${alpha("#6d0430ff", 0.9)} 100%)`,
            zIndex: 1,
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", position: "relative", zIndex: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              bgcolor: alpha("#ffffff", 0.2),
              borderRadius: 2,
              mr: 2,
            }}
          >
            <EventAvailable sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight="700" sx={{ letterSpacing: -0.5 }}>
              Add Holidays
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              Add holidays to the company calendar
            </Typography>
          </Box>
        </Box>
        <IconButton 
          onClick={handleClose} 
          sx={{ 
            color: "white", 
            position: "relative", 
            zIndex: 2,
            bgcolor: alpha("#ffffff", 0.1),
            "&:hover": {
              bgcolor: alpha("#ffffff", 0.2),
            }
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Progress Indicator */}
        <Box
          sx={{
            px: 3,
            pt: 3,
            pb: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            background: alpha(theme.palette.primary.main, 0.02),
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary" fontWeight="500">
              {completedHolidays} of {holidays.length} holidays completed
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 120,
                  height: 6,
                  bgcolor: theme.palette.grey[200],
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    width: `${(completedHolidays / holidays.length) * 100}%`,
                    height: "100%",
                    bgcolor: "#8d0638ff",
                    transition: "width 0.3s ease",
                  }}
                />
              </Box>
              <Typography variant="caption" fontWeight="600" color="#8d0638ff">
                {Math.round((completedHolidays / holidays.length) * 100)}%
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Main Content */}
        <Box sx={{ p: 3 }}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3, 
                borderRadius: 2,
                border: `1px solid ${theme.palette.error.light}`,
              }} 
              onClose={() => setError("")}
            >
              {error}
            </Alert>
          )}

          {/* Welcome Message */}
          <Box sx={{ mb: 4, textAlign: "center" }}>
            <Typography variant="h6" fontWeight="600" color="text.primary" gutterBottom>
              🎉 Add Company Holidays
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: "auto", lineHeight: 1.6 }}>
              Create holiday entries for your organization. You can add multiple holidays at once and manage them efficiently.
            </Typography>
          </Box>

          {/* Holiday Cards */}
          <Box sx={{ mb: 3 }}>
            <AnimatePresence mode="popLayout">
              {holidays.map((holiday, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  layout
                >
                  <Card
                    sx={{
                      mb: 2,
                      border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      "&:hover": {
                        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                        transform: "translateY(-1px)",
                        transition: "all 0.2s ease",
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      {/* Card Header */}
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: alpha("#8d0638ff", 0.1),
                              color: "#8d0638ff",
                              borderRadius: 2,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              mr: 2,
                              fontWeight: "600",
                              fontSize: "0.875rem",
                            }}
                          >
                            {index + 1}
                          </Box>
                          <Typography variant="subtitle1" fontWeight="600" color="text.primary">
                            Holiday Details
                          </Typography>
                        </Box>
                        {holidays.length > 1 && (
                          <Tooltip title="Remove this holiday">
                            <IconButton
                              onClick={() => handleRemoveHoliday(index)}
                              color="error"
                              size="small"
                              sx={{
                                bgcolor: alpha(theme.palette.error.main, 0.04),
                                "&:hover": {
                                  bgcolor: alpha(theme.palette.error.main, 0.12),
                                },
                              }}
                            >
                              <DeleteOutline fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>

                      {/* Form Fields */}
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Holiday Date"
                            type="date"
                            value={holiday.date}
                            onChange={(e) => handleHolidayChange(index, "date", e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            error={!!validationErrors[`${index}-date`]}
                            helperText={validationErrors[`${index}-date`]}
                            InputProps={{
                              startAdornment: (
                                <CalendarToday 
                                  sx={{ 
                                    mr: 1.5, 
                                    color: holiday.date ? "#8d0638ff" : "text.secondary" 
                                  }} 
                                />
                              ),
                            }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: 2,
                              },
                            }}
                          />
                          {holiday.date && (
                            <Box sx={{ mt: 1.5 }}>
                              <Chip
                                label={formatDate(holiday.date)}
                                size="small"
                                sx={{
                                  bgcolor: alpha("#8d0638ff", 0.08),
                                  color: "#8d0638ff",
                                  fontWeight: "500",
                                  border: `1px solid ${alpha("#8d0638ff", 0.2)}`,
                                }}
                                icon={<CalendarToday sx={{ fontSize: 16 }} />}
                              />
                            </Box>
                          )}
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Holiday Title"
                            value={holiday.title}
                            onChange={(e) => handleHolidayChange(index, "title", e.target.value)}
                            placeholder="e.g., Christmas Day, New Year's Day"
                            error={!!validationErrors[`${index}-title`]}
                            helperText={validationErrors[`${index}-title`]}
                            InputProps={{
                              startAdornment: (
                                <Title 
                                  sx={{ 
                                    mr: 1.5, 
                                    color: holiday.title ? "#8d0638ff" : "text.secondary" 
                                  }} 
                                />
                              ),
                            }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: 2,
                              },
                            }}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </Box>

          {/* Add Another Holiday Button */}
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 3 }}>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={handleAddHoliday}
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.5,
                borderColor: alpha("#8d0638ff", 0.3),
                color: "#8d0638ff",
                fontWeight: "500",
                "&:hover": {
                  transform: "translateY(-1px)",
                  boxShadow: `0 4px 12px ${alpha("#8d0638ff", 0.15)}`,
                  borderColor: "#8d0638ff",
                  bgcolor: alpha("#8d0638ff", 0.02),
                },
              }}
            >
              Add Another Holiday
            </Button>
          </Box>

          {/* Summary Card */}
          {holidays.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Box 
                sx={{ 
                  p: 2.5, 
                  bgcolor: alpha(theme.palette.info.main, 0.04), 
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <EventAvailable 
                    sx={{ 
                      color: theme.palette.info.main,
                      fontSize: 20 
                    }} 
                  />
                  <Box>
                    <Typography variant="body2" fontWeight="600" color="info.main">
                      Ready to add {holidays.length} holidays
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      All holidays will be added to the company calendar at once
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </motion.div>
          )}
        </Box>
      </DialogContent>

      {/* Footer Actions */}
      <DialogActions
        sx={{
          p: 3,
          borderTop: `1px solid ${theme.palette.divider}`,
          background: alpha(theme.palette.grey[50], 0.8),
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Button 
          onClick={handleClose} 
          variant="outlined" 
          disabled={loading}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1,
            minWidth: 100,
          }}
        >
          Cancel
        </Button>
        
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || holidays.some((h) => !h.date || !h.title)}
          startIcon={loading ? <CircularProgress size={16} /> : <Save />}
          sx={{
            borderRadius: 2,
            px: 4,
            py: 1,
            minWidth: 160,
            bgcolor: "#8d0638ff",
            fontWeight: "600",
            "&:hover": {
              bgcolor: "#6d0430ff",
              transform: "translateY(-1px)",
              boxShadow: `0 4px 12px ${alpha("#8d0638ff", 0.3)}`,
            },
            "&:disabled": {
              bgcolor: theme.palette.grey[300],
              color: theme.palette.grey[500],
            },
          }}
        >
          {loading ? (
            "Adding Holidays..."
          ) : (
            `Add ${holidays.length} Holiday${holidays.length > 1 ? "s" : ""}`
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddHoliday