# Mapbox Integration Guide

## Overview

This guide explains how to integrate fully embedded Mapbox maps with turn-by-turn directions. There are two approaches:

1. **Intermediate Solution**: Use Mapbox tiles with `react-native-maps` (current implementation)
2. **Full Solution**: Use `@rnmapbox/maps` for native Mapbox GL integration (requires native build)

---

## Option 1: Mapbox Tiles with react-native-maps (Current)

This approach uses Mapbox tiles with the existing `react-native-maps` library. It works with Expo Go but has limited features.

### Implementation

The map component uses Mapbox tiles via `MapboxService.getTileUrlTemplate()`. This is already implemented in the codebase.

### Limitations

- No native Mapbox features (3D buildings, custom styles, etc.)
- Limited turn-by-turn navigation capabilities
- Uses Google Maps provider with Mapbox tiles

---

## Option 2: Full Mapbox GL Integration (Recommended for Production)

This approach uses the native Mapbox GL SDK for full-featured embedded maps.

### Prerequisites

1. **Custom Dev Client**: You need to create a custom development client (cannot use Expo Go)
2. **Native Build**: Requires `expo prebuild` or EAS Build
3. **Mapbox Account**: Get access token from [mapbox.com](https://www.mapbox.com)

### Step 1: Install Dependencies

```bash
npm install @rnmapbox/maps
```

### Step 2: Configure Native Settings

#### iOS Configuration

1. Add to `app.json`:
```json
{
  "expo": {
    "ios": {
      "config": {
        "MAPBOX_ACCESS_TOKEN": "your_mapbox_token_here"
      }
    }
  }
}
```

2. Add to `ios/Podfile` (after `expo prebuild`):
```ruby
pod 'Mapbox', '~> 6.0'
```

#### Android Configuration

1. Add to `app.json`:
```json
{
  "expo": {
    "android": {
      "config": {
        "MAPBOX_ACCESS_TOKEN": "your_mapbox_token_here"
      }
    }
  }
}
```

2. Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<application>
  <meta-data
    android:name="com.mapbox.token"
    android:value="your_mapbox_token_here" />
</application>
```

### Step 3: Create Custom Dev Client

```bash
npx expo install expo-dev-client
npx expo prebuild
```

### Step 4: Update Map Component

Replace the current map implementation with:

```typescript
import Mapbox from '@rnmapbox/maps';

// Initialize Mapbox
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN);

// In your component:
<Mapbox.MapView
  style={styles.map}
  styleURL={Mapbox.StyleURL.Street}
>
  <Mapbox.Camera
    zoomLevel={12}
    centerCoordinate={[longitude, latitude]}
    animationMode="flyTo"
    animationDuration={2000}
  />
  
  {/* Route Line */}
  <Mapbox.ShapeSource
    id="route"
    shape={{
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: routePolyline.map(([lat, lng]) => [lng, lat]), // Mapbox uses [lng, lat]
      },
    }}
  >
    <Mapbox.LineLayer
      id="routeLine"
      style={{
        lineColor: Colors.primary,
        lineWidth: 4,
        lineCap: 'round',
        lineJoin: 'round',
      }}
    />
  </Mapbox.ShapeSource>
  
  {/* Origin Marker */}
  <Mapbox.PointAnnotation
    id="origin"
    coordinate={[originLongitude, originLatitude]}
  >
    <View style={styles.markerContainer}>
      <View style={styles.markerDot} />
    </View>
  </Mapbox.PointAnnotation>
  
  {/* Destination Marker */}
  <Mapbox.PointAnnotation
    id="destination"
    coordinate={[destLongitude, destLatitude]}
  >
    <View style={styles.markerContainer}>
      <MapPin color={Colors.error} size={24} />
    </View>
  </Mapbox.PointAnnotation>
</Mapbox.MapView>
```

### Step 5: Turn-by-Turn Navigation

```typescript
const [currentStepIndex, setCurrentStepIndex] = useState(0);

// Update camera to current step
const updateCameraToStep = (stepIndex: number) => {
  const step = routeData.steps[stepIndex];
  if (step && step.coordinates.length > 0) {
    const [lat, lng] = step.coordinates[0];
    mapRef.current?.flyTo([lng, lat], 1000); // Mapbox uses [lng, lat]
  }
};

// Highlight current step on map
<Mapbox.ShapeSource
  id="currentStep"
  shape={{
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: currentStep.coordinates.map(([lat, lng]) => [lng, lat]),
    },
  }}
>
  <Mapbox.LineLayer
    id="currentStepLine"
    style={{
      lineColor: Colors.success,
      lineWidth: 6,
    }}
  />
</Mapbox.ShapeSource>
```

---

## Environment Variables

Add to your `.env` file:

```env
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
```

---

## Testing

1. **Development**: Use custom dev client (not Expo Go)
2. **Production**: Build with EAS Build or local build

---

## Troubleshooting

### Issue: Map not showing
- Check Mapbox access token is set correctly
- Verify token has proper permissions
- Check network connectivity

### Issue: Native module not found
- Run `npx expo prebuild` again
- Rebuild native apps
- Clear build cache

### Issue: Route not rendering
- Verify coordinates are in [lng, lat] format (not [lat, lng])
- Check route data structure matches Mapbox format
- Verify ShapeSource and LineLayer IDs are unique

---

## Migration Checklist

- [ ] Install `@rnmapbox/maps`
- [ ] Create custom dev client
- [ ] Configure native settings (iOS/Android)
- [ ] Update map component to use Mapbox GL
- [ ] Test route rendering
- [ ] Implement turn-by-turn navigation
- [ ] Test on physical devices
- [ ] Update production builds

---

## Resources

- [Mapbox GL React Native Docs](https://github.com/rnmapbox/maps)
- [Mapbox Directions API](https://docs.mapbox.com/api/navigation/directions/)
- [Expo Custom Dev Client](https://docs.expo.dev/clients/introduction/)

---

*Note: Full Mapbox GL integration requires native code and cannot be used with Expo Go. Use the custom dev client approach for development.*

