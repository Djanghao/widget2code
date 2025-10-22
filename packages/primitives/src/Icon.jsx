import React, { useState, useEffect } from 'react'
import { sfDynamicIconImports } from '../../icons/sf-symbols/src/index.jsx'
import { lucideIconsMap } from '../../icons/lucide/src/index.jsx'

const iconCache = new Map()

export function Icon({ name, size = 20, color = 'rgba(255, 255, 255, 0.85)', flex, flexGrow, flexShrink, flexBasis, style = {}, ...rest }) {
  const [IconComp, setIconComp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isLucide, setIsLucide] = useState(false)

  useEffect(() => {
    console.log(`[Icon Component] 🎯 Icon component called with name: ${name}`)

    if (!name) {
      console.log(`[Icon Component] ⚠️ No name provided, skipping`)
      setLoading(false)
      return
    }

    if (name.startsWith('lucide:')) {
      const lucideName = name.replace('lucide:', '')
      console.log(`[Icon Lazy Load] 📦 Loading Lucide icon (sync): ${lucideName}`)
      const comp = lucideIconsMap?.[lucideName]
      if (comp) {
        console.log(`[Icon Lazy Load] ✓ Found Lucide icon: ${lucideName}`)
      } else {
        console.log(`[Icon Lazy Load] ✗ Lucide icon not found: ${lucideName}`)
      }
      setIconComp(() => comp)
      setIsLucide(true)
      setLoading(false)
    } else {
      const sfName = name.startsWith('sf:') ? name.replace('sf:', '') : name

      if (iconCache.has(sfName)) {
        console.log(`[Icon Lazy Load] ⚡ Using cached icon: ${sfName}`)
        setIconComp(() => iconCache.get(sfName))
        setIsLucide(false)
        setLoading(false)
        return
      }

      const loader = sfDynamicIconImports?.[sfName]
      if (loader) {
        console.log(`[Icon Lazy Load] Starting to load icon: ${sfName}`)
        setLoading(true)
        const startTime = performance.now()
        loader()
          .then(module => {
            const loadTime = performance.now() - startTime
            console.log(`[Icon Lazy Load] ✓ Loaded ${sfName} in ${loadTime.toFixed(2)}ms`)
            const comp = module.default
            iconCache.set(sfName, comp)
            setIconComp(() => comp)
            setIsLucide(false)
            setLoading(false)
          })
          .catch(err => {
            console.error(`[Icon Lazy Load] ✗ Failed to load icon: ${sfName}`, err)
            setIconComp(null)
            setIsLucide(false)
            setLoading(false)
          })
      } else {
        setIconComp(null)
        setIsLucide(false)
        setLoading(false)
      }
    }
  }, [name])

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

  if (loading) {
    console.log(`[Icon Lazy Load] ⏳ Showing loading placeholder for: ${name}`)
    return (
      <div {...rest} style={wrapperStyle}>
        <svg width="100%" height="100%" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.2" />
        </svg>
      </div>
    )
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
    console.log(`[Icon Lazy Load] ✅ Rendering Lucide icon: ${name}`)
    return (
      <div {...rest} style={wrapperStyle}>
        <IconComp size={size} color={color} />
      </div>
    )
  }

  console.log(`[Icon Lazy Load] ✅ Rendering SF Symbol: ${name}`)
  return (
    <div {...rest} style={wrapperStyle}>
      <IconComp />
    </div>
  )
}
