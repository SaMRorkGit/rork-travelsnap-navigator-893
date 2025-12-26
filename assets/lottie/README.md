# Lottie Animation Assets

This directory contains Lottie animation files for the TravelSnap app.

## Onboarding Screen 2 Animation

**File:** `onboarding-visual.json`

**Usage:**
Once you've created the Lottie animation using the prompt in `/LOTTIE_PROMPT.md`:

1. Save the Lottie JSON file as `onboarding-visual.json` in this directory
2. The `VisualNavigationDemoLottie` component will automatically load it
3. Update `app/onboarding.tsx` to use `VisualNavigationDemoLottie` instead of `VisualNavigationDemo`

## Integration Steps

1. **Create the animation** using Rork/Nano Banana toolkit with the prompt from `/LOTTIE_PROMPT.md`
2. **Download the JSON file** and save it as `assets/lottie/onboarding-visual.json`
3. **Update onboarding.tsx:**
   ```tsx
   // Change this import:
   import VisualNavigationDemo from "@/components/VisualNavigationDemo";
   
   // To this:
   import VisualNavigationDemoLottie from "@/components/VisualNavigationDemoLottie";
   
   // And in the render, change:
   <VisualNavigationDemo />
   
   // To:
   <VisualNavigationDemoLottie />
   ```

## File Format

- Format: Lottie JSON (.json)
- Recommended size: Optimized for mobile (under 500KB if possible)
- Aspect ratio: 1:1 (square)
- Loop: Seamless infinite loop
