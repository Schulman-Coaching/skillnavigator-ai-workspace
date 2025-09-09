#!/bin/bash

# SkillNavigator Backup Scheduler
# Sets up automated backup scheduling using crontab

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-workspace.sh"
CRON_LOG_FILE="$HOME/.skillnavigator-backups/backup.log"

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

# Function to check if cron job exists
check_existing_cron() {
    local pattern="skillnavigator.*backup"
    
    if crontab -l 2>/dev/null | grep -q "$pattern"; then
        return 0
    else
        return 1
    fi
}

# Function to show current backup schedule
show_current_schedule() {
    echo -e "${CYAN}📅 Current Backup Schedule:${NC}"
    echo
    
    if check_existing_cron; then
        crontab -l 2>/dev/null | grep "skillnavigator.*backup" | while read line; do
            echo "  $line"
        done
    else
        info "No backup schedule currently configured"
    fi
    echo
}

# Function to create backup directory and log file
setup_backup_environment() {
    local backup_dir="$HOME/.skillnavigator-backups"
    
    mkdir -p "$backup_dir"
    touch "$CRON_LOG_FILE"
    
    if [[ ! -f "$BACKUP_SCRIPT" ]]; then
        error "Backup script not found: $BACKUP_SCRIPT"
        exit 1
    fi
    
    if [[ ! -x "$BACKUP_SCRIPT" ]]; then
        chmod +x "$BACKUP_SCRIPT"
    fi
}

# Function to add cron job
add_cron_job() {
    local schedule="$1"
    local description="$2"
    
    log "Setting up backup schedule: $description"
    
    # Create cron entry
    local cron_command="$BACKUP_SCRIPT >> $CRON_LOG_FILE 2>&1  # SkillNavigator backup"
    local cron_entry="$schedule $cron_command"
    
    # Get current crontab
    local current_cron=$(crontab -l 2>/dev/null)
    
    # Remove existing SkillNavigator backup entries
    local cleaned_cron=$(echo "$current_cron" | grep -v "skillnavigator.*backup" | grep -v "SkillNavigator backup")
    
    # Add new entry
    local new_cron="$cleaned_cron"$'\n'"$cron_entry"
    
    # Install new crontab
    echo "$new_cron" | crontab -
    
    if [[ $? -eq 0 ]]; then
        success "Backup schedule configured: $description"
        info "Logs will be written to: $CRON_LOG_FILE"
    else
        error "Failed to configure backup schedule"
        exit 1
    fi
}

# Function to remove cron job
remove_cron_job() {
    log "Removing backup schedule..."
    
    # Get current crontab and remove SkillNavigator entries
    local current_cron=$(crontab -l 2>/dev/null)
    local cleaned_cron=$(echo "$current_cron" | grep -v "skillnavigator.*backup" | grep -v "SkillNavigator backup")
    
    # Install cleaned crontab
    if [[ -n "$cleaned_cron" ]]; then
        echo "$cleaned_cron" | crontab -
    else
        crontab -r 2>/dev/null || true
    fi
    
    success "Backup schedule removed"
}

# Function to test backup
test_backup() {
    log "Testing backup functionality..."
    
    echo
    info "Running backup script in test mode..."
    
    if "$BACKUP_SCRIPT" --help >/dev/null 2>&1; then
        success "Backup script is functional"
    else
        error "Backup script test failed"
        exit 1
    fi
    
    echo
    info "Testing cron environment..."
    
    # Create a test cron entry that runs in 1 minute
    local test_time=$(date -v+1M "+%M %H %d %m *" 2>/dev/null || date -d "+1 minute" "+%M %H %d %m *" 2>/dev/null)
    
    if [[ -n "$test_time" ]]; then
        info "Test cron entry would be: $test_time $BACKUP_SCRIPT"
        success "Cron scheduling is available"
    else
        warn "Could not generate test cron schedule"
    fi
}

# Function to show backup logs
show_logs() {
    local lines="${1:-50}"
    
    echo -e "${CYAN}📋 Recent Backup Logs (last $lines lines):${NC}"
    echo
    
    if [[ -f "$CRON_LOG_FILE" ]]; then
        tail -n "$lines" "$CRON_LOG_FILE"
    else
        info "No log file found at: $CRON_LOG_FILE"
    fi
}

# Predefined schedules
setup_daily_backup() {
    # Daily at 2 AM
    add_cron_job "0 2 * * *" "Daily at 2:00 AM"
}

setup_weekly_backup() {
    # Weekly on Sunday at 3 AM
    add_cron_job "0 3 * * 0" "Weekly on Sunday at 3:00 AM"
}

setup_twice_daily_backup() {
    # Twice daily at 2 AM and 2 PM
    add_cron_job "0 2,14 * * *" "Twice daily at 2:00 AM and 2:00 PM"
}

setup_hourly_backup() {
    # Every hour at minute 0
    add_cron_job "0 * * * *" "Hourly at minute 0"
}

