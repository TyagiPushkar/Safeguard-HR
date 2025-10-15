"use client"

import { useState } from "react"
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  Box,
  IconButton,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  useTheme,
  Fade,
  Stack,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  alpha,
} from "@mui/material"
import {
  Close,
  CloudUpload,
  Image as ImageIcon,
  Schedule,
  Link as LinkIcon,
  Title,
  Description,
  Send,
  Preview,
  Delete,
  NotificationsActive,
  AccessTime,
  Launch,
} from "@mui/icons-material"
import { motion, AnimatePresence } from "framer-motion"
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import axios from "axios"
import { useAuth } from "../auth/AuthContext"

// Enhanced Image Upload Component
const ImageUploadArea = ({ onImageSelect, selectedImage, onImageRemove }) => {
  const theme = useTheme()

  const handleDrop = (e) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      onImageSelect(files[0])
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  return (
    <Box
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      sx={{
        border: `2px dashed ${selectedImage ? theme.palette.success.main : alpha(theme.palette.divider, 0.5)}`,
        borderRadius: 2,
        p: 2,
        textAlign: "center",
        cursor: "pointer",
        transition: "all 0.2s ease",
        bgcolor: selectedImage ? alpha(theme.palette.success.main, 0.04) : alpha(theme.palette.action.hover, 0.5),
        "&:hover": {
          borderColor: theme.palette.primary.main,
          bgcolor: alpha(theme.palette.primary.main, 0.02),
        },
      }}
    >
      {selectedImage ? (
        <Box>
          <Box
            component="img"
            src={selectedImage}
            alt="Preview"
            sx={{
              maxWidth: "100%",
              maxHeight: 120,
              borderRadius: 1,
              mb: 1.5,
            }}
          />
          <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<CloudUpload />}
              component="label"
              size="small"
              sx={{ fontSize: '0.75rem' }}
            >
              Change
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => e.target.files[0] && onImageSelect(e.target.files[0])}
              />
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={onImageRemove}
              size="small"
              sx={{ fontSize: '0.75rem' }}
            >
              Remove
            </Button>
          </Box>
        </Box>
      ) : (
        <Box>
          <Avatar sx={{ 
            bgcolor: alpha(theme.palette.primary.main, 0.1), 
            color: theme.palette.primary.main, 
            mx: "auto", 
            mb: 1.5, 
            width: 48, 
            height: 48 
          }}>
            <ImageIcon fontSize="small" />
          </Avatar>
          <Typography variant="subtitle2" fontWeight="600" gutterBottom>
            Upload Image
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
            Drag & drop or click to browse
          </Typography>
          <Button
            variant="outlined"
            startIcon={<CloudUpload />}
            component="label"
            size="small"
            sx={{ borderRadius: 1.5 }}
          >
            Choose File
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => e.target.files[0] && onImageSelect(e.target.files[0])}
            />
          </Button>
        </Box>
      )}
    </Box>
  )
}

