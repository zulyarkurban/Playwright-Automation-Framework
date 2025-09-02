#!/bin/bash

# Retry Failed Tests Script
# This script detects failed tests from the last run and re-executes them

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="dev"
MAX_RETRIES=3
RETRY_DELAY=2
REPORT_PATH="reports/cucumber-report.json"
FAILED_TESTS_FILE="test-results/failed-tests.json"

# Help function
show_help() {
    echo -e "${BLUE}🔄 Retry Failed Tests Script${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --env ENVIRONMENT     Test environment (dev, staging, prod) [default: dev]"
    echo "  -r, --retries NUMBER      Maximum retry attempts [default: 3]"
    echo "  -d, --delay SECONDS       Delay between retries [default: 2]"
    echo "  -f, --file PATH           JSON report file path [default: reports/cucumber-report.json]"
    echo "  -c, --clear               Clear failed tests list before running"
    echo "  -s, --stats               Show retry statistics only"
    echo "  -h, --help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                        # Retry failed tests in dev environment"
    echo "  $0 -e staging -r 5        # Retry in staging with 5 max retries"
    echo "  $0 --clear                # Clear failed tests and run fresh"
    echo "  $0 --stats                # Show retry statistics"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -r|--retries)
            MAX_RETRIES="$2"
            shift 2
            ;;
        -d|--delay)
            RETRY_DELAY="$2"
            shift 2
            ;;
        -f|--file)
            REPORT_PATH="$2"
            shift 2
            ;;
        -c|--clear)
            CLEAR_FAILED=true
            shift
            ;;
        -s|--stats)
            SHOW_STATS=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Function to show retry statistics
