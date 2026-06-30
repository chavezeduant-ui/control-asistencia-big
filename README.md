# SIGE BIG v2 Profesional

Sistema Integral de Gestión Escolar para Bachillerato Integral Guanajuato.

## Publicación
1. Subir todos los archivos a GitHub Pages.
2. Verificar que `config.js` tenga la configuración Firebase.
3. En Firebase activar Authentication con Email/Password y Firestore.
4. En Authentication > Settings > Authorized domains agregar `chavezeduant-ui.github.io`.

## Primer ingreso
Si no existe administrador, la plataforma muestra el asistente para crear el administrador principal.

## Módulos incluidos
- Login con Firebase Authentication.
- Roles: administrador, teacher, parent, student, school.
- Administración: alumnos, profesores y grupos.
- Asistencia con QR dinámico.
- Registro manual.
- Reporte diario y acumulado.
- Exportación CSV/PDF.
- Calificaciones.
- Observaciones.
- Portal familiar.

## Nota de seguridad
Para producción, ajusta las reglas de Firestore para permitir escritura solo a usuarios autenticados y por rol.
