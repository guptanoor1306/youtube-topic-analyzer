#!/bin/bash

echo "🚀 YouTube Topic Analyzer - Quick Deployment Script"
echo "===================================================="
echo ""

# Check if we're in the right directory
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📦 Step 1: Building Frontend..."
cd frontend
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

echo "✅ Frontend built successfully!"
echo ""

echo "🔧 Step 2: Testing Frontend Build..."
echo "Starting preview server on http://localhost:4173"
echo "Press Ctrl+C after verifying it works"
npm run preview &
PREVIEW_PID=$!

sleep 3
echo ""
echo "👀 Check if preview works at http://localhost:4173"
echo "Press Enter to continue after verification..."
read

kill $PREVIEW_PID 2>/dev/null

echo ""
echo "📝 Step 3: Git Setup"
echo "===================="

if [ ! -d ".git" ]; then
    echo "Initializing git repository..."
    cd ..
    git init
    
    # Create .gitignore
    cat > .gitignore << 'EOF'
# Dependencies
**/node_modules/
**/venv/
**/.env

# Build outputs
**/dist/
**/build/
**/__pycache__/
**/*.pyc

# Logs
**/backend_live.log
**/*.log

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
EOF

    git add .
    git commit -m "Initial commit: YouTube Topic Analyzer"
    
    echo ""
    echo "✅ Git repository initialized"
else
    echo "Git repository already exists"
fi

echo ""
echo "📤 Step 4: Push to GitHub"
echo "========================="
echo ""
echo "Please create a new repository on GitHub and then run:"
echo ""
echo "  git remote add origin YOUR_GITHUB_REPO_URL"
echo "  git push -u origin main"
echo ""

echo "🌐 Step 5: Deploy to Vercel"
echo "============================"
echo ""
echo "1. Go to https://vercel.com/new"
echo "2. Import your GitHub repository"
echo "3. Configure:"
echo "   - Framework: Vite"
echo "   - Root Directory: frontend"
echo "   - Build Command: npm run build"
echo "   - Output Directory: dist"
echo ""
echo "4. Add Environment Variable:"
echo "   VITE_API_URL = http://YOUR_LOCAL_IP:8000"
echo ""
echo "5. Click Deploy!"
echo ""

echo "🖥️  Step 6: Get Your Local IP"
echo "=============================="
echo ""
echo "Your local IP address:"
if [[ "$OSTYPE" == "darwin"* ]]; then
    ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null
else
    hostname -I | awk '{print $1}'
fi
echo ""

echo "✅ Deployment Preparation Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Push code to GitHub"
echo "2. Deploy frontend to Vercel"
echo "3. Make sure backend is running locally"
echo "4. Share the Vercel URL with your team!"
echo ""
echo "💡 Tip: Keep your backend running with:"
echo "   cd backend && source venv/bin/activate && python main.py"
echo ""

cd ..

