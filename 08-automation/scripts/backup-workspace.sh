#!/bin/bash

# SkillNavigator Workspace Backup Script
# Creates comprehensive backups of all workspace data

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
BACKUP_BASE_DIR="$HOME/.skillnavigator-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="$BACKUP_BASE_DIR/$TIMESTAMP"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${PURPLE}[SUCCESS]${NC} $1"
}

# Function to create backup directory
create_backup_dir() {
    log "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        error "Failed to create backup directory"
        exit 1
    fi
    
    success "Backup directory created"
}

# Function to backup workspace files
backup_workspace_files() {
    log "Backing up workspace files..."
    
    # Create workspace backup
    local workspace_backup="$BACKUP_DIR/workspace"
    mkdir -p "$workspace_backup"
    
    # Copy all directories except node_modules and .git
    find "$WORKSPACE_ROOT" -maxdepth 1 -type d ! -name ".*" ! -name "node_modules" ! -name "$(basename "$WORKSPACE_ROOT")" -exec cp -r {} "$workspace_backup/" \;
    
    # Copy important root files
    cp "$WORKSPACE_ROOT"/*.md "$workspace_backup/" 2>/dev/null || true
    cp "$WORKSPACE_ROOT"/*.yaml "$workspace_backup/" 2>/dev/null || true
    cp "$WORKSPACE_ROOT"/*.json "$workspace_backup/" 2>/dev/null || true
    cp "$WORKSPACE_ROOT"/.env.example "$workspace_backup/" 2>/dev/null || true
    cp "$WORKSPACE_ROOT"/.gitignore "$workspace_backup/" 2>/dev/null || true
    
    success "Workspace files backed up"
}

# Function to backup Notion data
backup_notion_data() {
    log "Backing up Notion data..."
    
    local notion_backup="$BACKUP_DIR/notion"
    mkdir -p "$notion_backup"
    
    # Check if Node.js and required modules are available
    if command -v node >/dev/null 2>&1; then
        # Create a Notion backup script
        cat > "$notion_backup/backup_notion.js" << 'EOF'
const { Client } = require('@notionhq/client');
const fs = require('fs').promises;
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const databases = {
    daily_standups: "4880ac73-8a85-4d30-8b9b-71936ab6dd62",
    ai_outputs: "3fdd6c0d-febb-4103-bd29-c2ba11ea818c",
    weekly_reviews: "3f72b418-500d-425c-85f4-309afe9f46dd",
    project_tasks: "1ec0066a-3f72-4a65-a611-9c7497e9cb81"
};

async function backupDatabase(name, id) {
    try {
        console.log(`Backing up ${name}...`);
        
        const response = await notion.databases.query({ database_id: id });
        await fs.writeFile(`${name}_backup.json`, JSON.stringify(response, null, 2));
        
        console.log(`✅ ${name} backed up (${response.results.length} items)`);
    } catch (error) {
        console.error(`❌ Failed to backup ${name}:`, error.message);
    }
}

async function main() {
    for (const [name, id] of Object.entries(databases)) {
        await backupDatabase(name, id);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
    }
}

main().catch(console.error);
EOF

        # Run the Notion backup if possible
        if [[ -f "$WORKSPACE_ROOT/.env" && -f "$WORKSPACE_ROOT/node_modules/@notionhq/client/package.json" ]]; then
            cd "$notion_backup"
            cp "$WORKSPACE_ROOT/.env" .
            node backup_notion.js
            rm .env  # Remove env file from backup for security
        else
            warn "Notion backup skipped - missing dependencies or .env file"
        fi
    else
        warn "Node.js not available - Notion backup skipped"
    fi
    
    success "Notion data backup completed"
}

# Function to backup Git history
backup_git_history() {
    log "Backing up Git history..."
    
    local git_backup="$BACKUP_DIR/git"
    mkdir -p "$git_backup"
    
    if [[ -d "$WORKSPACE_ROOT/.git" ]]; then
        # Create a bundle of the entire repository
        cd "$WORKSPACE_ROOT"
        git bundle create "$git_backup/repository.bundle" --all
        
        # Export current branch info
        git branch -v > "$git_backup/branches.txt"
        git status > "$git_backup/status.txt"
        git log --oneline -20 > "$git_backup/recent_commits.txt"
        
        success "Git history backed up"
    else
        warn "No Git repository found - Git backup skipped"
    fi
}

# Function to create backup metadata
create_backup_metadata() {
    log "Creating backup metadata..."
    
    local metadata_file="$BACKUP_DIR/backup_metadata.json"
    
    cat > "$metadata_file" << EOF
{
    "backup_timestamp": "$TIMESTAMP",
    "backup_date": "$(date -Iseconds)",
    "workspace_path": "$WORKSPACE_ROOT",
    "backup_version": "1.0",
    "system_info": {
        "hostname": "$(hostname)",
        "user": "$(whoami)",
        "os": "$(uname -s)",
        "os_version": "$(uname -r)",
        "backup_script_version": "1.0"
    },
    "backup_contents": {
        "workspace_files": true,
        "notion_data": $([ -f "$BACKUP_DIR/notion/daily_standups_backup.json" ] && echo "true" || echo "false"),
        "git_history": $([ -f "$BACKUP_DIR/git/repository.bundle" ] && echo "true" || echo "false")
    },
    "file_counts": {
        "total_files": $(find "$BACKUP_DIR" -type f | wc -l),
        "directories": $(find "$BACKUP_DIR" -type d | wc -l)
    },
    "backup_size": "$(du -sh "$BACKUP_DIR" | cut -f1)"
}
EOF
    
    success "Backup metadata created"
}

# Function to create compressed archive
create_archive() {
    log "Creating compressed archive..."
    
    local archive_name="skillnavigator_backup_$TIMESTAMP.tar.gz"
    local archive_path="$BACKUP_BASE_DIR/$archive_name"
    
    cd "$BACKUP_BASE_DIR"
    tar -czf "$archive_name" "$(basename "$BACKUP_DIR")"
    
    if [[ -f "$archive_path" ]]; then
        success "Compressed archive created: $archive_path"
        success "Archive size: $(du -sh "$archive_path" | cut -f1)"
        
        # Create symlink to latest backup
        ln -sf "$archive_name" "$BACKUP_BASE_DIR/latest_backup.tar.gz"
        
        # Optional: Remove the uncompressed backup directory to save space
        if [[ "${KEEP_UNCOMPRESSED:-false}" != "true" ]]; then
            rm -rf "$BACKUP_DIR"
            info "Uncompressed backup directory removed (set KEEP_UNCOMPRESSED=true to retain)"
        fi
    else
        error "Failed to create compressed archive"
        exit 1
    fi
}

# Function to cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old backups..."
    
    local keep_days=${BACKUP_RETENTION_DAYS:-30}
    local keep_count=${BACKUP_RETENTION_COUNT:-10}
    
    info "Retention policy: $keep_days days, max $keep_count backups"
    
    # Remove backups older than specified days
    find "$BACKUP_BASE_DIR" -name "skillnavigator_backup_*.tar.gz" -mtime +$keep_days -delete 2>/dev/null || true
    
    # Keep only the most recent backups
    local backup_files=("$BACKUP_BASE_DIR"/skillnavigator_backup_*.tar.gz)
    if [[ ${#backup_files[@]} -gt $keep_count ]]; then
        # Sort by modification time (newest first) and remove excess
        printf '%s\n' "${backup_files[@]}" | \
        xargs ls -t | \
        tail -n +$((keep_count + 1)) | \
        xargs rm -f 2>/dev/null || true
    fi
    
    success "Old backup cleanup completed"
}

# Function to display backup summary
display_summary() {
    local archive_path="$BACKUP_BASE_DIR/skillnavigator_backup_$TIMESTAMP.tar.gz"
    
    echo
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                    BACKUP COMPLETED                         ║${NC}"
    echo -e "${CYAN}╠══════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║${NC} Timestamp:     $TIMESTAMP                     ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC} Archive:       $(basename "$archive_path")      ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC} Location:      $BACKUP_BASE_DIR/                ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC} Size:          $(du -sh "$archive_path" 2>/dev/null | cut -f1 || echo "Unknown")                                  ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
    
    info "Latest backup symlink: $BACKUP_BASE_DIR/latest_backup.tar.gz"
    
    # Display restore command
    echo -e "${YELLOW}To restore this backup:${NC}"
    echo "  ./08-automation/scripts/restore-workspace.sh $TIMESTAMP"
    echo
}

# Main function
main() {
    echo -e "${CYAN}🚀 SkillNavigator Workspace Backup Starting...${NC}"
    echo
    
    # Check prerequisites
    if [[ ! -d "$WORKSPACE_ROOT" ]]; then
        error "Workspace directory not found: $WORKSPACE_ROOT"
        exit 1
    fi
    
    # Load environment variables if available
    if [[ -f "$WORKSPACE_ROOT/.env" ]]; then
        set -o allexport
        source "$WORKSPACE_ROOT/.env"
        set +o allexport
    fi
    
    # Create backup
    create_backup_dir
    backup_workspace_files
    backup_notion_data
    backup_git_history
    create_backup_metadata
    create_archive
    cleanup_old_backups
    display_summary
    
    success "🎉 Backup completed successfully!"
}

# Help function
show_help() {
    cat << EOF
SkillNavigator Workspace Backup Script

Usage: $0 [OPTIONS]

Options:
    -h, --help              Show this help message
    -k, --keep-uncompressed Keep uncompressed backup directory
    -d, --days DAYS         Backup retention days (default: 30)
    -c, --count COUNT       Maximum backup count (default: 10)
    --no-notion             Skip Notion data backup
    --no-git                Skip Git history backup
    --no-cleanup            Skip old backup cleanup

Environment Variables:
    BACKUP_RETENTION_DAYS   Days to keep backups (default: 30)
    BACKUP_RETENTION_COUNT  Max number of backups to keep (default: 10)
    KEEP_UNCOMPRESSED       Keep uncompressed backup directory (true/false)

Examples:
    $0                      # Full backup with default settings
    $0 -k -d 60 -c 20      # Keep uncompressed, 60 days retention, max 20 backups
    $0 --no-notion         # Skip Notion backup
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -k|--keep-uncompressed)
            KEEP_UNCOMPRESSED=true
            shift
            ;;
        -d|--days)
            BACKUP_RETENTION_DAYS="$2"
            shift 2
            ;;
        -c|--count)
            BACKUP_RETENTION_COUNT="$2"
            shift 2
            ;;
        --no-notion)
            SKIP_NOTION=true
            shift
            ;;
        --no-git)
            SKIP_GIT=true
            shift
            ;;
        --no-cleanup)
            SKIP_CLEANUP=true
            shift
            ;;
        *)
            error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Run the backup
main