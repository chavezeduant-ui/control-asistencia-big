# SIGE BIG v1 Profesional

Sistema Integral de Gestión Escolar para Bachillerato Integral Guanajuato.

## Incluye
- Inicio de sesión con Firebase Authentication.
- Perfiles: administrador, profesor, padre/tutor, alumno y servicios escolares.
- Gestión de grupos, alumnos y usuarios.
- Asistencia con QR dinámico.
- Registro manual de asistencia.
- Reportes diarios CSV/PDF.
- Reporte acumulado por rango de fechas con A/NA.
- Calificaciones por grupo, materia y periodo.
- Observaciones por estudiante.
- Portal familiar para consultar asistencias, calificaciones y observaciones.
- Instalación como PWA desde iPhone/iPad/Android.

## Puesta en línea
1. Descomprime el ZIP.
2. Sube todos los archivos al repositorio `control-asistencia-big`.
3. Activa GitHub Pages: Settings > Pages > Deploy from branch > main > root.
4. Verifica que `config.js` tenga la configuración de Firebase.
5. En Firebase activa Authentication con Correo/Contraseña.
6. En Firestore deja modo prueba durante pruebas y luego cambia reglas de seguridad.

## Primer ingreso
En la pantalla inicial presiona "Crear administrador inicial" y registra tu correo y contraseña. Ese usuario será administrador.

## Importante
Para crear usuarios maestros/padres con acceso real:
1. Crea el usuario en Firebase Authentication.
2. El usuario inicia sesión una vez.
3. El administrador actualiza su documento en Firestore `usuarios` con rol y grupos.

Esta versión es una base funcional para continuar ampliando seguridad, reglas y módulos.
