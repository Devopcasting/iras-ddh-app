#!/bin/bash

# Setup script for ISL Videos directory
# This script creates the ISL videos directory and sets up cleanup functionality

echo "🚀 Setting up ISL Videos environment..."

# Create ISL videos directory
ISL_VIDEOS_DIR="/var/www/html/isl_videos"

echo "📁 Creating ISL videos directory: $ISL_VIDEOS_DIR"

# Try to create directory with sudo if needed
if ! mkdir -p "$ISL_VIDEOS_DIR" 2>/dev/null; then
    echo "⚠️  Permission denied. Trying with sudo..."
    if sudo mkdir -p "$ISL_VIDEOS_DIR"; then
        echo "✅ Created ISL videos directory with sudo"
    else
        echo "❌ Failed to create ISL videos directory. Please run with sudo or create manually."
        exit 1
    fi
else
    echo "✅ Created ISL videos directory"
fi

# Set permissions
echo "🔐 Setting permissions for ISL videos directory..."
if ! chmod 755 "$ISL_VIDEOS_DIR" 2>/dev/null; then
    if sudo chmod 755 "$ISL_VIDEOS_DIR"; then
        echo "✅ Set permissions with sudo"
    else
        echo "❌ Failed to set permissions"
        exit 1
    fi
else
    echo "✅ Set permissions"
fi

# Set ownership to www-data (or current user if www-data doesn't exist)
if id "www-data" &>/dev/null; then
    echo "👤 Setting ownership to www-data..."
    if ! chown www-data:www-data "$ISL_VIDEOS_DIR" 2>/dev/null; then
        if sudo chown www-data:www-data "$ISL_VIDEOS_DIR"; then
            echo "✅ Set ownership to www-data with sudo"
        else
            echo "⚠️  Failed to set ownership to www-data, using current user"
            if ! chown $(whoami):$(whoami) "$ISL_VIDEOS_DIR" 2>/dev/null; then
                sudo chown $(whoami):$(whoami) "$ISL_VIDEOS_DIR"
            fi
        fi
    else
        echo "✅ Set ownership to www-data"
    fi
else
    echo "👤 Setting ownership to current user..."
    if ! chown $(whoami):$(whoami) "$ISL_VIDEOS_DIR" 2>/dev/null; then
        sudo chown $(whoami):$(whoami) "$ISL_VIDEOS_DIR"
    fi
    echo "✅ Set ownership to current user"
fi

# Create cleanup script
CLEANUP_SCRIPT="/usr/local/bin/cleanup_isl_videos.sh"
echo "🧹 Creating cleanup script: $CLEANUP_SCRIPT"

cat > /tmp/cleanup_isl_videos.sh << 'EOF'
#!/bin/bash

# Cleanup script for ISL video files
# Removes ISL video files older than 1 hour

ISL_VIDEOS_DIR="/var/www/html/isl_videos"
BACKUP_DIR="isl_videos"

# Function to cleanup directory
cleanup_directory() {
    local dir="$1"
    if [ -d "$dir" ]; then
        echo "Cleaning up $dir..."
        find "$dir" -name "*.mp4" -type f -mmin +60 -delete
        echo "Cleanup completed for $dir"
    fi
}

# Cleanup main directory
cleanup_directory "$ISL_VIDEOS_DIR"

# Cleanup backup directory (if running from backend)
if [ -d "$BACKUP_DIR" ]; then
    cleanup_directory "$BACKUP_DIR"
fi

echo "ISL video cleanup completed at $(date)"
EOF

# Move cleanup script to system location
if ! mv /tmp/cleanup_isl_videos.sh "$CLEANUP_SCRIPT" 2>/dev/null; then
    if sudo mv /tmp/cleanup_isl_videos.sh "$CLEANUP_SCRIPT"; then
        echo "✅ Created cleanup script with sudo"
    else
        echo "❌ Failed to create cleanup script"
        exit 1
    fi
else
    echo "✅ Created cleanup script"
fi

# Make cleanup script executable
if ! chmod +x "$CLEANUP_SCRIPT" 2>/dev/null; then
    if sudo chmod +x "$CLEANUP_SCRIPT"; then
        echo "✅ Made cleanup script executable with sudo"
    else
        echo "❌ Failed to make cleanup script executable"
        exit 1
    fi
else
    echo "✅ Made cleanup script executable"
fi

# Set up cron job for automatic cleanup (every 30 minutes)
echo "⏰ Setting up cron job for automatic cleanup..."

# Create temporary cron entry
CRON_ENTRY="*/30 * * * * $CLEANUP_SCRIPT"

# Check if cron job already exists
if ! crontab -l 2>/dev/null | grep -q "cleanup_isl_videos.sh"; then
    # Add to crontab
    if (crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -; then
        echo "✅ Added cron job for automatic cleanup (every 30 minutes)"
    else
        echo "⚠️  Failed to add cron job. You may need to add it manually:"
        echo "   Run: crontab -e"
        echo "   Add: $CRON_ENTRY"
    fi
else
    echo "✅ Cron job already exists"
fi

echo ""
echo "🎉 ISL Videos environment setup completed!"
echo ""
echo "📋 Summary:"
echo "   • ISL videos directory: $ISL_VIDEOS_DIR"
echo "   • Cleanup script: $CLEANUP_SCRIPT"
echo "   • Automatic cleanup: Every 30 minutes"
echo ""
echo "🔧 Manual cleanup:"
echo "   • Run: $CLEANUP_SCRIPT"
echo ""
echo "📝 Notes:"
echo "   • ISL videos will be automatically cleaned up after 1 hour"
echo "   • If permission issues occur, the system will fallback to backend directory"
echo "   • Make sure FFmpeg is installed for video generation"
echo "" 