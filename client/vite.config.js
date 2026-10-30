
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: ['ec2-13-233-120-45.ap-south-1.compute.amazonaws.com']
  }
})
