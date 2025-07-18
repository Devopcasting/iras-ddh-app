#!/bin/bash

# IRAS-DDH Audio Preview Environment Setup Script
# This script sets up the audio preview directory and permissions

echo "🎵 Setting up IRAS-DDH Audio Preview Environment..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script must be run as root (use sudo)"
    exit 1
fi

# Create the audio preview directory
AUDIO_PREVIEW_DIR="/var/www/html/audio_preview"

echo "📁 Creating audio preview directory: $AUDIO_PREVIEW_DIR"
mkdir -p "$AUDIO_PREVIEW_DIR"

# Set proper permissions for the directory
echo "🔐 Setting directory permissions..."
chmod 755 "$AUDIO_PREVIEW_DIR"

# Detect the current user (who will be running the backend)
CURRENT_USER=$(logname 2>/dev/null || echo "$SUDO_USER" || echo "$USER")
if [ -z "$CURRENT_USER" ]; then
    echo "⚠️  Could not detect current user, using 'myuser' as default"
    CURRENT_USER="myuser"
fi

echo "👤 Detected current user: $CURRENT_USER"

# Try to detect the web server user
if id "www-data" &>/dev/null; then
    WEB_USER="www-data"
elif id "apache" &>/dev/null; then
    WEB_USER="apache"
elif id "nginx" &>/dev/null; then
    WEB_USER="nginx"
else
    echo "⚠️  Could not detect web server user, using current user"
    WEB_USER="$CURRENT_USER"
fi

echo "🌐 Web server user: $WEB_USER"

# Set ownership to current user (for backend access)
echo "🔑 Setting ownership to current user: $CURRENT_USER"
chown -R "$CURRENT_USER:$CURRENT_USER" "$AUDIO_PREVIEW_DIR"

# Add web server user to the current user's group for web access
if [ "$WEB_USER" != "$CURRENT_USER" ]; then
    echo "🔗 Adding web server user to current user's group for web access..."
    usermod -a -G "$CURRENT_USER" "$WEB_USER" 2>/dev/null || echo "⚠️  Could not add web server user to group (may already be added)"
fi

# Create a test file to verify permissions
TEST_FILE="$AUDIO_PREVIEW_DIR/test.txt"
echo "🧪 Creating test file to verify permissions..."
echo "test" > "$TEST_FILE"
chmod 644 "$TEST_FILE"
chown "$CURRENT_USER:$CURRENT_USER" "$TEST_FILE"

# Test if the file is accessible by current user
if [ -r "$TEST_FILE" ]; then
    echo "✅ Test file created successfully"
    rm "$TEST_FILE"
else
    echo "❌ Failed to create test file"
    exit 1
fi

# Test if web server can access the directory (if different user)
if [ "$WEB_USER" != "$CURRENT_USER" ]; then
    echo "🧪 Testing web server access..."
    if sudo -u "$WEB_USER" test -r "$AUDIO_PREVIEW_DIR"; then
        echo "✅ Web server can access the directory"
    else
        echo "⚠️  Web server may have limited access to the directory"
    fi
fi

# Create a cleanup script
CLEANUP_SCRIPT="/usr/local/bin/cleanup_audio_preview.sh"
echo "🧹 Creating cleanup script: $CLEANUP_SCRIPT"

cat > "$CLEANUP_SCRIPT" << 'EOF'
#!/bin/bash

# Audio Preview Cleanup Script
# This script cleans up old audio files from the preview directory

AUDIO_PREVIEW_DIR="/var/www/html/audio_preview"

if [ ! -d "$AUDIO_PREVIEW_DIR" ]; then
    echo "Audio preview directory does not exist: $AUDIO_PREVIEW_DIR"
    exit 1
fi

# Find and remove all MP3 files older than 1 hour
find "$AUDIO_PREVIEW_DIR" -name "*.mp3" -type f -mmin +60 -delete

echo "Cleaned up old audio files from $AUDIO_PREVIEW_DIR"
EOF

chmod +x "$CLEANUP_SCRIPT"

# Set up a cron job to clean up old files every hour
echo "⏰ Setting up cron job for automatic cleanup..."
CRON_JOB="0 * * * * $CLEANUP_SCRIPT"

# Check if cron job already exists
if ! crontab -l 2>/dev/null | grep -q "$CLEANUP_SCRIPT"; then
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "✅ Cron job added for hourly cleanup"
else
    echo "ℹ️  Cron job already exists"
fi

# Summary
echo ""
echo "🎉 IRAS-DDH Audio Preview Environment Setup Complete!"
echo ""
echo "📋 Summary:"
echo "   • Audio preview directory: $AUDIO_PREVIEW_DIR"
echo "   • Directory permissions: 755"
echo "   • Owner: $CURRENT_USER (backend user)"
echo "   • Web server user: $WEB_USER"
echo "   • Cleanup script: $CLEANUP_SCRIPT"
echo "   • Cron job: Hourly cleanup of old files"
echo ""
echo "🔧 Permission Fix Applied:"
echo "   • Backend user ($CURRENT_USER) now has full access to write audio files"
echo "   • Web server can still serve files from the directory"
echo ""
echo "🧹 Manual cleanup: $CLEANUP_SCRIPT"
echo "📁 Audio files location: $AUDIO_PREVIEW_DIR"
echo ""
echo "💡 If you encounter permission issues:"
echo "   • Run this script again: sudo ./setup_audio_preview.sh"
echo "   • Or manually: sudo chown $CURRENT_USER:$CURRENT_USER $AUDIO_PREVIEW_DIR" 