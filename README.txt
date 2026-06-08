CONTROL DE ASISTENCIA BIG - Versión Firebase lista

Esta versión ya incluye:
- Login real con Firebase Authentication.
- Panel administrador.
- Registro de perfiles de maestros dentro de la app.
- Asignación de grupos a maestros.
- QR dinámico por sesión/clase.
- Registro de alumnos desde iPhone/iPad/Android al leer el QR.
- Reportes y exportación CSV.
- Listas integradas del archivo LISTAS MAYO-AGOSTO 2026.xlsx.
- Grupos configurados: 3-A, 3-B, 3-C, 3-D, 3-E, 3-F.
- Alumnos integrados desde el archivo: 93.

PASOS PARA SUBIR A GITHUB
1. Descomprime este ZIP.
2. Sube todos los archivos al repositorio control-asistencia-big.
3. Espera que GitHub Pages actualice.
4. Abre: https://chavezeduant-ui.github.io/control-asistencia-big/

PRIMER ADMINISTRADOR
1. En Firebase Authentication, crea un usuario para ti.
2. Abre la app e inicia sesión con ese correo y contraseña.
3. Si no existe ningún administrador, la app mostrará "Activar administrador".
4. Presiona activar. La app cargará grupos y alumnos automáticamente.

MAESTROS
1. Crea el correo del maestro en Firebase Authentication > Users.
2. Entra a la app como administrador.
3. Ve a Maestros.
4. Agrega el perfil con el mismo correo y asigna grupos.
5. El maestro inicia sesión con su correo y contraseña.

IMPORTANTE SOBRE FIREBASE
Para pruebas, Firestore puede estar en modo prueba. Para producción usa reglas seguras.

REGLAS BÁSICAS RECOMENDADAS PARA PRUEBA CON LOGIN:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}

NOTA: La app usa inicio anónimo para que estudiantes registren asistencia al abrir el QR sin crear cuenta.
Si activas reglas más estrictas, también habilita Authentication > Sign-in method > Anonymous.

ACTUALIZACIÓN SOLICITADA
- En Sesiones / QR ahora se captura la hora de inicio de clase.
- La hora de inicio se usa para determinar Asistencia o Retardo según los minutos de tolerancia.
- El CSV de asistencia exporta únicamente: fecha, grupo, nombre y hora_de_llegada.
- En Maestros > Grupos asignados se agregó la opción "Todos los grupos / todos los estudiantes".
