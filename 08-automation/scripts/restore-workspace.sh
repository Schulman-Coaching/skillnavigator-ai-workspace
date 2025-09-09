#!/bin/bash

# SkillNavigator Workspace Restore Script
# Restores workspace from backup archives

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
BACKUP_BASE_DIR="$HOME/.skillnavigator-backups"
RESTORE_TIMESTAMP=""
RESTORE_TARGET=""

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

# Function to list available backups
list_backups() {
    echo -e "${CYAN}📋 Available Backups:${NC}"
    echo
    
    if [[ ! -d "$BACKUP_BASE_DIR" ]]; then
        warn "No backup directory found at: $BACKUP_BASE_DIR"
        return 1
    fi
    
    local backups=($(find "$BACKUP_BASE_DIR" -name "skillnavigator_backup_*.tar.gz" -exec basename {} \; | sort -r))
    
    if [[ ${#backups[@]} -eq 0 ]]; then
        warn "No backups found in: $BACKUP_BASE_DIR"
        return 1
    fi
    
    echo -e "${BLUE}Timestamp        Date/Time           Size${NC}"
    echo "================================================"
    
    for backup in "${backups[@]}"; do
        local timestamp=$(echo "$backup" | sed 's/skillnavigator_backup_\(.*\)\.tar\.gz/\1/')
        local filepath="$BACKUP_BASE_DIR/$backup"
        local size=$(du -sh "$filepath" 2>/dev/null | cut -f1)
        local date_formatted=""
        
        # Parse timestamp to readable date
        if [[ $timestamp =~ ^([0-9]{8})_([0-9]{6})$ ]]; then
            local date_part="${BASH_REMATCH[1]}"
            local time_part="${BASH_REMATCH[2]}"
            date_formatted=$(date -j -f "%Y%m%d_%H%M%S" "$timestamp" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "Invalid date")
        fi
        
        printf "%-16s %-19s %s\n" "$timestamp" "$date_formatted" "$size"
    done
    
    echo
    info "Latest backup: $BACKUP_BASE_DIR/latest_backup.tar.gz"
}

# Function to validate backup archive
validate_backup() {
    local archive_path="$1"
    
    log "Validating backup archive: $(basename "$archive_path")"
    
    if [[ ! -f "$archive_path" ]]; then
        error "Backup archive not found: $archive_path"
        return 1
    fi
    
    # Test archive integrity
    if ! tar -tzf "$archive_path" >/dev/null 2>&1; then
        error "Backup archive is corrupted or invalid"
        return 1
    fi
    
    # Check for required components
    local has_metadata=$(tar -tzf "$archive_path" | grep -c "backup_metadata.json" || echo "0")
    local has_workspace=$(tar -tzf "$archive_path" | grep -c "workspace/" || echo "0")
    
    if [[ $has_metadata -eq 0 ]]; then
        warn "Backup metadata not found - may be an older backup format"
    fi
    
    if [[ $has_workspace -eq 0 ]]; then
        error "Workspace data not found in backup"
        return 1
    fi
    
    success "Backup archive validation passed"
    return 0
}

# Function to extract backup
extract_backup() {
    local archive_path="$1"
    local extract_dir="$2"
    
    log "Extracting backup to: $extract_dir"
    
    mkdir -p "$extract_dir"
    
    if ! tar -xzf "$archive_path" -C "$extract_dir" --strip-components=1; then
        error "Failed to extract backup archive"
        return 1
    fi
    
    success "Backup extracted successfully"
}

# Function to display backup metadata
show_backup_metadata() {
    local metadata_file="$1"
    
    if [[ ! -f "$metadata_file" ]]; then
        warn "Backup metadata not found"
        return 1
    fi
    
    log "Backup Information:"
    
    # Parse JSON metadata (basic parsing without jq dependency)
    local backup_date=$(grep '"backup_date"' "$metadata_file" | sed 's/.*"backup_date": "\([^"]*\)".*/\1/')
    local workspace_path=$(grep '"workspace_path"' "$metadata_file" | sed 's/.*"workspace_path": "\([^"]*\)".*/\1/')
    local backup_size=$(grep '"backup_size"' "$metadata_file" | sed 's/.*"backup_size": "\([^"]*\)".*/\1/')
    
    echo "  - Date: $backup_date"
    echo "  - Original Path: $workspace_path"
    echo "  - Size: $backup_size"
    
    # Show backup contents
    local has_notion=$(grep '"notion_data": true' "$metadata_file" >/dev/null && echo "✅" || echo "❌")
    local has_git=$(grep '"git_history": true' "$metadata_file" >/dev/null && echo "✅" || echo "❌")
    
    echo "  - Notion Data: $has_notion"
    echo "  - Git History: $has_git"
}

# Function to backup current workspace
backup_current_workspace() {
    log "Creating backup of current workspace before restore..."
    
    local current_backup="$BACKUP_BASE_DIR/pre_restore_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$current_backup"
    
    if [[ -d "$WORKSPACE_ROOT" ]]; then
        cp -r "$WORKSPACE_ROOT" "$current_backup/"
        success "Current workspace backed up to: $current_backup"
    else
        warn "Current workspace not found - skipping backup"
    fi
}

# Function to restore workspace files
restore_workspace_files() {
    local backup_dir="$1"
    local workspace_backup="$backup_dir/workspace"
    
    log "Restoring workspace files..."
    
    if [[ ! -d "$workspace_backup" ]]; then
        error "Workspace backup not found in: $backup_dir"
        return 1
    fi
    
    # Create target directory
    mkdir -p "$RESTORE_TARGET"
    
    # Copy workspace files
    cp -r "$workspace_backup"/* "$RESTORE_TARGET/"
    
    # Restore .env.example if it exists
    if [[ -f "$workspace_backup/.env.example" ]]; then
        cp "$workspace_backup/.env.example" "$RESTORE_TARGET/"
    fi
    
    success "Workspace files restored"
}

# Function to restore Git history
restore_git_history() {
    local backup_dir="$1"
    local git_backup="$backup_dir/git"
    
    if [[ ! -d "$git_backup" ]]; then
        warn "Git backup not found - skipping Git restoration"
        return 0
    fi
    
    log "Restoring Git history..."
    
    cd "$RESTORE_TARGET"
    
    if [[ -f "$git_backup/repository.bundle" ]]; then
        # Initialize new git repository and restore from bundle
        git init
        git remote add origin "$git_backup/repository.bundle"
        git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || warn "Could not pull from bundle"
        
        success "Git history restored"
    else
        warn "Git bundle not found - Git history not restored"
    fi
    
    # Display branch information if available
    if [[ -f "$git_backup/branches.txt" ]]; then
        info "Original branch information:"
        cat "$git_backup/branches.txt"
    fi
}

# Function to restore Notion data
restore_notion_data() {
    local backup_dir="$1"
    local notion_backup="$backup_dir/notion"
    
    if [[ ! -d "$notion_backup" ]]; then
        warn "Notion backup not found - skipping Notion restoration"
        return 0
    fi
    
    log "Notion backup found..."
    
    # Check for backup files
    local backup_files=($(find "$notion_backup" -name "*_backup.json" 2>/dev/null))
    
    if [[ ${#backup_files[@]} -gt 0 ]]; then
        info "Found Notion backup files:"
        for file in "${backup_files[@]}"; do
            local filename=$(basename "$file")
            local count=$(grep -o '"object": "page"' "$file" | wc -l)
            echo "  - $filename ($count items)"
        done
        
        # Copy Notion backups to restore location
        mkdir -p "$RESTORE_TARGET/restored-notion-data"
        cp -r "$notion_backup"/* "$RESTORE_TARGET/restored-notion-data/"
        
        success "Notion data copied to restored-notion-data/"
        warn "Note: Notion data must be manually imported back to Notion workspace"
    else
        warn "No Notion backup files found"
    fi
}

# Function to post-restore setup
post_restore_setup() {
    log "Running post-restore setup..."
    
    cd "$RESTORE_TARGET"
    
    # Install dependencies if package.json exists
    if [[ -f "package.json" ]]; then
        info "Installing Node.js dependencies..."
        npm install >/dev/null 2>&1 && success "Dependencies installed" || warn "Failed to install dependencies"
    fi
    
    # Make scripts executable
    if [[ -d "08-automation/scripts" ]]; then
        find "08-automation/scripts" -name "*.sh" -exec chmod +x {} \;
        success "Scripts made executable"
    fi
    
    # Create .env file from template if it doesn't exist
    if [[ ! -f ".env" && -f ".env.example" ]]; then
        cp ".env.example" ".env"
        warn "Created .env from template - please update with your actual values"
    fi
    
    success "Post-restore setup completed"
}

# Function to display restoration summary
display_restore_summary() {
    echo
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                   RESTORE COMPLETED                         ║${NC}"
    echo -e "${CYAN}╠══════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║${NC} Restored from: $RESTORE_TIMESTAMP                   ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC} Target:        $RESTORE_TARGET          ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
    
    info "Next steps:"
    echo "  1. Review restored files in: $RESTORE_TARGET"
    echo "  2. Update .env file with your actual API keys"
    echo "  3. Check and update Notion integration settings"
    echo "  4. Test the restored workspace functionality"
    echo
    
    if [[ -d "$RESTORE_TARGET/restored-notion-data" ]]; then
        warn "Notion data was backed up but needs manual restoration to Notion workspace"
    fi
}

# Main restore function
restore_backup() {
    local archive_path="$1"
    local temp_extract_dir="/tmp/skillnavigator_restore_$$"
    
    echo -e "${CYAN}🔄 Starting workspace restoration...${NC}"
    echo
    
    # Validate backup
    if ! validate_backup "$archive_path"; then
        exit 1
    fi
    
    # Extract backup to temporary directory
    if ! extract_backup "$archive_path" "$temp_extract_dir"; then
        exit 1
    fi
    
    # Show backup information
    show_backup_metadata "$temp_extract_dir/backup_metadata.json"
    
    # Backup current workspace if it exists
    if [[ "$BACKUP_CURRENT" == "true" ]] && [[ -d "$RESTORE_TARGET" ]]; then
        backup_current_workspace
    fi
    
    # Restore components
    restore_workspace_files "$temp_extract_dir"
    restore_git_history "$temp_extract_dir"
    restore_notion_data "$temp_extract_dir"
    post_restore_setup
    
    # Cleanup temporary directory
    rm -rf "$temp_extract_dir"
    
    display_restore_summary
    success "🎉 Workspace restoration completed!"
}

# Help function
show_help() {
    cat << EOF
SkillNavigator Workspace Restore Script

Usage: $0 [OPTIONS] [TIMESTAMP]

Arguments:
    TIMESTAMP               Backup timestamp to restore (format: YYYYMMDD_HHMMSS)
                           Use 'latest' to restore the most recent backup
                           Leave empty to list available backups

Options:
    -h, --help             Show this help message
    -l, --list             List available backups
    -t, --target PATH      Specify restore target directory (default: current workspace)
    -b, --backup-current   Backup current workspace before restore
    --no-deps              Skip dependency installation
    --no-git               Skip Git history restoration
    --no-notion            Skip Notion data restoration

Examples:
    $0                     # List available backups
    $0 -l                  # List available backups
    $0 latest              # Restore latest backup
    $0 20240909_143022     # Restore specific backup
    $0 -t /tmp/restore latest  # Restore to specific directory
    $0 -b latest           # Backup current workspace before restoring
EOF
}

# Parse command line arguments
BACKUP_CURRENT=false
SKIP_DEPS=false
SKIP_GIT=false
SKIP_NOTION=false
RESTORE_TARGET="$WORKSPACE_ROOT"

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -l|--list)
            list_backups
            exit 0
            ;;
        -t|--target)
            RESTORE_TARGET="$2"
            shift 2
            ;;
        -b|--backup-current)
            BACKUP_CURRENT=true
            shift
            ;;
        --no-deps)
            SKIP_DEPS=true
            shift
            ;;
        --no-git)
            SKIP_GIT=true
            shift
            ;;
        --no-notion)
            SKIP_NOTION=true
            shift
            ;;
        -*)
            error "Unknown option: $1"
            show_help
            exit 1
            ;;
        *)
            RESTORE_TIMESTAMP="$1"
            shift
            ;;
    esac
done

# Main logic
if [[ -z "$RESTORE_TIMESTAMP" ]]; then
    list_backups
    exit 0
fi

# Handle 'latest' keyword
if [[ "$RESTORE_TIMESTAMP" == "latest" ]]; then
    if [[ -L "$BACKUP_BASE_DIR/latest_backup.tar.gz" ]]; then
        ARCHIVE_PATH="$BACKUP_BASE_DIR/latest_backup.tar.gz"
        RESTORE_TIMESTAMP=$(readlink "$BACKUP_BASE_DIR/latest_backup.tar.gz" | sed 's/skillnavigator_backup_\(.*\)\.tar\.gz/\1/')
    else
        error "Latest backup symlink not found"
        exit 1
    fi
else
    ARCHIVE_PATH="$BACKUP_BASE_DIR/skillnavigator_backup_${RESTORE_TIMESTAMP}.tar.gz"
fi

# Check if archive exists
if [[ ! -f "$ARCHIVE_PATH" ]]; then
    error "Backup archive not found: $ARCHIVE_PATH"
    echo
    info "Available backups:"
    list_backups
    exit 1
fi

# Confirm restoration
echo -e "${YELLOW}⚠️  This will restore workspace to: $RESTORE_TARGET${NC}"
echo -e "${YELLOW}   Backup timestamp: $RESTORE_TIMESTAMP${NC}"
echo

read -p "Continue with restoration? (y/N): " -r
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    info "Restoration cancelled"
    exit 0
fi

# Perform restoration
restore_backup "$ARCHIVE_PATH"