import React from 'react';
import { WidgetShell } from '@widget-factory/primitives';
import { Text } from '@widget-factory/primitives';
import { Icon } from '@widget-factory/primitives';

export default function Widget() {
  return (
    <WidgetShell backgroundColor="#f2f2f7" borderRadius={20} padding={16}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
      <div style={{ display: 'flex', flexDirection: 'row', gap: 8, flex: 0, justifyContent: 'space-between', alignItems: 'center' }}>
        <Text fontSize={18} color="#000000" fontWeight={700} flex={1}>Batteries</Text>
        <Icon size={18} color="#8e8e93" name="sf:battery.100percent" flex="none" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 10, flex: 0, alignItems: 'center' }}>
          <Icon size={28} color="#34C759" name="sf:iphone" flex="none" />
          <Text fontSize={15} color="#000000" flex={1}>iPhone</Text>
          <Text fontSize={15} color="#000000" fontWeight={600} flex={0}>85%</Text>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 10, flex: 0, alignItems: 'center' }}>
          <Icon size={28} color="#FF9500" name="sf:airpods.gen3" flex="none" />
          <Text fontSize={15} color="#000000" flex={1}>AirPods</Text>
          <Text fontSize={15} color="#000000" fontWeight={600} flex={0}>67%</Text>
        </div>
      </div>
    </div>
    </WidgetShell>
  );
}
