# Bootstrap S3 (opcional — no requerido)

El flujo actual del proyecto usa **estado local** (`terraform.tfstate` en `environments/qa` o `environments/prod`).

Solo usa esta carpeta `bootstrap/` si tu equipo quiere estado remoto en S3. Para laboratorios universitarios que cambian de cuenta AWS, **estado local es más simple**.

Ver `MANUAL-DESPLIEGUE-EC2.example.md` en la raíz (copia local como `MANUAL-DESPLIEGUE-EC2.md`; no se sube al repo).
