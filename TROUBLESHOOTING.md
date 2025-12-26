# Troubleshooting Guide

## "Failed to download remote update" Error

### Problem
The app shows a fatal error: `java.io.IOException: Failed to download remote update`

### Root Cause
This error occurs when the Rork toolkit or Expo Updates tries to download an OTA (Over-The-Air) update but fails due to:
- Network connectivity issues
- Server unavailability
- Timeout during download
- Invalid update manifest

### Solution Implemented

1. **Update Configuration** (`app.json`)
   - Set `checkAutomatically: "ON_ERROR_RECOVERY"` - only checks for updates after errors
   - Set `fallbackToCacheTimeout: 0` - immediately falls back to cached version

2. **Error Handling** (`app/_layout.tsx`)
   - Added global error handler to catch update-related errors
   - Update failures are treated as non-fatal
   - App continues with cached version

3. **Error Boundary** (`components/ErrorBoundary.tsx`)
   - Filters out update download errors
   - Prevents error screen from showing for update failures

### How It Works Now

- ✅ Update download failures are caught and logged as warnings
- ✅ App continues running with the cached/embedded version
- ✅ No fatal error screen for update failures
- ✅ App remains functional even if updates can't be downloaded

### Additional Troubleshooting

#### If error persists:

1. **Check Network Connection**
   ```bash
   # Ensure device has internet connectivity
   # Try on WiFi vs cellular data
   ```

2. **Clear App Cache**
   - Android: Settings > Apps > TravelSnap Navigator > Clear Cache
   - iOS: Delete and reinstall app

3. **Disable Updates Temporarily** (Development)
   ```json
   // In app.json
   "updates": {
     "enabled": false
   }
   ```

4. **Check Rork Server Status**
   - Verify Rork toolkit server is accessible
   - Check if project ID `5pqg4lv8pwncaw82ntkxc` is valid

5. **Use Development Build**
   ```bash
   # Instead of Expo Go, use development build
   npx expo run:android
   # or
   npx expo run:ios
   ```

### Testing

After applying the fix:
1. ✅ App should start even if update download fails
2. ✅ No fatal error screen for update errors
3. ✅ App uses cached version when updates unavailable
4. ✅ Console shows warning instead of error

---

## Other Common Issues

### Voice Input Not Working

**Symptoms**: Microphone permission denied or no audio recorded

**Solutions**:
1. Check app permissions in device settings
2. Grant microphone permission when prompted
3. Restart app after granting permissions

### Map Not Displaying

**Symptoms**: Blank map or "Map preview available on mobile" message

**Solutions**:
1. Verify Mapbox access token is set: `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`
2. Check network connectivity
3. Verify token has proper permissions in Mapbox dashboard

### Location Services Not Working

**Symptoms**: "Location permission is required" error

**Solutions**:
1. Grant location permissions in device settings
2. Enable location services on device
3. Check if app has background location permission if needed

---

*Last Updated: 2024*