show_retry_stats() {
    echo -e "${BLUE}📊 Retry Statistics${NC}"
    echo "================================"
    
    if [[ -f "reports/retry-report.json" ]]; then
        node -e "
        const fs = require('fs');
        const data = JSON.parse(fs.readFileSync('reports/retry-report.json', 'utf8'));
        console.log(\`Original Failures: \${data.originalFailures}\`);
        console.log(\`Tests Recovered: \${data.recovered}\`);
        console.log(\`Still Failing: \${data.stillFailing}\`);
        console.log(\`Success Rate: \${data.successRate}%\`);
        console.log(\`Last Retry: \${new Date(data.timestamp).toLocaleString()}\`);
        "
    else
        echo "No retry statistics available"
    fi
    echo "================================"
}

# Function to clear failed tests
clear_failed_tests() {
    if [[ -f "$FAILED_TESTS_FILE" ]]; then
        rm "$FAILED_TESTS_FILE"
        echo -e "${GREEN}🧹 Cleared failed tests list${NC}"
    fi
    
    if [[ -f "reports/retry-report.json" ]]; then
        rm "reports/retry-report.json"
        echo -e "${GREEN}🧹 Cleared retry report${NC}"
    fi
}

# Function to extract failed tests from report
extract_failed_tests() {
    if [[ ! -f "$REPORT_PATH" ]]; then
        echo -e "${RED}❌ Report file not found: $REPORT_PATH${NC}"
        echo "Run tests first to generate a report"
        exit 1
    fi

    echo -e "${YELLOW}🔍 Analyzing test report for failures...${NC}"
    
    # Use Node.js to parse JSON and extract failed tests
    node -e "
    const fs = require('fs');
    const path = require('path');
    
    try {
        const reportData = JSON.parse(fs.readFileSync('$REPORT_PATH', 'utf8'));
        const failedTests = [];
        
        reportData.forEach(feature => {
            feature.elements?.forEach(scenario => {
                const hasFailedSteps = scenario.steps?.some(step => 
                    step.result?.status === 'failed'
                );
                
                if (hasFailedSteps) {
                    const failedStep = scenario.steps.find(step => 
                        step.result?.status === 'failed'
                    );
                    
                    failedTests.push({
                        scenarioName: scenario.name,
                        featureFile: feature.uri || feature.name,
                        line: scenario.line || 0,
                        error: failedStep?.result?.error_message || 'Unknown error',
                        timestamp: new Date().toISOString(),
                        attempt: 1
                    });
                }
            });
        });
        
        // Save failed tests
        if (failedTests.length > 0) {
            const dir = path.dirname('$FAILED_TESTS_FILE');
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync('$FAILED_TESTS_FILE', JSON.stringify(failedTests, null, 2));
            console.log(\`Found \${failedTests.length} failed tests\`);
        } else {
            console.log('No failed tests found');
        }
        
        process.exit(failedTests.length > 0 ? 1 : 0);
    } catch (error) {
        console.error('Error parsing report:', error.message);
        process.exit(1);
    }
    "
}

# Function to retry failed tests
retry_failed_tests() {
    if [[ ! -f "$FAILED_TESTS_FILE" ]]; then
        echo -e "${GREEN}✅ No failed tests to retry${NC}"
        return 0
    fi

    local failed_count=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$FAILED_TESTS_FILE', 'utf8')).length)")
    
    echo -e "${YELLOW}🔄 Retrying $failed_count failed tests...${NC}"
    echo -e "${BLUE}Environment: $ENVIRONMENT${NC}"
    echo -e "${BLUE}Max Retries: $MAX_RETRIES${NC}"
    echo -e "${BLUE}Retry Delay: ${RETRY_DELAY}s${NC}"
    echo ""

    for ((attempt=1; attempt<=MAX_RETRIES; attempt++)); do
        echo -e "${YELLOW}Retry attempt $attempt/$MAX_RETRIES${NC}"
        
        # Load environment and run tests
        node src/config/environment-loader.js "$ENVIRONMENT"
        
        # Generate retry command for failed tests
        local retry_command=$(node -e "
        const fs = require('fs');
        if (fs.existsSync('$FAILED_TESTS_FILE')) {
            const failedTests = JSON.parse(fs.readFileSync('$FAILED_TESTS_FILE', 'utf8'));
            if (failedTests.length > 0) {
                const scenarios = failedTests.map(test => test.scenarioName).join('|');
                console.log(\`cucumber-js --config cucumber.config.js --name \"\${scenarios}\" --format json:reports/retry-\${attempt}.json\`);
            }
        }
        ")
        
        if [[ -n "$retry_command" ]]; then
            echo "Executing: $retry_command"
            
            if eval "$retry_command"; then
                echo -e "${GREEN}✅ Retry attempt $attempt succeeded${NC}"
                
                # Check if any tests still failing
                extract_failed_tests_from_retry "reports/retry-${attempt}.json"
                local still_failing=$?
                
                if [[ $still_failing -eq 0 ]]; then
                    echo -e "${GREEN}🎉 All failed tests recovered!${NC}"
                    break
                fi
            else
                echo -e "${RED}❌ Retry attempt $attempt failed${NC}"
                
                if [[ $attempt -lt $MAX_RETRIES ]]; then
                    echo -e "${YELLOW}⏳ Waiting ${RETRY_DELAY}s before next retry...${NC}"
                    sleep "$RETRY_DELAY"
                fi
            fi
        else
            echo -e "${GREEN}✅ No tests to retry${NC}"
            break
        fi
    done
}

# Function to extract failed tests from retry report
extract_failed_tests_from_retry() {
    local retry_report="$1"
    
    if [[ ! -f "$retry_report" ]]; then
        return 1
    fi
    
    node -e "
    const fs = require('fs');
    const reportData = JSON.parse(fs.readFileSync('$retry_report', 'utf8'));
    const stillFailing = [];
    
    reportData.forEach(feature => {
        feature.elements?.forEach(scenario => {
            const hasFailedSteps = scenario.steps?.some(step => 
                step.result?.status === 'failed'
            );
            if (hasFailedSteps) {
                stillFailing.push(scenario.name);
            }
        });
    });
    
    if (stillFailing.length > 0) {
        console.log(\`Still failing: \${stillFailing.join(', ')}\`);
        process.exit(1);
    } else {
        process.exit(0);
    }
    "
}

# Main execution
main() {
    echo -e "${BLUE}🔄 Retry Failed Tests Script${NC}"
    echo "================================"
    
    # Show statistics if requested
    if [[ "$SHOW_STATS" == true ]]; then
        show_retry_stats
        exit 0
    fi
    
    # Clear failed tests if requested
    if [[ "$CLEAR_FAILED" == true ]]; then
        clear_failed_tests
    fi
    
    # Extract failed tests from last report
    echo -e "${YELLOW}📋 Checking for failed tests...${NC}"
    if extract_failed_tests; then
        echo -e "${GREEN}✅ No failed tests found in last report${NC}"
        exit 0
    fi
    
    # Retry failed tests
    retry_failed_tests
    
    echo -e "${GREEN}🏁 Retry process completed${NC}"
}

# Run main function
main "$@"
