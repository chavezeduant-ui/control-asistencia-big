// Configuración Firebase de Control Asistencia BIG
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyAuIl2pDUm90SjGWAhGXS8Z4kpxWBGOzgE",
  authDomain: "control-asistencia-big.firebaseapp.com",
  projectId: "control-asistencia-big",
  storageBucket: "control-asistencia-big.firebasestorage.app",
  messagingSenderId: "580360757102",
  appId: "1:580360757102:web:16c65b415f195498bc2b7f",
  measurementId: "G-BH33BF7TRC"
};

// Al primer usuario que inicie sesión se le puede activar como administrador desde la app
// si no existe ningún administrador en Firestore.
window.APP_CONFIG = {
  schoolName: "Bachillerato Integral de Guanajuato",
  appName: "Control de Asistencia BIG",
  attendanceWindowMinutes: 10,
  lateWindowMinutes: 20,
  groups: ["3-A","3-B","3-C","3-D","3-E","3-F"]
};
