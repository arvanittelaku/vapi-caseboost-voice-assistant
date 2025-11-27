#!/bin/bash
# Quick start script for Docker operations

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

IMAGE_NAME="vapi-caseboost-assistant"
CONTAINER_NAME="vapi-assistant"

# Function to print colored messages
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Build Docker image
build() {
    print_step "Building Docker image..."
    docker build -t ${IMAGE_NAME}:latest .
    print_success "Image built successfully"
    docker images | grep ${IMAGE_NAME}
}

# Run container locally
run() {
    print_step "Stopping existing container (if any)..."
    docker stop ${CONTAINER_NAME} 2>/dev/null || true
    docker rm ${CONTAINER_NAME} 2>/dev/null || true
    
    if [ ! -f .env ]; then
        print_warning ".env file not found. Please create one from env.example"
        exit 1
    fi
    
    print_step "Starting container..."
    docker run -d \
        --name ${CONTAINER_NAME} \
        -p 3000:3000 \
        --env-file .env \
        ${IMAGE_NAME}:latest
    
    print_success "Container started"
    
    print_step "Waiting for health check..."
    sleep 5
    
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        print_success "Health check passed!"
        echo -e "\n${GREEN}Container is running!${NC}"
        echo "  API: http://localhost:3000"
        echo "  Health: http://localhost:3000/health"
        echo "  Logs: docker logs -f ${CONTAINER_NAME}"
    else
        print_warning "Health check failed. Check logs with: docker logs ${CONTAINER_NAME}"
    fi
}

# View logs
logs() {
    print_step "Showing logs (Ctrl+C to exit)..."
    docker logs -f ${CONTAINER_NAME}
}

# Stop container
stop() {
    print_step "Stopping container..."
    docker stop ${CONTAINER_NAME}
    docker rm ${CONTAINER_NAME}
    print_success "Container stopped and removed"
}

# Test endpoints
test() {
    print_step "Testing endpoints..."
    
    echo -e "\n1. Root endpoint:"
    curl -s http://localhost:3000/ | jq '.' || curl -s http://localhost:3000/
    
    echo -e "\n2. Health endpoint:"
    curl -s http://localhost:3000/health | jq '.' || curl -s http://localhost:3000/health
    
    print_success "Tests complete"
}

# Push to ECR
push_ecr() {
    if [ -z "$1" ] || [ -z "$2" ]; then
        echo "Usage: $0 push-ecr <account-id> <region>"
        echo "Example: $0 push-ecr 123456789012 us-east-1"
        exit 1
    fi
    
    ACCOUNT_ID=$1
    REGION=$2
    ECR_REPO="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${IMAGE_NAME}"
    
    print_step "Logging into ECR..."
    aws ecr get-login-password --region ${REGION} | \
        docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com
    
    print_step "Tagging image..."
    docker tag ${IMAGE_NAME}:latest ${ECR_REPO}:latest
    docker tag ${IMAGE_NAME}:latest ${ECR_REPO}:$(date +%Y%m%d-%H%M%S)
    
    print_step "Pushing to ECR..."
    docker push ${ECR_REPO}:latest
    docker push ${ECR_REPO}:$(date +%Y%m%d-%H%M%S)
    
    print_success "Pushed to ECR: ${ECR_REPO}:latest"
}

# Show help
help() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  build       - Build Docker image"
    echo "  run         - Run container locally (requires .env file)"
    echo "  logs        - View container logs"
    echo "  test        - Test API endpoints"
    echo "  stop        - Stop and remove container"
    echo "  push-ecr    - Push image to AWS ECR (requires account-id and region)"
    echo "  help        - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 build"
    echo "  $0 run"
    echo "  $0 push-ecr 123456789012 us-east-1"
}

# Main script
case "${1:-help}" in
    build)
        build
        ;;
    run)
        run
        ;;
    logs)
        logs
        ;;
    test)
        test
        ;;
    stop)
        stop
        ;;
    push-ecr)
        push_ecr $2 $3
        ;;
    help)
        help
        ;;
    *)
        echo "Unknown command: $1"
        help
        exit 1
        ;;
esac