setup_custom_backup() {
    local schedule="$1"
    local description="$2"
    
    if [[ -z "$schedule" ]]; then
        error "Custom schedule not provided"
        exit 1
    fi
    
    # Validate cron schedule format (basic validation)
    if [[ ! "$schedule" =~ ^[0-9\*\,\-\/\ ]+$ ]]; then
        error "Invalid cron schedule format: $schedule"
        exit 1
    fi
    
    add_cron_job "$schedule" "${description:-Custom schedule}"
}

# Function to show interactive menu
show_interactive_menu() {
    while true; do
        echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${CYAN}║              SkillNavigator Backup Scheduler                 ║${NC}"
        echo -e "${CYAN}╠══════════════════════════════════════════════════════════════╣${NC}"
        echo -e "${CYAN}║${NC} 1. Setup Daily Backup (2:00 AM)                          ${CYAN}║${NC}"
        echo -e "${CYAN}║${NC} 2. Setup Weekly Backup (Sunday 3:00 AM)                  ${CYAN}║${NC}"
        echo -e "${CYAN}║${NC} 3. Setup Twice Daily Backup (2:00 AM & 2:00 PM)          ${CYAN}║${NC}"
        echo -e "${CYAN}║${NC} 4. Setup Hourly Backup                                   ${CYAN}║${NC}"
        echo -e "${CYAN}║${NC} 5. Setup Custom Schedule                                 ${CYAN}║${NC}"
        echo -e "${CYAN}║${NC} 6. Show Current Schedule                                 ${CYAN}║${NC}"
        echo -e "${CYAN}║${NC} 7. Remove Backup Schedule                                ${CYAN}║${NC}"
        echo -e "${CYAN}║${NC} 8. View Backup Logs                                     ${CYAN}║${NC}"
        echo -e "${CYAN}║${NC} 9. Test Backup                                          ${CYAN}║${NC}"
        echo -e "${CYAN}║${NC} 0. Exit                                                 ${CYAN}║${NC}"
        echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
        echo
        
        read -p "Select an option (0-9): " choice
        echo
        
        case $choice in
            1)
                setup_daily_backup
                ;;
            2)
                setup_weekly_backup
                ;;
            3)
                setup_twice_daily_backup
                ;;
            4)
                setup_hourly_backup
                ;;
            5)
                echo "Cron format: minute hour day month dayofweek"
                echo "Example: '0 2 * * *' = daily at 2 AM"
                echo "Example: '30 */4 * * *' = every 4 hours at minute 30"
                echo
                read -p "Enter cron schedule: " custom_schedule
                read -p "Enter description: " custom_description
                setup_custom_backup "$custom_schedule" "$custom_description"
                ;;
            6)
                show_current_schedule
                ;;
            7)
                remove_cron_job
                ;;
            8)
                read -p "Number of log lines to show (default 50): " log_lines
                show_logs "${log_lines:-50}"
                ;;
            9)
                test_backup
                ;;
            0)
                info "Goodbye!"
                exit 0
                ;;
            *)
                error "Invalid option: $choice"
                ;;
        esac
        
        echo
        read -p "Press Enter to continue..."
        echo
    done
}

# Help function
show_help() {
    cat << EOF
SkillNavigator Backup Scheduler

Usage: $0 [OPTIONS] [COMMAND]

Commands:
    daily                  Setup daily backup (2:00 AM)
    weekly                 Setup weekly backup (Sunday 3:00 AM) 
    twice-daily            Setup twice daily backup (2:00 AM & 2:00 PM)
    hourly                 Setup hourly backup
    custom SCHEDULE DESC   Setup custom backup schedule
    remove                 Remove backup schedule
    status                 Show current backup schedule
    logs [LINES]          Show backup logs
    test                   Test backup functionality
    interactive           Show interactive menu (default)

Options:
    -h, --help            Show this help message

Examples:
    $0                                      # Interactive menu
    $0 daily                               # Setup daily backup
    $0 custom "0 */6 * * *" "Every 6 hours"  # Custom schedule
    $0 logs 100                            # Show last 100 log lines
    $0 remove                              # Remove schedule

Cron Schedule Format:
    * * * * *
    │ │ │ │ │
    │ │ │ │ └─── Day of week (0-7, Sunday = 0 or 7)
    │ │ │ └──── Month (1-12)
    │ │ └────── Day of month (1-31)
    │ └──────── Hour (0-23)
    └────────── Minute (0-59)
EOF
}

# Main function
main() {
    setup_backup_environment
    
    local command="${1:-interactive}"
    
    case $command in
        daily)
            setup_daily_backup
            ;;
        weekly)
            setup_weekly_backup
            ;;
        twice-daily)
            setup_twice_daily_backup
            ;;
        hourly)
            setup_hourly_backup
            ;;
        custom)
            setup_custom_backup "$2" "$3"
            ;;
        remove)
            remove_cron_job
            ;;
        status)
            show_current_schedule
            ;;
        logs)
            show_logs "$2"
            ;;
        test)
            test_backup
            ;;
        interactive)
            show_interactive_menu
            ;;
        -h|--help)
            show_help
            ;;
        *)
            error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Parse arguments and run
main "$@"