# NeuroSketch - Quick Start Guide

## 🚀 Getting Started in 60 Seconds

### Step 1: Start the Server (Choose ONE method)

**Option A - Automated Script (Easiest)**:
```bash
./start-server.sh
```
Then open the URL shown in your browser.

**Option B - Manual Python**:
```bash
python3 -m http.server 8000
```
Then go to: `http://localhost:8000/index.html`

**Option C - VS Code**:
1. Install "Live Server" extension
2. Right-click `index.html` → "Open with Live Server"

---

### Step 2: Create Your First Diagram

**Draw a Neuron**:
1. Click **Triangle** button (△) - Draw pyramidal soma
2. Click **Basal Dendrite** (—) - Draw dendrites from soma
3. Click **Unmyelinated Axon** (∿) - Draw axon from soma
4. Click **Text Tool** (T) - Add labels

**Add an Action Potential Graph**:
1. Click **Graph Tool** button (📈)
2. Drag on canvas to create graph
3. Select graph → Properties panel on right
4. Choose "Graph Type" → "Action Potential"
5. Choose "Preset" → "Standard"

---

## ⌨️ Essential Shortcuts

| Action | Shortcut |
|--------|----------|
| **Select** | V or click Select tool |
| **Pan** | Spacebar + Drag |
| **Zoom** | Cmd/Ctrl + Scroll |
| **Undo** | Cmd/Ctrl + Z |
| **Save** | Cmd/Ctrl + S |
| **Export** | Cmd/Ctrl + E |
| **Delete** | Delete or Backspace |
| **Deselect** | Escape |

---

## 🔧 Common Issues

**"Module loading failed"**:
- You **MUST** use a web server
- Try: `./start-server.sh`
- Cannot open file directly in browser

**"Can't resize shapes"**:
- Click shape to select it first
- Drag white square handles at corners/edges
- Handles are now 75% larger (easier to grab)

**"Python server fails"**:
- Try the automated script: `./start-server.sh`
- Or use PHP: `php -S localhost:8000`
- Or VS Code Live Server extension

---

## 📐 Tools Reference

### Basic Shapes
- **Circle** (○) - Click and drag
- **Rectangle** (□) - Click and drag
- **Line** (/) - Click start, drag to end
- **Text** (T) - Click to place, double-click to edit

### Neuronal Components
- **Triangle** (△) - Pyramidal soma
- **Hexagon** (⬡) - Multipolar soma
- **Bipolar Soma** - Sensory neuron soma
- **Basal Dendrite** (—) - Tapered, with spines
- **Apical Dendrite** (↑) - Pyramidal neuron dendrite
- **Unmyelinated Axon** (∿) - Smooth, constant width
- **Myelinated Axon** (═) - Segmented with nodes
- **Axon Hillock** (▷) - AP initiation site

### Advanced Tools
- **Graph** (📈) - Scientific graphs with 6 presets
- **Freehand** (✏️) - Free drawing with Bezier curves

---

## 💾 Saving & Exporting

**Save Project**:
- Cmd/Ctrl + S or "Save" button
- Saves as `.neuro` JSON file
- Preserves all objects and properties

**Export Image**:
- Cmd/Ctrl + E or "Export" button
- Exports current view as PNG
- Use for presentations, videos, publications

---

## 🎓 Learning Path

**Beginner** (10 minutes):
1. Draw basic shapes (circle, rectangle, line)
2. Practice select, move, resize
3. Add text labels
4. Export as PNG

**Intermediate** (20 minutes):
5. Draw a simple neuron (soma + dendrites + axon)
6. Add an action potential graph
7. Customize colors and sizes
8. Use pan and zoom

**Advanced** (30 minutes):
9. Create complete neural circuit
10. Add myelinated axons with nodes of Ranvier
11. Layer multiple neurons
12. Create educational animation frames

---

## ✨ Pro Tips

1. **Use Grid for Alignment**: Click "Show Grid" in Canvas panel
2. **Multi-Select**: Drag rectangular selection box around objects
3. **Duplicate**: Cmd/Ctrl + D for quick copies
4. **Precision**: Hold Shift while resizing to maintain proportions
5. **Layers**: Objects drawn later appear on top (use Cmd/Ctrl + Z to undo and redraw)

---

## 📚 Full Documentation

For complete feature documentation, see:
- `README.md` - Full setup and feature guide
- `docs/neurosketchPRP.md` - Product requirements and specifications
- `BUG_FIXES_OCT2025.md` - Recent fixes and improvements

---

## 🆘 Need Help?

**If something doesn't work**:
1. Check browser console (F12) for errors
2. Ensure web server is running
3. Try hard refresh (Cmd/Ctrl + Shift + R)
4. Read `README.md` troubleshooting section

**Common Mistakes**:
- ❌ Opening `index.html` directly (use server!)
- ❌ Forgetting to select shape before resizing
- ❌ Using too high zoom level (handles harder to grab)

---

**You're ready! Start creating neuroscience diagrams now.** 🧠✨

*Version: Production Ready - October 2025*
