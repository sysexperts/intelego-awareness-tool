module.exports = {
  port: process.env.PORT || 3000,
  sessionSecret: process.env.SESSION_SECRET || 'intelego-awareness-secret-key-change-in-production',
  
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || ''
    },
    from: process.env.EMAIL_FROM || 'noreply@intelego-awareness.com'
  },
  
  upload: {
    maxFileSize: 50 * 1024 * 1024,
    allowedMimeTypes: ['application/zip', 'application/x-zip-compressed']
  },
  
  database: {
    filename: './data/database.sqlite'
  }
};
