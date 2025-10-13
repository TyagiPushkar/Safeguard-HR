"use client"

import { useState } from "react"
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Grid,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
} from "@mui/material"
import { FlightTakeoff, CalendarToday, LocationOn, DirectionsCar } from "@mui/icons-material"
import axios from "axios"
import { useAuth } from "../auth/AuthContext"

function ApplyTravel({ open, onClose, onTravelApplied }) {
  const { user } = useAuth()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  const [travelEntry, setTravelEntry] = useState({
    empId: user.emp_id,
    travelDate: "",
    travelDestination: "",
    travelFrom: "",
    travelTo: "",
    travelType: "",
    status: "Pending",
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  const travelTypes = ["Business", "Training", "Conference", "Client Meeting", "Other"]

  const handleChange = (field, value) => {
    setTravelEntry({ ...travelEntry, [field]: value })
    // Clear error when user starts typing
    if (error) setError("")
  }

  const validateForm = () => {
    const requiredFields = ["travelDate", "travelDestination", "travelFrom", "travelTo", "travelType"]
    const emptyFields = requiredFields.filter((field) => !travelEntry[field].trim())

    if (emptyFields.length > 0) {
      setError("Please fill in all required fields")
      return false
    }

    // Check if travel date is in the future
    const selectedDate = new Date(travelEntry.travelDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (selectedDate < today) {
      setError("Travel date cannot be in the past")
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!user || !user.emp_id) {
      setError("User authentication required")
      return
    }

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setSuccess("")
    setError("")

    try {
      const payload = {
        application: travelEntry,
      }
      const response = await axios.post(
        "https://namami-infotech.com/SAFEGUARD/src/travel/apply_travel.php",
        payload,
      )

      if (response.data.success) {
        setSuccess("Travel application submitted successfully!")
        setTimeout(() => {
          onTravelApplied()
          onClose()
          // Reset form
          setTravelEntry({
            empId: user.emp_id,
            travelDate: "",
            travelDestination: "",
            travelFrom: "",
            travelTo: "",
            travelType: "",
            status: "Pending",
          })
          setSuccess("")
        }, 1500)
      } else {
        setError(response.data.message || "Failed to submit travel application")
      }
    } catch (err) {
      console.error("Error:", err)
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setError("")
      setSuccess("")
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: { borderRadius: isMobile ? 0 : 2 },
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
        <FlightTakeoff />
        Apply for Travel
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Fill in the details for your travel request. All fields are required.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Travel Date"
              type="date"
              value={travelEntry.travelDate}
              onChange={(e) => handleChange("travelDate", e.target.value)}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              fullWidth
              InputProps={{
                startAdornment: <CalendarToday sx={{ mr: 1, color: "action.active" }} />,
              }}
              inputProps={{
                min: new Date().toISOString().split("T")[0],
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Travel Type</InputLabel>
              <Select
                value={travelEntry.travelType}
                onChange={(e) => handleChange("travelType", e.target.value)}
                label="Travel Type"
                startAdornment={<DirectionsCar sx={{ mr: 1, color: "action.active" }} />}
              >
                {travelTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Travel Destination"
              value={travelEntry.travelDestination}
              onChange={(e) => handleChange("travelDestination", e.target.value)}
              variant="outlined"
              fullWidth
              InputProps={{
                startAdornment: <LocationOn sx={{ mr: 1, color: "action.active" }} />,
              }}
              placeholder="Enter destination city/location"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Travel From"
              value={travelEntry.travelFrom}
              onChange={(e) => handleChange("travelFrom", e.target.value)}
              variant="outlined"
              fullWidth
              placeholder="Starting location"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Travel To"
              value={travelEntry.travelTo}
              onChange={(e) => handleChange("travelTo", e.target.value)}
              variant="outlined"
              fullWidth
              placeholder="Ending location"
            />
          </Grid>
        </Grid>

        {/* Status Messages */}
        {loading && (
          <Box sx={{ display: "flex", alignItems: "center", mt: 2, gap: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary">
              Submitting your travel request...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button onClick={handleClose} disabled={loading} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading} variant="contained" sx={{ minWidth: 100 }}>
          {loading ? <CircularProgress size={20} color="inherit" /> : "Submit Request"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ApplyTravel