// Notification Preview Component
const NotificationPreview = ({ subject, body, url, pushTime, image }) => {
  const theme = useTheme()

  return (
    <Card
      sx={{
        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        borderRadius: 2,
        overflow: "hidden",
        background: 'white',
      }}
    >
      <Box
        sx={{
          bgcolor: "#8d0638ff",
          color: "white",
          p: 1.5,
          display: "flex",
          alignItems: "center",
        }}
      >
        <NotificationsActive sx={{ mr: 1, fontSize: '1.1rem' }} />
        <Typography variant="subtitle2" fontWeight="600">
          Preview
        </Typography>
      </Box>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start" }}>
          <Avatar sx={{ 
            bgcolor: alpha("#8d0638ff", 0.1), 
            color: "#8d0638ff", 
            mr: 1.5,
            width: 32,
            height: 32
          }}>
            <NotificationsActive fontSize="small" />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle2" fontWeight="600" gutterBottom sx={{ fontSize: '0.9rem' }}>
              {subject || "Notification Subject"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.8rem' }}>
              {body || "Notification message will appear here..."}
            </Typography>
            
            {pushTime && (
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <AccessTime fontSize="small" sx={{ mr: 0.5, color: "text.secondary", fontSize: '0.8rem' }} />
                <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                  {new Date(pushTime).toLocaleString()}
                </Typography>
              </Box>
            )}
            
            {url && (
              <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
                <Launch fontSize="small" sx={{ mr: 0.5, color: "primary.main", fontSize: '0.8rem' }} />
                <Typography
                  variant="caption"
                  component="a"
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: "primary.main",
                    textDecoration: "none",
                    fontSize: '0.75rem',
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  {url.length > 30 ? url.substring(0, 30) + '...' : url}
                </Typography>
              </Box>
            )}
            
            {image && (
              <Box
                component="img"
                src={image}
                alt="Notification"
                sx={{
                  width: "100%",
                  maxHeight: 100,
                  objectFit: "cover",
                  borderRadius: 1,
                }}
              />
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

function AddNotification({ open, onClose, onNotificationAdded }) {
  const { user } = useAuth()
  const theme = useTheme()
  
  const [formData, setFormData] = useState({
    subject: "",
    body: "",
    url: "",
    pushTime: new Date(),
    priority: "normal",
  })
  
  const [base64Image, setBase64Image] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPreview, setShowPreview] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const handleImageSelect = (file) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB")
        return
      }

      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file")
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setBase64Image(reader.result)
        setImagePreview(reader.result)
        setError("")
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageRemove = () => {
    setBase64Image(null)
    setImagePreview(null)
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.subject.trim()) {
      errors.subject = "Subject is required"
    }
    
    if (!formData.body.trim()) {
      errors.body = "Body is required"
    }
    
    if (formData.url && !isValidUrl(formData.url)) {
      errors.url = "Please enter a valid URL"
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const isValidUrl = (string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      setError("Please fix the validation errors")
      return
    }

    setLoading(true)
    setError("")

    try {
      const payload = {
        subject: formData.subject.trim(),
        body: formData.body.trim(),
        url: formData.url.trim(),
        push_time: formData.pushTime.toISOString(),
        image: base64Image,
        priority: formData.priority,
        Tenent_Id: user.tenent_id,
      }

      const response = await axios.post(
        "https://namami-infotech.com/SAFEGUARD/src/notification/add_notification.php",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      if (response.data.success) {
        onNotificationAdded()
        handleClose()
      } else {
        setError(response.data.message || "Failed to add notification")
      }
    } catch (err) {
      setError("Error adding notification: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      subject: "",
      body: "",
      url: "",
      pushTime: new Date(),
      priority: "normal",
    })
    setBase64Image(null)
    setImagePreview(null)
    setError("")
    setValidationErrors({})
    setShowPreview(false)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      TransitionComponent={Fade}
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: "90vh",
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.98)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
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
          p: 2.5,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '100%',
            height: '100%',
            background: `linear-gradient(45deg, ${alpha("#8d0638ff", 0.9)} 0%, ${alpha("#6d0430ff", 0.9)} 100%)`,
            zIndex: 1,
          }
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", position: 'relative', zIndex: 2 }}>
          <Box sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            bgcolor: alpha('#ffffff', 0.2),
            borderRadius: 2,
            mr: 1.5,
          }}>
            <NotificationsActive sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight="700">
              New Notification
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9, mt: 0.5, display: 'block' }}>
              Create and send push notifications
            </Typography>
          </Box>
        </Box>
        <IconButton 
          onClick={handleClose} 
          sx={{ 
            color: "white", 
            position: 'relative', 
            zIndex: 2,
            bgcolor: alpha('#ffffff', 0.1),
            '&:hover': {
              bgcolor: alpha('#ffffff', 0.2),
            }
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5 }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2, 
              borderRadius: 2,
              border: `1px solid ${theme.palette.error.light}`,
            }} 
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* Form Section */}
          <Grid item xs={12} lg={showPreview ? 6 : 12}>
            <Stack spacing={2.5}>
              {/* Notification Details */}
              <Box>
                <Typography variant="subtitle1" fontWeight="600" gutterBottom sx={{ fontSize: '0.9rem', mb: 1.5 }}>
                  📝 Notification Details
                </Typography>
                
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange("subject", e.target.value)}
                    error={!!validationErrors.subject}
                    helperText={validationErrors.subject}
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Title fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                      }
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Message Body"
                    multiline
                    rows={3}
                    value={formData.body}
                    onChange={(e) => handleInputChange("body", e.target.value)}
                    error={!!validationErrors.body}
                    helperText={validationErrors.body}
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1 }}>
                          <Description fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                      }
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Action URL (Optional)"
                    value={formData.url}
                    onChange={(e) => handleInputChange("url", e.target.value)}
                    error={!!validationErrors.url}
                    helperText={validationErrors.url || "Add a link for users to take action"}
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LinkIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                      }
                    }}
                  />
                </Stack>
              </Box>

              {/* Scheduling & Priority */}
              <Box>
                <Typography variant="subtitle1" fontWeight="600" gutterBottom sx={{ fontSize: '0.9rem', mb: 1.5 }}>
                  ⚙️ Settings
                </Typography>
                
                <Stack spacing={2}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateTimePicker
                      label="Schedule Time"
                      value={formData.pushTime}
                      onChange={(newValue) => handleInputChange("pushTime", newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1.5,
                            }
                          }}
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <Schedule fontSize="small" color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </LocalizationProvider>

                  <FormControl fullWidth size="small">
                    <InputLabel>Priority Level</InputLabel>
                    <Select
                      value={formData.priority}
                      onChange={(e) => handleInputChange("priority", e.target.value)}
                      label="Priority Level"
                      sx={{ borderRadius: 1.5 }}
                    >
                      <MenuItem value="low">
                        <Chip label="Low" color="default" size="small" sx={{ mr: 1, fontSize: '0.7rem' }} />
                        Low Priority
                      </MenuItem>
                      <MenuItem value="normal">
                        <Chip label="Normal" sx={{ bgcolor: alpha("#8d0638ff", 0.1), color: "#8d0638ff", mr: 1, fontSize: '0.7rem' }} size="small" />
                        Normal Priority
                      </MenuItem>
                      <MenuItem value="high">
                        <Chip label="High" color="warning" size="small" sx={{ mr: 1, fontSize: '0.7rem' }} />
                        High Priority
                      </MenuItem>
                      <MenuItem value="urgent">
                        <Chip label="Urgent" color="error" size="small" sx={{ mr: 1, fontSize: '0.7rem' }} />
                        Urgent Priority
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </Box>

              {/* Image Upload */}
              <Box>
                <Typography variant="subtitle1" fontWeight="600" gutterBottom sx={{ fontSize: '0.9rem', mb: 1.5 }}>
                  🖼️ Image Attachment
                </Typography>
                <ImageUploadArea
                  onImageSelect={handleImageSelect}
                  selectedImage={imagePreview}
                  onImageRemove={handleImageRemove}
                />
              </Box>
            </Stack>
          </Grid>

          {/* Preview Section */}
          <AnimatePresence>
            {showPreview && (
              <Grid item xs={12} lg={6}>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Box>
                    <Typography variant="subtitle1" fontWeight="600" gutterBottom sx={{ fontSize: '0.9rem', mb: 1.5 }}>
                      👀 Live Preview
                    </Typography>
                    <NotificationPreview
                      subject={formData.subject}
                      body={formData.body}
                      url={formData.url}
                      pushTime={formData.pushTime}
                      image={imagePreview}
                    />
                  </Box>
                </motion.div>
              </Grid>
            )}
          </AnimatePresence>
        </Grid>
      </DialogContent>

      {/* Footer Actions */}
      <DialogActions
        sx={{
          p: 2,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          background: alpha(theme.palette.grey[50], 0.8),
        }}
      >
        <Button
          variant="outlined"
          startIcon={<Preview />}
          onClick={() => setShowPreview(!showPreview)}
          size="small"
          sx={{ borderRadius: 1.5 }}
        >
          {showPreview ? "Hide Preview" : "Show Preview"}
        </Button>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button 
            onClick={handleClose} 
            variant="outlined" 
            disabled={loading}
            size="small"
            sx={{ borderRadius: 1.5, minWidth: 80 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.subject || !formData.body}
            startIcon={loading ? <CircularProgress size={16} /> : <Send />}
            size="small"
            sx={{
              borderRadius: 1.5,
              minWidth: 120,
              bgcolor: "#8d0638ff",
              fontWeight: "600",
              "&:hover": {
                bgcolor: "#6d0430ff",
              },
            }}
          >
            {loading ? "Sending..." : "Send"}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  )
}

export default AddNotification