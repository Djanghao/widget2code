import React from 'react';
import { Icon } from '@widget-factory/primitives';

const sfIconCategories = {
  'Common Symbols': ['circle.fill', 'checkmark', 'xmark', 'checkmark.circle.fill', 'xmark.circle.fill', 'exclamationmark.triangle.fill', 'exclamationmark.circle.fill', 'questionmark.circle.fill', 'info.circle.fill', 'plus', 'minus', 'plus.circle.fill', 'minus.circle.fill', 'ellipsis', 'ellipsis.circle.fill', 'star.fill', 'star.circle.fill', 'heart.fill', 'heart.circle.fill', 'bell.fill', 'bell.badge.fill', 'house.fill', 'gear', 'gearshape.fill', 'person.fill', 'person.crop.circle.fill', 'person.2.fill', 'flag.fill', 'bookmark.fill'],
  'Calendar & Time': ['calendar', 'calendar.badge.plus', 'calendar.circle.fill', '1.calendar', '7.calendar', '15.calendar', '22.calendar', '31.calendar', 'clock.fill', 'clock.circle.fill', 'alarm.fill', 'timer', 'stopwatch.fill', 'hourglass', 'hourglass.bottomhalf.filled', 'deskclock.fill'],
  'Weather': ['sun.max.fill', 'sun.min.fill', 'sun.and.horizon.fill', 'sunrise.fill', 'sunset.fill', 'moon.fill', 'moon.circle.fill', 'moon.stars.fill', 'moon.zzz.fill', 'sparkles', 'cloud.fill', 'cloud.sun.fill', 'cloud.moon.fill', 'cloud.drizzle.fill', 'cloud.rain.fill', 'cloud.heavyrain.fill', 'cloud.bolt.fill', 'cloud.bolt.rain.fill', 'cloud.sleet.fill', 'cloud.snow.fill', 'cloud.hail.fill', 'cloud.fog.fill', 'smoke.fill', 'wind', 'wind.snow', 'tornado', 'tropicalstorm', 'hurricane', 'snowflake', 'thermometer', 'thermometer.sun.fill', 'thermometer.snowflake', 'thermometer.low', 'thermometer.medium', 'thermometer.high', 'drop.fill', 'humidity.fill', 'aqi.low', 'aqi.medium', 'aqi.high'],
  'Activity & Health': ['figure.walk', 'figure.run', 'figure.stand', 'figure.cooldown', 'figure.yoga', 'figure.stairs', 'figure.strengthtraining.traditional', 'bicycle', 'dumbbell.fill', 'heart.fill', 'heart.circle.fill', 'heart.text.square.fill', 'heart.square.fill', 'flame.fill', 'flame.circle.fill', 'bolt.heart.fill', 'waveform.path.ecg', 'waveform.path.ecg.rectangle.fill', 'stethoscope', 'cross.circle.fill', 'cross.fill', 'medical.thermometer.fill', 'pills.fill', 'syringe.fill', 'bandage.fill', 'drop.fill', 'drop.triangle.fill', 'lungs.fill', 'brain.fill', 'ear.fill', 'eye.fill', 'allergens.fill'],
  'Media & Music': ['play.fill', 'play.circle.fill', 'pause.fill', 'pause.circle.fill', 'stop.fill', 'stop.circle.fill', 'forward.fill', 'forward.end.fill', 'backward.fill', 'backward.end.fill', 'goforward', 'gobackward', 'repeat', 'repeat.1', 'shuffle', 'music.note', 'music.note.list', 'music.quarternote.3', 'guitars.fill', 'piano', 'photo.fill', 'photo.stack.fill', 'photo.circle.fill', 'photo.on.rectangle.fill', 'camera.fill', 'camera.circle.fill', 'video.fill', 'video.circle.fill', 'film.fill', 'tv.fill', 'play.tv.fill', 'airplayvideo', 'headphones', 'speaker.wave.2.fill', 'speaker.fill', 'speaker.slash.fill', 'mic.fill', 'mic.slash.fill', 'volume.3.fill'],
  'Communication': ['envelope.fill', 'envelope.open.fill', 'envelope.badge.fill', 'envelope.circle.fill', 'mail.stack.fill', 'phone.fill', 'phone.circle.fill', 'phone.badge.plus', 'phone.arrow.up.right.fill', 'phone.arrow.down.left.fill', 'message.fill', 'message.circle.fill', 'message.badge.fill', 'bubble.left.fill', 'bubble.right.fill', 'text.bubble.fill', 'quote.bubble.fill', 'captions.bubble.fill', 'video.fill', 'video.circle.fill', 'facetime', 'teletype', 'signature'],
  'Navigation & Arrows': ['arrow.up', 'arrow.down', 'arrow.left', 'arrow.right', 'arrow.up.circle.fill', 'arrow.down.circle.fill', 'arrow.left.circle.fill', 'arrow.right.circle.fill', 'arrow.up.square.fill', 'arrow.down.square.fill', 'arrow.left.square.fill', 'arrow.right.square.fill', 'chevron.up', 'chevron.down', 'chevron.left', 'chevron.right', 'chevron.up.circle.fill', 'chevron.down.circle.fill', 'chevron.left.circle.fill', 'chevron.right.circle.fill', 'arrow.clockwise', 'arrow.counterclockwise', 'arrow.clockwise.circle.fill', 'arrow.counterclockwise.circle.fill', 'arrow.uturn.left', 'arrow.uturn.right', 'arrow.turn.up.right', 'arrow.triangle.turn.up.right.circle.fill', 'location.fill', 'location.circle.fill', 'location.north.fill', 'mappin.circle.fill', 'mappin.and.ellipse', 'map.fill', 'safari.fill', 'compass.fill'],
  'Calendar Dates': ['1.circle.fill', '2.circle.fill', '3.circle.fill', '4.circle.fill', '5.circle.fill', '6.circle.fill', '7.circle.fill', '8.circle.fill', '9.circle.fill', '10.circle.fill', '11.circle.fill', '12.circle.fill', '13.circle.fill', '14.circle.fill', '15.circle.fill', '16.circle.fill', '17.circle.fill', '18.circle.fill', '19.circle.fill', '20.circle.fill', '21.circle.fill', '22.circle.fill', '23.circle.fill', '24.circle.fill', '25.circle.fill', '26.circle.fill', '27.circle.fill', '28.circle.fill', '29.circle.fill', '30.circle.fill', '31.circle.fill'],
  'Status & Indicators': ['checkmark', 'checkmark.circle.fill', 'checkmark.shield.fill', 'xmark', 'xmark.circle.fill', 'exclamationmark.triangle.fill', 'exclamationmark.circle.fill', 'questionmark.circle.fill', 'info.circle.fill', 'star.fill', 'star.circle.fill', 'heart.fill', 'heart.circle.fill', 'flag.fill', 'flag.circle.fill', 'tag.fill', 'tag.circle.fill', 'bookmark.fill', 'bookmark.circle.fill', 'pin.fill', 'pin.circle.fill', 'bell.fill', 'bell.badge.fill', 'bell.slash.fill', 'clock.badge.checkmark.fill', 'clock.badge.exclamationmark.fill'],
  'Tech & Devices': ['wifi', 'wifi.circle.fill', 'wifi.slash', 'antenna.radiowaves.left.and.right', 'personalhotspot', 'network', 'airpodspro', 'airpodsmax', 'homepod.fill', 'homepod.2.fill', 'applewatch', 'applewatch.watchface', 'iphone', 'iphone.circle.fill', 'ipad', 'laptopcomputer', 'desktopcomputer', 'display', 'tv.fill', 'appletv.fill', 'applelogo', 'macwindow', 'headphones', 'airplayaudio', 'airplayvideo', 'airtag.fill', 'battery.100percent', 'battery.75percent', 'battery.50percent', 'battery.25percent', 'battery.0percent', 'battery.100percent.bolt', 'bolt.fill', 'bolt.circle.fill', 'power', 'switch.2'],
  'Charts & Finance': ['chart.bar.fill', 'chart.bar.xaxis', 'chart.line.uptrend.xyaxis', 'chart.line.downtrend.xyaxis', 'chart.line.flattrend.xyaxis', 'chart.pie.fill', 'chart.xyaxis.line', 'waveform', 'waveform.circle.fill', 'gauge.with.dots.needle.bottom.50percent', 'speedometer', 'dollarsign.circle.fill', 'eurosign.circle.fill', 'yensign.circle.fill', 'sterlingsign.circle.fill', 'bitcoinsign.circle.fill', 'percent', 'percent.circle.fill', 'number', 'number.circle.fill', 'sum', 'plusminus', 'equal', 'equal.circle.fill', 'greaterthan.circle.fill', 'lessthan.circle.fill', 'function'],
  'Files & Documents': ['doc.fill', 'doc.text.fill', 'doc.on.doc.fill', 'doc.richtext.fill', 'doc.plaintext.fill', 'note.text', 'note.text.badge.plus', 'list.bullet', 'list.bullet.circle.fill', 'list.dash', 'list.number', 'checklist', 'folder.fill', 'folder.badge.plus', 'folder.circle.fill', 'externaldrive.fill', 'archivebox.fill', 'tray.fill', 'tray.2.fill', 'paperplane.fill', 'book.fill', 'book.closed.fill', 'books.vertical.fill', 'newspaper.fill', 'bookmark.fill', 'graduationcap.fill'],
  'Actions & Tools': ['square.and.arrow.up.fill', 'square.and.arrow.down.fill', 'square.and.arrow.up.circle.fill', 'square.and.arrow.down.circle.fill', 'square.and.pencil', 'pencil', 'pencil.circle.fill', 'pencil.slash', 'highlighter', 'eraser.fill', 'trash.fill', 'trash.circle.fill', 'trash.slash.fill', 'xmark.bin.fill', 'scissors', 'link', 'link.circle.fill', 'paperclip', 'pin.fill', 'pin.slash.fill', 'magnifyingglass', 'magnifyingglass.circle.fill', 'barcode.viewfinder', 'qrcode.viewfinder', 'eye.fill', 'eye.slash.fill', 'eye.circle.fill', 'eyeglasses', 'slider.horizontal.3', 'slider.vertical.3', 'paintbrush.fill', 'paintpalette.fill', 'wrench.fill', 'wrench.and.screwdriver.fill', 'hammer.fill', 'gearshape.fill', 'gearshape.2.fill'],
  'Social & People': ['person.fill', 'person.circle.fill', 'person.crop.circle.fill', 'person.crop.circle.badge.checkmark', 'person.crop.circle.badge.plus', 'person.2.fill', 'person.2.circle.fill', 'person.3.fill', 'person.crop.square.fill', 'person.and.background.dotted', 'hand.thumbsup.fill', 'hand.thumbsdown.fill', 'hand.wave.fill', 'hands.clap.fill', 'face.smiling.fill', 'face.smiling.inverse', 'heart.fill', 'heart.slash.fill', 'star.fill', 'star.slash.fill', 'gift.fill'],
  'Shapes & Symbols': ['circle', 'circle.fill', 'circle.lefthalf.filled', 'circle.righthalf.filled', 'circle.inset.filled', 'circle.dashed', 'square', 'square.fill', 'square.lefthalf.filled', 'square.righthalf.filled', 'square.inset.filled', 'square.dashed', 'rectangle', 'rectangle.fill', 'rectangle.portrait.fill', 'triangle', 'triangle.fill', 'diamond', 'diamond.fill', 'octagon', 'octagon.fill', 'hexagon', 'hexagon.fill', 'pentagon', 'pentagon.fill', 'seal', 'seal.fill', 'star', 'star.fill', 'star.leadinghalf.filled', 'heart', 'heart.fill', 'suit.heart.fill', 'suit.club.fill', 'suit.spade.fill', 'suit.diamond.fill'],
  'Shopping & Money': ['cart.fill', 'cart.badge.plus', 'cart.circle.fill', 'bag.fill', 'bag.badge.plus', 'bag.circle.fill', 'basket.fill', 'creditcard.fill', 'creditcard.circle.fill', 'wallet.pass.fill', 'dollarsign.circle.fill', 'eurosign.circle.fill', 'yensign.circle.fill', 'sterlingsign.circle.fill', 'bitcoinsign.circle.fill', 'banknote.fill', 'giftcard.fill', 'tag.fill', 'tag.circle.fill', 'percent', 'percent.circle.fill', 'barcode', 'qrcode'],
  'Home & Control': ['house.fill', 'house.circle.fill', 'building.fill', 'lightbulb.fill', 'lightbulb.circle.fill', 'lightbulb.slash.fill', 'lamp.desk.fill', 'lamp.floor.fill', 'lamp.ceiling.fill', 'light.panel.fill', 'fan.fill', 'air.conditioner.horizontal.fill', 'air.conditioner.vertical.fill', 'heater.vertical.fill', 'fireplace.fill', 'thermometer.medium', 'lock.fill', 'lock.open.fill', 'lock.circle.fill', 'lock.shield.fill', 'key.fill', 'key.horizontal.fill', 'door.left.hand.closed', 'door.right.hand.closed', 'entry.lever.keypad.fill', 'window.vertical.closed', 'window.shade.closed', 'blinds.vertical.closed', 'curtains.closed', 'sensor.fill', 'camera.metering.center.weighted.average', 'bell.fill', 'bell.slash.fill'],
  'Transportation': ['car.fill', 'car.2.fill', 'car.circle.fill', 'bolt.car.fill', 'car.front.waves.up.fill', 'bus.fill', 'tram.fill', 'cablecar.fill', 'bicycle', 'bicycle.circle.fill', 'scooter', 'airplane', 'airplane.circle.fill', 'airplane.departure', 'airplane.arrival', 'sailboat.fill', 'ferry.fill', 'fuelpump.fill', 'ev.charger.fill', 'parkingsign.circle.fill', 'road.lanes', 'signpost.right.fill', 'figure.walk', 'figure.run'],
  'Food & Drink': ['cup.and.saucer.fill', 'mug.fill', 'takeoutbag.and.cup.and.straw.fill', 'waterbottle.fill', 'wineglass.fill', 'birthday.cake.fill', 'fork.knife', 'fork.knife.circle.fill', 'carrot.fill', 'leaf.fill', 'fish.fill', 'flame.fill']
};

