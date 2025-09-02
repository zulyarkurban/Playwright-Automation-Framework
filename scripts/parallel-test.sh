#!/bin/bash

# Parallel Test Execution Script
# This script provides convenient commands for running tests in parallel

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
WORKERS=4
MODE="parallel"
HEADLESS=true
ENVIRONMENT="dev"

# Function to display usage
usage() {
    echo -e "${BLUE}Parallel Test Execution Script${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -w, --workers NUM     Number of workers (default: 4)"
    echo "  -m, --mode MODE       Execution mode: parallel, sequential, fast (default: parallel)"
    echo "  -e, --env ENV         Test environment: dev, staging, prod (default: dev)"
    echo "  -h, --headed          Run in headed mode (default: headless)"
    echo "  --help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                              # Run with default settings (4 workers, parallel)"
    echo "  $0 -w 6 -m fast               # Run with 6 workers in fast mode"
    echo "  $0 -w 1 -m sequential         # Run sequentially (single worker)"
    echo "  $0 -e staging -h               # Run in staging environment, headed mode"
    echo ""
}

# Function to validate worker count
validate_workers() {
    if ! [[ "$1" =~ ^[0-9]+$ ]] || [ "$1" -lt 1 ] || [ "$1" -gt 10 ]; then
        echo -e "${RED}Error: Worker count must be between 1 and 10${NC}"
        exit 1
    fi
}

# Function to get system info
get_system_info() {
    echo -e "${BLUE}System Information:${NC}"
    echo "  OS: $(uname -s)"
    echo "  CPU Cores: $(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 'Unknown')"
    echo "  Memory: $(free -h 2>/dev/null | awk '/^Mem:/ {print $2}' || echo 'Unknown')"
    echo ""
}

# Function to run parallel tests
run_parallel_tests() {
    local workers=$1
    local mode=$2
    local env=$3
    local headless=$4
    
    echo -e "${GREEN}Starting parallel test execution...${NC}"
    echo "  Workers: $workers"
    echo "  Mode: $mode"
    echo "  Environment: $env"
    echo "  Headless: $headless"
    echo ""
    
    # Set environment variables
    export CUCUMBER_WORKERS=$workers
    export TEST_ENV=$env
    export HEADLESS=$headless
    
    # Create reports directory
    mkdir -p reports
    
    # Run tests based on mode
    case $mode in
        "parallel")
            npm run test:cucumber:parallel
            ;;
        "fast")
            npm run test:cucumber:parallel:fast
            ;;
        "sequential")
            npm run test:sequential
            ;;
        *)
            echo -e "${RED}Error: Invalid mode '$mode'. Use: parallel, fast, or sequential${NC}"
            exit 1
            ;;
    esac
}

# Function to display results
display_results() {
    echo ""
    echo -e "${GREEN}Test execution completed!${NC}"
    echo ""
    
    if [ -f "reports/cucumber-report.html" ]; then
        echo -e "${BLUE}Reports generated:${NC}"
        echo "  HTML Report: reports/cucumber-report.html"
        echo "  JSON Report: reports/cucumber-report.json"
        echo ""
        
        # Try to open the HTML report
        if command -v open >/dev/null 2>&1; then
            echo "Opening HTML report..."
            open reports/cucumber-report.html
        elif command -v xdg-open >/dev/null 2>&1; then
            echo "Opening HTML report..."
            xdg-open reports/cucumber-report.html
        else
            echo "HTML report available at: $(pwd)/reports/cucumber-report.html"
        fi
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -w|--workers)
            WORKERS="$2"
            validate_workers "$WORKERS"
            shift 2
            ;;
        -m|--mode)
            MODE="$2"
            shift 2
            ;;
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -h|--headed)
            HEADLESS=false
            shift
            ;;
        --help)
            usage
            exit 0
            ;;
        *)
            echo -e "${RED}Error: Unknown option '$1'${NC}"
            usage
            exit 1
            ;;
    esac
done

# Main execution
echo -e "${BLUE}Playwright Cucumber Parallel Test Runner${NC}"
echo "========================================"
echo ""

get_system_info

# Check if npm dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm ci
fi

# Install Playwright browsers if needed
if [ ! -d "node_modules/@playwright" ]; then
    echo -e "${YELLOW}Installing Playwright browsers...${NC}"
    npx playwright install --with-deps
fi

# Run the tests
run_parallel_tests "$WORKERS" "$MODE" "$ENVIRONMENT" "$HEADLESS"

# Display results
display_results

echo -e "${GREEN}Done!${NC}"
