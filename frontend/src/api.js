import axios from 'axios'

const BASE = 'https://smart-grid-ids.onrender.com'

const api = axios.create({
  baseURL: BASE,
  timeout: 30000,
})

// Check if backend is running
export const checkHealth = async () => {
  const res = await api.get('/')
  return res.data
}

// Get list of all 41 feature names
export const getFeatures = async () => {
  const res = await api.get('/features')
  return res.data
}

// Batch predict from CSV file upload
export const predictCSV = async (file, onProgress) => {
  const form = new FormData()
  form.append('file', file)
  const res = await api.post('/predict/csv', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    }
  })
  return res.data
}

// Single row prediction + SHAP explanation
export const predictExplain = async (features) => {
  const res = await api.post('/predict/explain', { features })
  return res.data
}
