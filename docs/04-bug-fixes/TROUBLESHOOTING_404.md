# 🐛 Troubleshooting 404 Error

## Quick Diagnosis

### Step 1: Check How You're Running NeuroSketch

❌ **WRONG** - Opening file directly:
```
file:///Users/benross-murphy/Documents/PROJECTS/NeuroSketch/index.html
```
**Problem**: ES6 modules don't work with `file://` protocol due to CORS restrictions.

✅ **CORRECT** - Using HTTP server:
```
http://localhost:8000/
http://localhost:8000/index.html
```

---

## Solution: Start HTTP Server

### Option 1: Use start-server.sh (Easiest)
```bash
cd /Users/benross-murphy/Documents/PROJECTS/NeuroSketch
./start-server.sh
```

Then open: **http://localhost:8000/**

### Option 2: Manual Python Server
```bash
cd /Users/benross-murphy/Documents/PROJECTS/NeuroSketch
python3 -m http.server 8000
```

Then open: **http://localhost:8000/**

### Option 3: VS Code Live Server
1. Install "Live Server" extension in VS Code
2. Right-click `index.html`
3. Select "Open with Live Server"

---

## Diagnostic Tests

### Test 1: Verify Server is Running
```bash
curl http://localhost:8000/
```

**Expected**: HTML content appears
**If fails**: Server not running - start it using options above

### Test 2: Test Import Compatibility
Open: **http://localhost:8000/test-imports.html**

This will test all imports and show which files are missing or have errors.

**Expected**: All green checkmarks ✅
**If red X**: Note which file fails and check:
1. File exists
2. No syntax errors
3. Correct export statements

### Test 3: Check Browser Console
1. Open **http://localhost:8000/index.html**
2. Press **F12** (open DevTools)
3. Click **Console** tab
4. Look for errors

**Common errors**:
- `Failed to load module script: Expected a JavaScript module script`
  → You're using `file://` instead of `http://`
  
- `404 Not Found: /src/tools/SomeTool.js`
  → File doesn't exist or path is wrong
  
- `Uncaught SyntaxError: Unexpected token`
  → Syntax error in JavaScript file

### Test 4: Network Tab
1. Open DevTools (F12)
2. Click **Network** tab
3. Refresh page (Ctrl+R / Cmd+R)
4. Look for red items (404 errors)
5. Click on failed requests to see which files

---

## Common Issues & Fixes

### Issue 1: Port 8000 Already in Use
**Error**: `Address already in use`

**Fix**:
```bash
# Kill existing server
lsof -ti:8000 | xargs kill -9

# Or use different port
python3 -m http.server 8001
# Then open http://localhost:8001/
```

### Issue 2: File Not Found Despite Existing
**Cause**: Case-sensitive file systems

**Fix**: Check exact capitalization
```bash
# Check actual filename
ls -la src/tools/SelectTool.js

# Should match import exactly
import { SelectTool } from './src/tools/SelectTool.js';
```

### Issue 3: Module Import Errors
**Error**: `Failed to resolve module specifier`

**Cause**: Missing `.js` extension or wrong path

**Fix**: All imports must have `.js` extension
```javascript
// ❌ WRONG
import { Tool } from './src/tools/base/Tool';

// ✅ CORRECT
import { Tool } from './src/tools/base/Tool.js';
```

### Issue 4: CORS Errors
**Error**: `Cross-Origin Request Blocked`

**Cause**: Using `file://` protocol

**Fix**: MUST use HTTP server (see options above)

---

## Verify All Files Exist

Run this command to check all new architecture files:
```bash
cd /Users/benross-murphy/Documents/PROJECTS/NeuroSketch

# Core files
ls -la src/core/StateMachine.js
ls -la src/core/EventEmitter.js
ls -la src/core/ToolManager.js
ls -la src/core/CommandHistory.js
ls -la src/objects/BaseObject.js
ls -la src/tools/base/Tool.js

# Tool files
ls -la src/tools/SelectTool.js
ls -la src/tools/CircleTool.js
ls -la src/tools/RectangleTool.js
ls -la src/tools/LineTool.js
ls -la src/tools/TriangleTool.js
ls -la src/tools/HexagonTool.js
```

**Expected**: All files shown with size > 0 bytes

---

## Quick Fix Checklist

- [ ] Server is running (port 8000)
- [ ] Accessing via `http://localhost:8000/` (not `file://`)
- [ ] Browser console shows no errors
- [ ] test-imports.html shows all green checkmarks
- [ ] All files exist and have content

---

## Still Having Issues?

### Get Detailed Logs
```bash
cd /Users/benross-murphy/Documents/PROJECTS/NeuroSketch

# Start server with logging
python3 -m http.server 8000 > server.log 2>&1 &

# Load page in browser, then check log
cat server.log
```

Look for:
- `404` errors → File not found
- `200` success → File loaded correctly

### Check Specific Import
```bash
# Test if file is accessible
curl http://localhost:8000/src/tools/CircleTool.js

# Should show JavaScript code
# If shows 404, file doesn't exist or path is wrong
```

---

## Emergency Reset

If nothing works, verify integration:

```bash
cd /Users/benross-murphy/Documents/PROJECTS/NeuroSketch

# Check if all tool imports are in app.js
grep "SelectTool" app.js
grep "CircleTool" app.js

# Should see:
# import { SelectTool } from './src/tools/SelectTool.js';
# import { CircleTool } from './src/tools/CircleTool.js';
```

---

## Success Indicators

When working correctly, you should see:

### Console Output
```
Initializing core architecture systems...
Registering tools...
✅ Registered 9 tools
Canvas: <canvas#canvas>
✅ NeuroSketch initialization complete!
```

### No Errors
- No red text in console
- No 404s in Network tab
- All imports load successfully

---

## Contact Info

If still broken, provide:
1. **URL you're accessing** (exact URL from browser)
2. **Console errors** (copy-paste full error)
3. **Network tab** (screenshot of failed requests)
4. **Output of**: `ls -la src/tools/`

This will help diagnose the exact issue.
