#!/bin/bash

# Gemini CLI Installation Script
# This script helps install Gemini CLI for enhanced text parsing capabilities

echo "🚀 Installing Gemini CLI for enhanced text parsing..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed. Please install Node.js first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version (Gemini CLI requires Node.js 20+)
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version 20 or higher is required. Current version: $(node -v)"
    echo "Please upgrade Node.js to version 20 or higher."
    exit 1
fi

echo "✅ Node.js version check passed: $(node -v)"

# Try to install Gemini CLI using npm
echo "📦 Installing Gemini CLI via npm..."
if npm install -g @google/gemini-cli; then
    echo "✅ Gemini CLI installed successfully via npm"
else
    echo "⚠️ npm installation failed, trying alternative methods..."
    
    # Try using npx
    echo "🔄 Trying npx installation..."
    if npx @google/gemini-cli --version &> /dev/null; then
        echo "✅ Gemini CLI available via npx"
    else
        echo "❌ Failed to install Gemini CLI"
        echo ""
        echo "📋 Manual Installation Options:"
        echo "1. Visit https://github.com/google-gemini/gemini-cli"
        echo "2. Follow the installation instructions"
        echo "3. Or run: npx @google/gemini-cli"
        echo ""
        echo "💡 The application will still work with fallback processing"
        exit 1
    fi
fi

# Test the installation
echo "🧪 Testing Gemini CLI installation..."
if gemini --version &> /dev/null; then
    echo "✅ Gemini CLI is working correctly!"
    echo ""
    echo "🎉 Installation complete! The application will now use Gemini CLI for enhanced text parsing."
    echo ""
    echo "📝 Next steps:"
    echo "1. Restart your development server"
    echo "2. Test the Gemini CLI integration on the dashboard"
    echo "3. The app will automatically use Gemini CLI when available"
else
    echo "⚠️ Gemini CLI installation may have issues"
    echo "The application will use fallback processing"
fi

echo ""
echo "🔗 For more information:"
echo "https://github.com/google-gemini/gemini-cli" 