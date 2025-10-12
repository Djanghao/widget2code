import React from 'react'
import { sfIconsMap, lucideIconsMap } from '@widget-factory/icons'

export function Icon({ name, size = 20, color = 'rgba(255, 255, 255, 0.85)', flex, flexGrow, flexShrink, flexBasis, style = {}, ...rest }) {
  let IconComp = null
  let isLucide = false

  if (name) {
    if (name.startsWith('lucide:')) {
      const lucideName = name.replace('lucide:', '')
      IconComp = lucideIconsMap?.[lucideName]
      isLucide = true
    } else {
      const sfName = name.startsWith('sf:') ? name.replace('sf:', '') : name
      IconComp = sfIconsMap?.[sfName]
    }
  }

  const wrapperStyle = {
    '--icon-color': color,
    width: size,
    height: size,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: '0 0 auto',
    flexShrink: 0,
    ...style,
    ...(flex !== undefined ? { flex } : {}),
    ...(flexGrow !== undefined ? { flexGrow } : {}),
    ...(flexShrink !== undefined ? { flexShrink } : {}),
    ...(flexBasis !== undefined ? { flexBasis } : {})
  }

  if (!IconComp) {
    return (
      <div {...rest} style={wrapperStyle}>
        <svg width="100%" height="100%" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" opacity="0.2" />
          <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    )
  }

  if (isLucide) {
    return (
      <div {...rest} style={wrapperStyle}>
        <IconComp size={size} color={color} />
      </div>
    )
  }

  return (
    <div {...rest} style={wrapperStyle}>
      <IconComp />
    </div>
  )
}
