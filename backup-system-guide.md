# SkillNavigator Backup System Guide

## ✅ Complete Backup System Implemented

Your SkillNavigator workspace now has a comprehensive backup and restore system with automated scheduling capabilities.

## 🗂️ Backup Components

### 1. **Backup Script** (`08-automation/scripts/backup-workspace.sh`)
- **Full workspace backup** including all directories and files
- **Notion data export** (JSON format for manual restoration)
- **Git history preservation** using Git bundles
- **Automatic compression** with tar.gz format
- **Retention management** (configurable cleanup policies)
- **Metadata tracking** for backup details

### 2. **Restore Script** (`08-automation/scripts/restore-workspace.sh`)
- **Complete workspace restoration** from backup archives
- **Selective restoration** options (skip Git, Notion, dependencies)
- **Backup validation** before restoration
- **Interactive confirmation** for safety
- **Post-restore setup** (dependencies, permissions, .env creation)

### 3. **Backup Scheduler** (`08-automation/scripts/schedule-backups.sh`)
- **Automated scheduling** using cron
- **Multiple schedule options** (daily, weekly, hourly, custom)
- **Interactive menu** for easy configuration
- **Log management** and monitoring
- **Test functionality** for validation

## 🚀 Quick Start Usage

### Manual Backup
```bash
# Full backup
./08-automation/scripts/backup-workspace.sh

# Skip Notion backup
./08-automation/scripts/backup-workspace.sh --no-notion

# Custom retention (60 days, max 20 backups)
./08-automation/scripts/backup-workspace.sh -d 60 -c 20
```

### Restore from Backup
```bash
# List available backups
./08-automation/scripts/restore-workspace.sh --list

# Restore latest backup
./08-automation/scripts/restore-workspace.sh latest

# Restore specific backup
./08-automation/scripts/restore-workspace.sh 20250909_154440

# Restore to custom location
./08-automation/scripts/restore-workspace.sh -t /tmp/restore latest
```

### Setup Automated Backups
```bash
# Interactive menu
./08-automation/scripts/schedule-backups.sh

# Quick setups
./08-automation/scripts/schedule-backups.sh daily
./08-automation/scripts/schedule-backups.sh weekly
./08-automation/scripts/schedule-backups.sh custom "0 */6 * * *" "Every 6 hours"
```

## 📋 Backup Contents

Each backup includes:

### ✅ **Workspace Files**
- All project directories (01-strategy through 08-automation)
- Configuration files (project-config.yaml, .env.example)
- Documentation files (*.md)
- Scripts and automation tools

### ✅ **Git History** 
- Complete repository bundle
- Branch information
- Recent commit history
- Current status snapshot

### ✅ **Notion Data**
- Database exports in JSON format
- All pages and entries
- Metadata and properties
- ⚠️ *Requires manual restoration to Notion*

### ✅ **Metadata**
- Backup timestamp and system info
- Content inventory
- File counts and sizes
- Restoration instructions

## 🗄️ Backup Storage

- **Location**: `~/.skillnavigator-backups/`
- **Format**: `skillnavigator_backup_YYYYMMDD_HHMMSS.tar.gz`
- **Latest symlink**: `latest_backup.tar.gz`
- **Logs**: `backup.log` (for scheduled backups)

## ⚙️ Configuration Options

### Backup Script Options
- `--no-notion` - Skip Notion data backup
- `--no-git` - Skip Git history backup  
- `--no-cleanup` - Skip old backup cleanup
- `-k, --keep-uncompressed` - Keep uncompressed backup
- `-d, --days DAYS` - Retention days (default: 30)
- `-c, --count COUNT` - Max backup count (default: 10)

### Restore Script Options
- `-t, --target PATH` - Custom restore location
- `-b, --backup-current` - Backup current workspace first
- `--no-deps` - Skip dependency installation
- `--no-git` - Skip Git restoration
- `--no-notion` - Skip Notion data

### Environment Variables
```bash
BACKUP_RETENTION_DAYS=30    # Days to keep backups
BACKUP_RETENTION_COUNT=10   # Max number of backups
KEEP_UNCOMPRESSED=false     # Keep uncompressed directories
```

## 🛡️ Security & Best Practices

### ✅ **What's Protected**
- `.env` files are excluded from backups (only .env.example included)
- Sensitive data is not logged or exposed
- Backups are compressed and timestamped
- Automatic cleanup prevents disk space issues

### ✅ **Recommended Schedule**
- **Development**: Daily backups at 2:00 AM
- **Production**: Twice daily (2:00 AM and 2:00 PM)
- **Critical**: Hourly during active development

### ✅ **Monitoring**
```bash
# Check backup status
./08-automation/scripts/schedule-backups.sh status

# View recent logs
./08-automation/scripts/schedule-backups.sh logs 50

# Test backup system
./08-automation/scripts/schedule-backups.sh test
```

## 🧪 Tested Features

✅ **Backup Creation** - Successfully creates compressed archives  
✅ **File Preservation** - All workspace files properly backed up  
✅ **Git History** - Repository bundle created and functional  
✅ **Metadata Generation** - Complete backup information stored  
✅ **Compression** - tar.gz archives with size optimization  
✅ **Retention Management** - Automatic cleanup of old backups  
✅ **Restore Listing** - Available backups properly displayed  
✅ **Schedule Management** - Cron integration functional  

## 🔧 Troubleshooting

### Backup Issues
- **Permission errors**: Ensure scripts are executable (`chmod +x`)
- **Disk space**: Check available space in `~/.skillnavigator-backups/`
- **Node.js modules**: Run `npm install` if Notion backup fails

### Restore Issues  
- **Archive corruption**: Validate with `tar -tzf backup.tar.gz`
- **Permission issues**: Run restore with appropriate user permissions
- **Missing dependencies**: Use `--no-deps` flag if needed

### Scheduling Issues
- **Cron not working**: Check `crontab -l` and system cron service
- **Log file access**: Ensure `~/.skillnavigator-backups/` is writable
- **Path issues**: Use absolute paths in cron entries

## 🎯 Next Steps

1. **Set up automated backups**: `./08-automation/scripts/schedule-backups.sh daily`
2. **Test restoration process**: Create a test backup and restore to verify
3. **Monitor backup logs**: Check regularly for any issues
4. **Document your Notion setup**: Since Notion data needs manual restoration

Your SkillNavigator workspace is now fully protected with enterprise-grade backup and restore capabilities!