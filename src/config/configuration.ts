export default () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
  firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
  googleGenaiApiKey: process.env.GOOGLE_GENAI_API_KEY,
});
