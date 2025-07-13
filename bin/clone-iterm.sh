#!/bin/bash

# iTerm Cloning Script for Multiple MCP Instances
# This script creates multiple instances of iTerm.app with unique bundle identifiers
# allowing concurrent execution with separate MCP servers

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ITERM_SOURCE="/Applications/iTerm.app"
BASE_BUNDLE_ID="com.googlecode.iterm2"
INSTANCES_TO_CREATE=2
FORCE_RECREATE=false
APP_NAMES=()

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to show usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

OPTIONS:
    -n, --number <count>     Number of iTerm instances to create (default: 2)
    -s, --source <path>      Path to source iTerm.app (default: /Applications/iTerm.app)
    -f, --force              Force recreate existing instances
    -a, --names <names>      Comma-separated list of custom app names
                            Example: "iTerm-Dev,iTerm-Prod,iTerm-Test"
                            Default: "iTerm-Agent1,iTerm-Agent2,..."
    -h, --help               Show this help message

EXAMPLES:
    $0                       # Create 2 instances with default settings
    $0 -n 3                  # Create 3 instances with default names
    $0 -n 2 -f               # Force recreate 2 instances
    $0 -n 3 -a "iTerm-Dev,iTerm-Stage,iTerm-Prod"  # Custom names
    $0 -s ~/Downloads/iTerm.app -n 2  # Use custom source path

EOF
    exit 0
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--number)
            INSTANCES_TO_CREATE="$2"
            shift 2
            ;;
        -s|--source)
            ITERM_SOURCE="$2"
            shift 2
            ;;
        -f|--force)
            FORCE_RECREATE=true
            shift
            ;;
        -a|--names)
            IFS=',' read -ra APP_NAMES <<< "$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            ;;
    esac
done

# Validate inputs
if [[ ! -d "$ITERM_SOURCE" ]]; then
    print_error "Source iTerm.app not found at: $ITERM_SOURCE"
    exit 1
fi

if ! [[ "$INSTANCES_TO_CREATE" =~ ^[0-9]+$ ]] || [[ "$INSTANCES_TO_CREATE" -lt 1 ]]; then
    print_error "Number of instances must be a positive integer"
    exit 1
fi

