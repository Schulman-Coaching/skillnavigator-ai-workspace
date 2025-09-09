#!/bin/bash

# Auto-sync rules for SkillNavigator AI outputs to Notion
# This script sets up automation triggers for syncing AI outputs

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
AI_OUTPUTS_DIR="$PROJECT_ROOT/../04-ai-agents/outputs"
NOTION_SYNC_SCRIPT="$SCRIPT_DIR/notion-sync.js"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Function to check if file is a new AI output
is_new_ai_output() {
    local file="$1"
    local age_seconds=300  # 5 minutes
    
    if [[ -f "$file" && $(($(date +%s) - $(stat -f %m "$file"))) -lt $age_seconds ]]; then
        return 0
    else
        return 1
    fi
}

# Function to determine agent type from file path
get_agent_type() {
    local filepath="$1"
    
    if [[ "$filepath" == *"/code-architect/"* ]]; then
        echo "Code Architect"
    elif [[ "$filepath" == *"/research-analyst/"* ]]; then
        echo "Research Analyst"
    elif [[ "$filepath" == *"/content-strategist/"* ]]; then
        echo "Content Strategist"
    elif [[ "$filepath" == *"/business-analyst/"* ]]; then
        echo "Business Analyst"
    elif [[ "$filepath" == *"/product-manager/"* ]]; then
        echo "Product Manager"
    else
        echo "Unknown Agent"
    fi
}

# Function to sync AI output to Notion
sync_ai_output() {
    local file="$1"
    local agent_type=$(get_agent_type "$file")
    local content=$(cat "$file" 2>/dev/null || echo "Failed to read file")
    
    log "Syncing $agent_type output to Notion: $(basename "$file")"
    
    if command -v node >/dev/null 2>&1; then
        node "$NOTION_SYNC_SCRIPT" ai-output "$agent_type" "$content"
        if [[ $? -eq 0 ]]; then
            log "✅ Successfully synced to Notion"
        else
            error "❌ Failed to sync to Notion"
        fi
    else
        warn "Node.js not found. Cannot sync to Notion."
    fi
}

# Function to watch for new files
watch_ai_outputs() {
    log "Starting AI output watcher..."
    log "Watching directory: $AI_OUTPUTS_DIR"
    
    if [[ ! -d "$AI_OUTPUTS_DIR" ]]; then
        warn "AI outputs directory does not exist: $AI_OUTPUTS_DIR"
        return 1
    fi
    
    # Use fswatch if available, otherwise fall back to polling
    if command -v fswatch >/dev/null 2>&1; then
        log "Using fswatch for file monitoring"
        fswatch -o "$AI_OUTPUTS_DIR" | while read f; do
            # Find recently modified files
            find "$AI_OUTPUTS_DIR" -type f -name "*.md" -o -name "*.txt" -o -name "*.json" | while read file; do
                if is_new_ai_output "$file"; then
                    sync_ai_output "$file"
                fi
            done
        done
    else
        warn "fswatch not available. Using polling method."
        log "Install fswatch with: brew install fswatch (recommended)"
        
        # Polling fallback
        while true; do
            find "$AI_OUTPUTS_DIR" -type f \( -name "*.md" -o -name "*.txt" -o -name "*.json" \) | while read file; do
                if is_new_ai_output "$file"; then
                    sync_ai_output "$file"
                fi
            done
            sleep 30  # Check every 30 seconds
        done
    fi
}

# Function to sync daily standup
sync_daily_standup() {
    log "Triggering daily standup sync to Notion..."
    
    if command -v node >/dev/null 2>&1; then
        local summary="${1:-Daily standup completed via automation}"
        node "$NOTION_SYNC_SCRIPT" daily "$summary"
    else
        warn "Node.js not found. Cannot sync daily standup."
    fi
}

# Function to sync weekly review
sync_weekly_review() {
    log "Triggering weekly review sync to Notion..."
    
    if command -v node >/dev/null 2>&1; then
        local week_num="${1:-$(date +%U)}"
        local date_range="${2:-$(date -d 'monday' +%Y-%m-%d) to $(date -d 'sunday' +%Y-%m-%d)}"
        local summary="${3:-Weekly review completed via automation}"
        
        node "$NOTION_SYNC_SCRIPT" weekly "$week_num" "$date_range" "$summary"
    else
        warn "Node.js not found. Cannot sync weekly review."
    fi
}

# Main function
main() {
    case "${1:-watch}" in
        "watch")
            watch_ai_outputs
            ;;
        "daily")
            sync_daily_standup "$2"
            ;;
        "weekly")
            sync_weekly_review "$2" "$3" "$4"
            ;;
        "test")
            log "Testing Notion integration..."
            sync_ai_output "$AI_OUTPUTS_DIR/test-output.md"
            ;;
        *)
            echo "Usage: $0 [watch|daily|weekly|test] [args...]"
            echo ""
            echo "Commands:"
            echo "  watch           - Watch for new AI outputs and auto-sync"
            echo "  daily [summary] - Sync daily standup to Notion"
            echo "  weekly [week] [range] [summary] - Sync weekly review"
            echo "  test            - Test the integration"
            ;;
    esac
}

# Run main function with all arguments
main "$@"