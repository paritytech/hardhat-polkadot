#!/bin/bash

# Console.sol Precompile Docker Build Script
# Automates building and publishing Docker images with console precompile

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOCKER_REGISTRY=${DOCKER_REGISTRY:-"docker.io"}
DOCKER_ORG=${DOCKER_ORG:-"paritytech"}
IMAGE_NAME="substrate-console"
VERSION=${VERSION:-"latest"}

# Build modes
BUILD_MODE=${1:-"dev"}

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to build Docker image
build_image() {
    local mode=$1
    local tag=$2
    
    print_info "Building $mode image with tag: $tag"
    
    docker build \
        --build-arg BUILD_MODE=$mode \
        -t $tag \
        -f substrate-console-precompile/Dockerfile \
        ./substrate-console-precompile
    
    if [ $? -eq 0 ]; then
        print_info "Successfully built $tag"
    else
        print_error "Failed to build $tag"
        exit 1
    fi
}

# Function to test the image
test_image() {
    local tag=$1
    local mode=$2
    
    print_info "Testing image: $tag"
    
    # Run container and check if console precompile is available
    container_id=$(docker run -d --rm $tag substrate --dev)
    
    # Wait for node to start
    sleep 5
    
    # Check logs for console precompile status
    if [ "$mode" = "dev" ]; then
        if docker logs $container_id 2>&1 | grep -q "Console.sol precompile enabled"; then
            print_info "✅ Console precompile correctly enabled in dev mode"
        else
            print_warning "Console precompile may not be properly enabled"
        fi
    else
        if docker logs $container_id 2>&1 | grep -q "Console.sol precompile disabled"; then
            print_info "✅ Console precompile correctly disabled in production mode"
        else
            print_warning "Console precompile status unclear in production mode"
        fi
    fi
    
    # Stop container
    docker stop $container_id > /dev/null 2>&1
}

# Function to push image to registry
push_image() {
    local tag=$1
    
    print_info "Pushing image to registry: $tag"
    
    docker push $tag
    
    if [ $? -eq 0 ]; then
        print_info "Successfully pushed $tag"
    else
        print_error "Failed to push $tag"
        exit 1
    fi
}

# Main build process
main() {
    print_info "Starting Docker build process for console.sol precompile"
    print_info "Build mode: $BUILD_MODE"
    print_info "Version: $VERSION"
    
    # Check if Docker is available
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check if Dockerfile exists
    if [ ! -f "substrate-console-precompile/Dockerfile" ]; then
        print_error "Dockerfile not found at substrate-console-precompile/Dockerfile"
        exit 1
    fi
    
    case $BUILD_MODE in
        dev|development)
            # Build development image with console.log support
            print_info "Building DEVELOPMENT image with console.log support"
            print_warning "⚠️ This image includes console.log - DO NOT use in production!"
            
            local dev_tag="${DOCKER_REGISTRY}/${DOCKER_ORG}/${IMAGE_NAME}:${VERSION}-dev"
            build_image "dev" "$dev_tag"
            test_image "$dev_tag" "dev"
            
            # Ask before pushing
            read -p "Push development image to registry? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                push_image "$dev_tag"
            fi
            ;;
            
        prod|production)
            # Build production image without console.log
            print_info "Building PRODUCTION image without console.log support"
            
            local prod_tag="${DOCKER_REGISTRY}/${DOCKER_ORG}/${IMAGE_NAME}:${VERSION}"
            build_image "prod" "$prod_tag"
            test_image "$prod_tag" "prod"
            
            # Ask before pushing
            read -p "Push production image to registry? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                push_image "$prod_tag"
            fi
            ;;
            
        all)
            # Build both dev and prod images
            print_info "Building both development and production images"
            
            # Build dev
            local dev_tag="${DOCKER_REGISTRY}/${DOCKER_ORG}/${IMAGE_NAME}:${VERSION}-dev"
            build_image "dev" "$dev_tag"
            test_image "$dev_tag" "dev"
            
            # Build prod
            local prod_tag="${DOCKER_REGISTRY}/${DOCKER_ORG}/${IMAGE_NAME}:${VERSION}"
            build_image "prod" "$prod_tag"
            test_image "$prod_tag" "prod"
            
            # Ask before pushing
            read -p "Push both images to registry? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                push_image "$dev_tag"
                push_image "$prod_tag"
            fi
            ;;
            
        test)
            # Build test image for CI/CD
            print_info "Building TEST image for CI/CD pipelines"
            
            local test_tag="${DOCKER_REGISTRY}/${DOCKER_ORG}/${IMAGE_NAME}:${VERSION}-test"
            build_image "dev" "$test_tag"  # Test uses dev features
            test_image "$test_tag" "dev"
            ;;
            
        *)
            print_error "Invalid build mode: $BUILD_MODE"
            print_info "Usage: $0 [dev|prod|all|test]"
            exit 1
            ;;
    esac
    
    print_info "Docker build process completed successfully!"
    
    # Print summary
    echo
    print_info "=== Build Summary ==="
    print_info "Mode: $BUILD_MODE"
    print_info "Version: $VERSION"
    
    if [ "$BUILD_MODE" = "all" ]; then
        print_info "Images built:"
        print_info "  - ${DOCKER_REGISTRY}/${DOCKER_ORG}/${IMAGE_NAME}:${VERSION}-dev (with console.log)"
        print_info "  - ${DOCKER_REGISTRY}/${DOCKER_ORG}/${IMAGE_NAME}:${VERSION} (production, no console.log)"
    elif [ "$BUILD_MODE" = "dev" ] || [ "$BUILD_MODE" = "development" ]; then
        print_info "Image built: ${DOCKER_REGISTRY}/${DOCKER_ORG}/${IMAGE_NAME}:${VERSION}-dev"
        print_warning "⚠️ This image includes console.log debugging - not for production use!"
    elif [ "$BUILD_MODE" = "prod" ] || [ "$BUILD_MODE" = "production" ]; then
        print_info "Image built: ${DOCKER_REGISTRY}/${DOCKER_ORG}/${IMAGE_NAME}:${VERSION}"
        print_info "✅ Production image - console.log disabled"
    fi
}

# Run main function
main

# CI/CD Integration Examples
cat << EOF

=== CI/CD Integration Examples ===

GitHub Actions:
\`\`\`yaml
- name: Build Console Docker Images
  env:
    VERSION: \${{ github.sha }}
  run: |
    ./scripts/build-console-docker.sh all
\`\`\`

GitLab CI:
\`\`\`yaml
build-docker:
  script:
    - VERSION=\$CI_COMMIT_SHA ./scripts/build-console-docker.sh all
\`\`\`

Jenkins:
\`\`\`groovy
sh 'VERSION=\${GIT_COMMIT} ./scripts/build-console-docker.sh all'
\`\`\`
EOF