# 🚀 QUICK TEST GUIDE - 3D Brain Drag System

**Test URL:** http://localhost:8000/explore.html

---

## ⚡ 30-SECOND TEST

### **Step 1: Hover Test** (5 seconds)
1. Move mouse over white cube under brain
2. **✅ PASS:** Cube turns **CYAN**, cursor becomes **GRAB**
3. Move mouse away
4. **✅ PASS:** Cube turns **WHITE**, cursor becomes **DEFAULT**

### **Step 2: Drag Test** (10 seconds)
1. Click and drag the cyan cube
2. **✅ PASS:** Cube turns **GREEN**, cursor becomes **GRABBING**
3. Move mouse around
4. **✅ PASS:** Brain follows in XY plane
5. Release
6. **✅ PASS:** Cube turns **WHITE**

### **Step 3: Z-Lock Test** (10 seconds)
1. Open console (F12)
2. Drag the cube around
3. Release
4. **✅ PASS:** Console shows `zDrift: 0.000000`

### **Step 4: Rotation Test** (5 seconds)
1. Click and drag **BRAIN ITSELF** (not cube)
2. **✅ PASS:** Brain **ROTATES** (doesn't move in space)

---

## 🎯 VISUAL CHECKLIST

**You should see THREE states:**

1. **🤍 DEFAULT** - White cube, default cursor
2. **💙 HOVER** - Cyan cube, grab cursor  
3. **💚 DRAGGING** - Green cube, grabbing cursor

---

## 🔍 CONSOLE CHECKLIST

**Expected messages:**

```
✅ BrainViewer initialized
📦 Loading brain model from: /models/MVP-brain.glb
Loading: 100%
✅ Brain model loaded
✅ Drag handle created: {position: Vector3, size: 0.8, visible: true}
```

**When you click the cube:**
```
🖱️ DRAG HANDLE CLICKED! {distance: "X.XXX", point: Vector3}
📍 Drag started - Z locked at: 0.000
```

**When you release:**
```
🖱️ Drag released at position: {
    x: "X.XXX",
    y: "Y.XXX",
    z: "0.000",
    zLocked: "0.000",
    zDrift: "0.000000"  ← THIS SHOULD BE 0!
}
```

---

## ❌ FAIL CONDITIONS

**If you see any of these, something is broken:**

1. ❌ Cube doesn't change color on hover
2. ❌ Cube doesn't turn green when clicked
3. ❌ Brain moves in Z-axis (forward/back)
4. ❌ Console shows `zDrift > 0.000001`
5. ❌ Brain rotates when dragging cube
6. ❌ Can't rotate by clicking brain directly
7. ❌ Console errors or warnings

---

## 🛠️ DEBUG COMMAND

**If anything seems wrong:**

1. Open console
2. Type: `debugDrag()`
3. Press Enter
4. Check all values are correct:
   - `dragHandleExists: true`
   - `dragHandleVisible: true`
   - `isDragging: false` (when not dragging)
   - `orbitControlsEnabled: true` (when not dragging)

---

## ✅ SUCCESS!

**All tests pass?** 

**🎉 Drag system is working perfectly!**

The brain can now be moved in XY plane via the drag handle, while rotation via OrbitControls is completely preserved and independent.

---

**Testing Time:** ~30 seconds  
**Difficulty:** Beginner-friendly  
**Tools Required:** Browser + F12 console
