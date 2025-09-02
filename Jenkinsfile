pipeline {
    agent any
    
    triggers {
        // Run every weekday (Monday-Friday) at 6:00 AM
        cron('0 6 * * 1-5')
    }
    
    environment {
        NODE_VERSION = '18'
        PLAYWRIGHT_BROWSERS_PATH = '0'
        // Environment-specific variables
        TEST_ENV = "${params.ENVIRONMENT ?: 'dev'}"
        MAX_RETRIES = "${params.MAX_RETRIES ?: '3'}"
        PARALLEL_WORKERS = "${params.PARALLEL_WORKERS ?: '4'}"
    }
    
    parameters {
        choice(
            name: 'ENVIRONMENT',
            choices: ['dev', 'staging', 'prod'],
            description: 'Target environment for test execution'
        )
        choice(
            name: 'TEST_TYPE',
            choices: ['full', 'smoke', 'regression', 'parallel'],
            description: 'Type of test suite to run'
        )
        string(
            name: 'MAX_RETRIES',
            defaultValue: '3',
            description: 'Maximum retry attempts for failed tests'
        )
        string(
            name: 'PARALLEL_WORKERS',
            defaultValue: '4',
            description: 'Number of parallel workers for test execution'
        )
        booleanParam(
            name: 'ENABLE_RETRY',
            defaultValue: true,
            description: 'Enable automatic retry of failed tests'
        )
        booleanParam(
            name: 'GENERATE_REPORTS',
            defaultValue: true,
            description: 'Generate HTML and JSON test reports'
        )
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo "🚀 Starting Playwright test pipeline for ${params.ENVIRONMENT} environment"
            }
        }
        
        stage('Setup Environment') {
            steps {
                script {
                    echo "🔧 Setting up Node.js and dependencies"
                }
                // Install Node.js
                sh '''
                    node --version
                    npm --version
                '''
                
                // Install dependencies
                sh 'npm ci'
                
                // Install Playwright browsers
                sh 'npx playwright install --with-deps'
                
                // Validate environment configuration
                sh "npm run env:${params.ENVIRONMENT}"
            }
        }
        
        stage('Run Tests') {
            parallel {
                stage('Execute Test Suite') {
                    steps {
                        script {
                            def testCommand = getTestCommand(params.TEST_TYPE, params.ENVIRONMENT)
                            echo "🧪 Executing: ${testCommand}"
                            
                            try {
                                sh testCommand
                                currentBuild.result = 'SUCCESS'
                            } catch (Exception e) {
                                echo "❌ Initial test run failed: ${e.getMessage()}"
                                currentBuild.result = 'UNSTABLE'
                                
                                if (params.ENABLE_RETRY) {
                                    echo "🔄 Retry enabled - will attempt retry in next stage"
                                } else {
                                    echo "🚫 Retry disabled - marking build as failed"
                                    throw e
                                }
                            }
                        }
                    }
                    post {
                        always {
                            // Archive test results
                            archiveArtifacts artifacts: 'reports/**/*', allowEmptyArchive: true
                            archiveArtifacts artifacts: 'test-results/**/*', allowEmptyArchive: true
                        }
                    }
                }
            }
        }
        
        stage('Retry Failed Tests') {
            when {
                allOf {
                    expression { params.ENABLE_RETRY }
                    expression { currentBuild.result == 'UNSTABLE' }
                }
            }
            steps {
                script {
                    echo "🔄 Starting retry mechanism for failed tests"
                    
                    try {
                        // Show retry statistics before retry
                        sh 'npm run retry:stats'
                        
                        // Execute retry with environment-specific settings
                        sh """
                            ./scripts/retry-failed-tests.sh \\
                                -e ${params.ENVIRONMENT} \\
                                -r ${params.MAX_RETRIES} \\
                                -d 3
                        """
                        
                        echo "✅ Retry completed successfully"
                        currentBuild.result = 'SUCCESS'
                        
                    } catch (Exception retryError) {
                        echo "❌ Retry failed: ${retryError.getMessage()}"
                        
                        // Show final retry statistics
                        sh 'npm run retry:stats'
                        
                        currentBuild.result = 'FAILURE'
                        throw retryError
                    }
                }
            }
            post {
                always {
                    // Archive retry results
                    archiveArtifacts artifacts: 'reports/**/*', allowEmptyArchive: true
                    archiveArtifacts artifacts: 'test-results/**/*', allowEmptyArchive: true
                }
            }
        }
        
        stage('Generate Reports') {
            when {
                expression { params.GENERATE_REPORTS }
            }
            steps {
                script {
                    echo "📊 Generating test reports"
                }
                
                // Generate consolidated reports if parallel execution was used
                script {
                    if (params.TEST_TYPE == 'parallel') {
                        sh 'npm run test:parallel:report'
                    }
                }
                
                // Publish test results
                publishHTML([
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'reports',
                    reportFiles: 'cucumber-report.html',
                    reportName: 'Cucumber Test Report',
                    reportTitles: ''
                ])
                
                // Archive JSON reports for downstream processing
                archiveArtifacts artifacts: 'reports/*.json', fingerprint: true
            }
        }
        
        stage('Notify Results') {
            steps {
                script {
                    def status = currentBuild.result ?: 'SUCCESS'
                    def color = status == 'SUCCESS' ? 'good' : (status == 'UNSTABLE' ? 'warning' : 'danger')
                    def message = """
                        🎭 Playwright Test Results - ${params.ENVIRONMENT.toUpperCase()}
                        Status: ${status}
                        Environment: ${params.ENVIRONMENT}
                        Test Type: ${params.TEST_TYPE}
                        Retry Enabled: ${params.ENABLE_RETRY}
                        Build: ${env.BUILD_NUMBER}
                        Duration: ${currentBuild.durationString}
                    """.stripIndent()
                    
                    echo message
                    
                    // Send email notification
                    emailext(
                        subject: "🎭 Playwright Test Results - ${params.ENVIRONMENT.toUpperCase()} - ${status}",
                        body: """
                            <h2>Playwright Automation Test Results</h2>
                            <p><strong>Status:</strong> ${status}</p>
                            <p><strong>Environment:</strong> ${params.ENVIRONMENT}</p>
                            <p><strong>Test Type:</strong> ${params.TEST_TYPE}</p>
                            <p><strong>Build Number:</strong> ${env.BUILD_NUMBER}</p>
                            <p><strong>Duration:</strong> ${currentBuild.durationString}</p>
                            <p><strong>Retry Enabled:</strong> ${params.ENABLE_RETRY}</p>
                            
                            <h3>Build Details</h3>
                            <p><strong>Build URL:</strong> <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                            <p><strong>Test Reports:</strong> <a href="${env.BUILD_URL}Playwright_Test_Report/">View HTML Report</a></p>
                            
                            <h3>Next Steps</h3>
                            ${status == 'SUCCESS' ? 
                                '<p style="color: green;">✅ All tests passed successfully!</p>' : 
                                '<p style="color: red;">❌ Some tests failed. Check the reports for details.</p>'
                            }
                        """,
                        to: 'email_report@ugdevops.com',
                        mimeType: 'text/html'
                    )
                }
            }
        }
    }
    
    post {
        always {
            // Clean up workspace
            echo "🧹 Cleaning up workspace"
            
            // Archive all artifacts
            archiveArtifacts artifacts: 'reports/**/*', allowEmptyArchive: true
            archiveArtifacts artifacts: 'test-results/**/*', allowEmptyArchive: true
            archiveArtifacts artifacts: 'logs/**/*', allowEmptyArchive: true
            
            // Clean up failed tests list for next run
            sh 'npm run retry:clear || true'
        }
        
        success {
            echo "✅ Pipeline completed successfully"
        }
        
        failure {
            echo "❌ Pipeline failed"
            
            // Show final retry statistics for debugging
            sh 'npm run retry:stats || true'
        }
        
        unstable {
            echo "⚠️ Pipeline completed with warnings"
        }
    }
}

/**
 * Generate test command based on test type and environment
 */
def getTestCommand(testType, environment) {
    switch(testType) {
        case 'full':
            return "npm run test:${environment}"
        case 'smoke':
            return "npm run test:${environment}:smoke"
        case 'regression':
            return "npm run test:${environment}:regression"
        case 'parallel':
            return "npm run test:${environment}:parallel"
        default:
            return "npm run test:${environment}"
    }
}
