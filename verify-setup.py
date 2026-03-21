#!/usr/bin/env python3
"""
Verification script to check if all services are properly configured and running
"""

import sys
import time
import requests
from pathlib import Path

def check_service(name, url, timeout=5):
    """Check if a service is running"""
    try:
        response = requests.get(url, timeout=timeout)
        print(f"✅ {name}: OK ({response.status_code})")
        return True
    except requests.exceptions.ConnectionError:
        print(f"❌ {name}: Connection refused")
        return False
    except requests.exceptions.Timeout:
        print(f"❌ {name}: Timeout")
        return False
    except Exception as e:
        print(f"❌ {name}: {str(e)}")
        return False

def check_files():
    """Check if required files exist"""
    print("\n📁 Checking required files...")
    
    files = [
        ("Backend scheduler service", "Backend/services/schedulerService.js"),
        ("Python optimizer", "Backend/optimizer/scheduler.py"),
        ("Optimizer requirements", "Backend/optimizer/requirements.txt"),
        ("Frontend pages", "Frontend/src/app/pages/GenerateTimetable.tsx"),
    ]
    
    all_exist = True
    for name, path in files:
        exists = Path(path).exists()
        status = "✅" if exists else "❌"
        print(f"{status} {name}: {path}")
        all_exist = all_exist and exists
    
    return all_exist

def check_python():
    """Check if Python is available"""
    try:
        import subprocess
        result = subprocess.run([sys.executable, "--version"], capture_output=True, text=True)
        version = result.stdout.strip()
        print(f"✅ Python: {version}")
        return True
    except:
        print(f"❌ Python: Not found")
        return False

def check_ortools():
    """Check if ortools is installed"""
    try:
        import ortools
        print(f"✅ OR-Tools: Installed")
        return True
    except ImportError:
        print(f"❌ OR-Tools: Not installed (run: pip install ortools)")
        return False

def main():
    print("=" * 50)
    print("  Timetable Scheduler Verification")
    print("=" * 50)
    
    # Check files
    files_ok = check_files()
    
    # Check Python
    print("\n🐍 Checking Python environment...")
    python_ok = check_python()
    
    # Check OR-Tools
    ortools_ok = check_ortools()
    
    # Check services
    print("\n🚀 Checking running services...")
    print("   (Make sure services are started with: npm run dev in Backend & python scheduler.py in Backend/optimizer)")
    time.sleep(1)
    
    frontend_ok = check_service("Frontend", "http://localhost:5175", timeout=2)
    backend_ok = check_service("Backend API", "http://localhost:3001/api/faculty", timeout=2)
    optimizer_ok = check_service("Optimizer", "http://localhost:8000/health", timeout=2)
    
    # Summary
    print("\n" + "=" * 50)
    print("  Summary")
    print("=" * 50)
    
    checks = [
        ("Files", files_ok),
        ("Python", python_ok),
        ("OR-Tools", ortools_ok),
        ("Frontend Service", frontend_ok),
        ("Backend Service", backend_ok),
        ("Optimizer Service", optimizer_ok),
    ]
    
    all_ok = all(status for _, status in checks)
    
    for name, status in checks:
        symbol = "✅" if status else "❌"
        print(f"{symbol} {name}")
    
    print("=" * 50)
    
    if all_ok:
        print("\n🎉 All systems operational! Ready to generate timetables.")
        return 0
    else:
        print("\n⚠️  Some checks failed. See above for details.")
        if not python_ok:
            print("   → Install Python 3.8+ from https://www.python.org")
        if not ortools_ok:
            print("   → Run: pip install -r Backend/optimizer/requirements.txt")
        if not (frontend_ok and backend_ok and optimizer_ok):
            print("   → Start services:")
            print("     - Backend/optimizer: python scheduler.py")
            print("     - Backend: npm run dev")
            print("     - Frontend: npm run dev")
        return 1

if __name__ == "__main__":
    sys.exit(main())
