# Logs de Backup Automático

Esta carpeta contiene los logs del sistema de backup automático a GitHub.

## Archivos

- `backup.log` - Registro de backups exitosos
- `backup-error.log` - Registro de errores durante el backup

## Funcionamiento

El sistema hace backup automático **todos los días a las 11:55 PM**.

Si hay cambios en el código durante el día, automáticamente se guardan en GitHub con el mensaje:
```
Auto-backup: Cambios del día - [fecha y hora]
```

## Gestión

Para ver el estado del backup automático:
```bash
launchctl list | grep com.ule.backup
```

Para desactivar:
```bash
launchctl unload ~/Library/LaunchAgents/com.ule.backup.plist
```

Para reactivar:
```bash
launchctl load ~/Library/LaunchAgents/com.ule.backup.plist
```

Para ejecutar manualmente:
```bash
./scripts/auto-backup-github.sh
```
