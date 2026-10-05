import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { View } from 'react-native';

import type { SphereCanvasProps } from './SphereCanvas';

/** On web, Skia's CanvasKit has to load before the sphere can draw. */
export default function SphereCanvasHost(props: SphereCanvasProps) {
  return (
    <WithSkiaWeb
      opts={{ locateFile: () => '/canvaskit.wasm' }}
      getComponent={() => import('./SphereCanvas')}
      fallback={<View style={{ width: props.size, height: props.size }} />}
      componentProps={props}
    />
  );
}