export default function IconsTab({ iconColor, setIconColor }) {
  const iconPrefix = 'sf:';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
      <div style={{
        backgroundColor: '#2c2c2e',
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="color"
            value={iconColor.startsWith('#') ? iconColor : '#ffffff'}
            onChange={(e) => setIconColor(e.target.value)}
            style={{
              width: 40,
              height: 40,
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              backgroundColor: 'transparent'
            }}
          />
          <input
            type="text"
            value={iconColor}
            onChange={(e) => setIconColor(e.target.value)}
            placeholder="Color (hex, rgba, etc.)"
            style={{
              backgroundColor: '#1c1c1e',
              border: '1px solid #3a3a3c',
              borderRadius: 6,
              padding: '8px 12px',
              color: '#f5f5f7',
              fontSize: 13,
              fontFamily: 'Monaco, monospace',
              width: 220,
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#007AFF'}
            onBlur={(e) => e.target.style.borderColor = '#3a3a3c'}
          />
        </div>
        <button
          onClick={() => setIconColor('rgba(255, 255, 255, 0.85)')}
          style={{
            backgroundColor: '#007AFF',
            border: 'none',
            borderRadius: 6,
            padding: '8px 16px',
            color: 'white',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#0051D5'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#007AFF'}
        >
          Restore Default
        </button>
      </div>
      {Object.entries(sfIconCategories).map(([category, icons]) => (
        <div key={category} style={{ backgroundColor: '#2c2c2e', borderRadius: 12, padding: 24, marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, color: '#f5f5f7', fontWeight: 600, marginBottom: 16 }}>
            {category}
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
            gap: 12
          }}>
            {icons.map(iconName => (
              <div
                key={iconName}
                title={`Click to copy: ${iconName}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  padding: 12,
                  backgroundColor: '#0d0d0d',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a1a1a';
                  e.currentTarget.style.borderColor = '#007AFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#0d0d0d';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
                onClick={() => {
                  const copyText = iconPrefix + iconName;
                  navigator.clipboard.writeText(copyText);
                  const el = document.createElement('div');
                  el.textContent = 'Copied!';
                  el.style.cssText = 'position:fixed;top:20px;right:20px;background:#34C759;color:white;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;z-index:10000;animation:fadeIn 0.2s ease';
                  document.body.appendChild(el);
                  setTimeout(() => {
                    el.style.animation = 'fadeOut 0.2s ease';
                    setTimeout(() => el.remove(), 200);
                  }, 1500);
                }}
              >
                <Icon name={iconPrefix + iconName} size={32} color={iconColor} />
                <div style={{
                  fontSize: 10,
                  color: '#8e8e93',
                  textAlign: 'center',
                  wordBreak: 'break-word',
                  fontFamily: 'Monaco, monospace',
                  lineHeight: 1.3
                }}>
                  {iconName}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
