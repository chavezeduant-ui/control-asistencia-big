CONTROL DE ASISTENCIA BIG - APP WEB PWA

Características:
- Para 6 grupos. Se integraron las listas reales del archivo LISTAS MAYO-AGOSTO 2026.xlsx.
- Varios maestros con grupos asignados.
- El maestro genera un QR dinámico por sesión.
- Los estudiantes escanean el QR con iPhone, iPad o Android y registran asistencia.
- Registra hora, grupo, materia, maestro y estado: Asistencia o Retardo.
- Exporta reportes CSV, que se pueden abrir en Excel.
- Genera credenciales QR permanentes para alumnos.
- Listas integradas: 3-A, 3-B y 3-C. Los grupos 4, 5 y 6 quedan disponibles para capturar o importar más adelante.
- Compatible con GitHub Pages, Netlify o Vercel usando HTTPS.

IMPORTANTE:
Para que varios estudiantes registren asistencia desde sus celulares y el maestro vea los datos en tiempo real, debes configurar Firebase/Firestore en el archivo config.js.
Sin Firebase, la app funciona en modo local/demostración en un solo dispositivo.

PUBLICACIÓN RECOMENDADA:
1. Crea una cuenta en GitHub.
2. Crea un repositorio llamado control-asistencia-big.
3. Sube todos estos archivos.
4. Activa GitHub Pages desde Settings > Pages.
5. Abre el enlace HTTPS que genere GitHub.
6. En iPhone/iPad, abre el enlace en Safari y usa Compartir > Agregar a pantalla de inicio.

CONFIGURAR FIREBASE:
1. Entra a https://firebase.google.com/
2. Crea un proyecto nuevo.
3. Agrega una app web.
4. Copia la configuración que inicia con apiKey.
5. Pégala en config.js sustituyendo window.FIREBASE_CONFIG = null;
6. Activa Firestore Database en modo prueba para iniciar.

SEGURIDAD:
Esta es una versión inicial. Para uso institucional formal conviene agregar:
- inicio de sesión con contraseña,
- reglas de seguridad de Firestore,
- perfiles de administrador y maestros autenticados,
- respaldo automático.


LISTAS INTEGRADAS:
3-A: 29 alumnos
3-B: 31 alumnos
3-C: 33 alumnos
Total integrado: 93 alumnos.

NOTA: En la lista 3-A aparece una matrícula repetida en dos registros. La app permite registrar asistencia considerando matrícula + nombre para evitar bloqueo por duplicado.