# Validate app names if provided
if [[ ${#APP_NAMES[@]} -gt 0 ]]; then
    if [[ ${#APP_NAMES[@]} -ne $INSTANCES_TO_CREATE ]]; then
        print_error "Number of app names (${#APP_NAMES[@]}) must match number of instances ($INSTANCES_TO_CREATE)"
        exit 1
    fi

    # Check for duplicates
    seen_names=()
    for name in "${APP_NAMES[@]}"; do
        # Trim whitespace
        name=$(echo "$name" | xargs)
        if [[ " ${seen_names[@]} " =~ " ${name} " ]]; then
            print_error "Duplicate app name found: $name"
            exit 1
        fi
        seen_names+=("$name")
    done
fi

# Check for required tools
check_requirements() {
    local missing_tools=()

    if ! command -v /usr/libexec/PlistBuddy &> /dev/null; then
        missing_tools+=("PlistBuddy")
    fi

    if ! command -v codesign &> /dev/null; then
        missing_tools+=("codesign")
    fi

    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        exit 1
    fi
}

# Function to get app name for instance
get_app_name() {
    local instance_num=$1

    if [[ ${#APP_NAMES[@]} -ge $instance_num ]]; then
        # Trim whitespace from custom name
        echo "${APP_NAMES[$((instance_num-1))]}" | xargs
    else
        # Default name
        echo "iTerm-Agent${instance_num}"
    fi
}

# Function to get bundle ID suffix for instance
get_bundle_suffix() {
    local app_name="$1"
    # Convert app name to bundle-safe suffix (lowercase, remove special chars)
    echo "$app_name" | sed 's/^iTerm-*//' | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]//g'
}

# Function to create a single iTerm instance
create_iterm_instance() {
    local instance_num=$1
    local app_name=$(get_app_name $instance_num)
    local app_path="/Applications/${app_name}.app"
    local bundle_suffix=$(get_bundle_suffix "$app_name")
    local bundle_id="${BASE_BUNDLE_ID}.${bundle_suffix}"

    print_status "Creating ${app_name}..."

    # Check if instance already exists
    if [[ -d "$app_path" ]]; then
        if [[ "$FORCE_RECREATE" == true ]]; then
            print_warning "Removing existing ${app_name}..."
            rm -rf "$app_path"
        else
            print_warning "${app_name} already exists. Use -f to force recreate."
            return 1
        fi
    fi

    # Copy the app
    print_status "Copying iTerm.app to ${app_name}.app..."
    cp -R "$ITERM_SOURCE" "$app_path"

    # Modify Info.plist
    local plist_path="${app_path}/Contents/Info.plist"

    print_status "Modifying Info.plist for ${app_name}..."

    # Update bundle identifier
    /usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier ${bundle_id}" "$plist_path" 2>/dev/null || {
        print_error "Failed to set CFBundleIdentifier"
        return 1
    }

    # Update bundle name
    /usr/libexec/PlistBuddy -c "Set :CFBundleName ${app_name}" "$plist_path" 2>/dev/null || {
        print_error "Failed to set CFBundleName"
        return 1
    }

    # Update display name (add if doesn't exist)
    if /usr/libexec/PlistBuddy -c "Print :CFBundleDisplayName" "$plist_path" &>/dev/null; then
        # Key exists, update it
        /usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName ${app_name}" "$plist_path" 2>/dev/null || {
            print_warning "Failed to set CFBundleDisplayName, continuing anyway"
        }
    else
        # Key doesn't exist, try to add it
        /usr/libexec/PlistBuddy -c "Add :CFBundleDisplayName string ${app_name}" "$plist_path" 2>/dev/null || {
            print_warning "CFBundleDisplayName not supported, skipping"
        }
    fi

    # Re-sign the app
    print_status "Re-signing ${app_name}..."
    codesign --force --deep --sign - "$app_path" 2>/dev/null || {
        print_error "Failed to sign ${app_name}"
        return 1
    }

    print_success "${app_name} created successfully!"
    return 0
}

# Function to generate MCP configuration
generate_mcp_config() {
    local config_file="claude_desktop_config_snippet.json"

    print_status "Generating MCP configuration snippet..."

    cat > "$config_file" << EOF
{
  "mcpServers": {
EOF

    for ((i=1; i<=INSTANCES_TO_CREATE; i++)); do
        local port=$((3000 + i))
        local app_name=$(get_app_name $i)
        local server_name=$(echo "$app_name" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g')

        cat >> "$config_file" << EOF
    "${server_name}": {
      "command": "node",
      "args": ["/path/to/modified/iterm-mcp/dist/index.js"],
      "env": {
        "MCP_PORT": "${port}",
        "ITERM_INSTANCE": "${app_name}"
      }
    }$([ $i -lt $INSTANCES_TO_CREATE ] && echo ",")
EOF
    done

    cat >> "$config_file" << EOF

  }
}
EOF

    print_success "MCP configuration snippet saved to: ${config_file}"
    print_warning "Remember to update the path to your modified iterm-mcp installation!"
}


# Main execution
main() {
    print_status "Starting iTerm cloning process..."
    print_status "Source: $ITERM_SOURCE"
    print_status "Creating $INSTANCES_TO_CREATE instances"
    echo

    check_requirements

    success_count=0
    failed_instances=()

    for ((i=1; i<=INSTANCES_TO_CREATE; i++)); do
        if create_iterm_instance $i; then
            ((success_count++))
        else
            failed_instances+=($i)
        fi
        echo
    done

    # Generate configuration files
    if [[ $success_count -gt 0 ]]; then
        generate_mcp_config
    fi

    echo
    print_status "Summary:"
    print_success "Successfully created: $success_count instances"

    if [[ ${#APP_NAMES[@]} -gt 0 ]]; then
        print_status "Created apps:"
        for ((i=1; i<=INSTANCES_TO_CREATE; i++)); do
            if [[ ! " ${failed_instances[@]} " =~ " ${i} " ]]; then
                echo "  - $(get_app_name $i)"
            fi
        done
    fi

    if [[ ${#failed_instances[@]} -gt 0 ]]; then
        print_warning "Failed instances: ${failed_instances[*]}"
    fi
}

# Run main function
main