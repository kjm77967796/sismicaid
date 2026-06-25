# SECURITY_AND_PRIVACY.md

## Reglas críticas

- No exponer contacto privado.
- No exponer direcciones privadas exactas.
- No publicar nombres de víctimas.
- No publicar datos de menores.
- No publicar fotos sin moderación si contienen datos sensibles.
- Eliminar metadatos EXIF de imágenes.
- Sanitizar todo input ciudadano.
- Rate limit en reportes.
- Todo reporte ciudadano entra como `pending`.
- Toda información pública debe indicar fuente y verificación.

## DTO público

Los endpoints públicos deben devolver DTOs seguros, nunca entidades internas completas.

## Reportes ciudadanos

Campos privados:

- `private_contact`
- datos internos de moderación
- IP si se registra
- metadatos de imagen