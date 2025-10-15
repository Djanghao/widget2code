import React from 'react';
import { WidgetShell } from '@widget-factory/primitives';
import { Text } from '@widget-factory/primitives';
import { Icon } from '@widget-factory/primitives';

export default function Widget() {
  return (
    <WidgetShell backgroundColor="#4A90E2" borderRadius={20} padding={16} width={198} height={198}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', flexDirection: 'row', gap: 6, flex: 0, alignItems: 'center' }}>
        <Text fontSize={16} color="#ffffff" fontWeight={600} flex={1}>Cupertino</Text>
        <Icon size={14} color="#ffffff" name="sf:paperplane.fill" flex="none" />
      </div>
      <Text fontSize={64} color="#ffffff" fontWeight={200} flex={0}>70°</Text>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 8, flex: 0, alignItems: 'center' }}>
          <Icon size={24} color="#FFD60A" name="sf:sun.max.fill" flex="none" />
          <Text fontSize={16} color="#ffffff" flex={0}>Sunny</Text>
        </div>
        <Text fontSize={14} color="#ffffff" flex={0}>H:75° L:59°</Text>
      </div>
    </div>
    </WidgetShell>
  );
}
