// Public Firebase Web app configuration belongs here after creating a Firebase Web app.
// This file is delivered to every visitor. Never put service-account keys or OAuth client secrets here.
export const firebaseConfig = {
  apiKey: "AIzaSyBzq4wgiN8PnWMDDspoBd9i9WBd3FjMADw",
  authDomain: "mock-exam-study-hub.firebaseapp.com",
  projectId: "mock-exam-study-hub",
  appId: "1:14994678019:web:5ca57744894a350f914936"
};

export const googleSignInEnabled = false;
export const isFirebaseConfigured = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId
].every(value => typeof value === "string" && value.length > 0 && !value.startsWith("REPLACE_WITH_"));
