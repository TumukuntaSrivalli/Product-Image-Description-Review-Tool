import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

interface TileData {
  id: string
  color: string
  label: string
  normalPos: [number, number, number]
  altPos: [number, number, number]
  rotation: [number, number, number]
}

const FIXTURE_TILES: TileData[] = [
  // Letters A - L - T positions for easter egg
  { id: 'P01', color: '#3B82F6', label: 'Blue illustration (P01)', normalPos: [-2.2, 1.2, 0], altPos: [-3, 1.5, 0], rotation: [0.1, 0.2, 0.05] },
  { id: 'P02', color: '#3B82F6', label: 'Blue illustration (P02)', normalPos: [-1.2, 0.4, 0.5], altPos: [-3, 0.5, 0], rotation: [-0.1, 0.1, -0.05] },
  { id: 'P03', color: '#EF4444', label: 'Red illustration (P03)', normalPos: [0, 1.4, -0.2], altPos: [-3, -0.5, 0], rotation: [0.15, -0.1, 0.1] },
  { id: 'P04', color: '#3B82F6', label: 'Blue illustration (P04)', normalPos: [1.2, 0.8, 0.2], altPos: [-2.2, 1.5, 0], rotation: [-0.05, 0.2, 0] },
  { id: 'P05', color: '#3B82F6', label: 'Blue illustration (P05)', normalPos: [2.2, 1.3, -0.4], altPos: [-2.2, 0.5, 0], rotation: [0.1, -0.15, -0.1] },
  { id: 'P06', color: '#EF4444', label: 'Red illustration (P06)', normalPos: [-1.8, -1.0, 0.3], altPos: [-0.5, 1.5, 0], rotation: [-0.1, 0.2, 0.05] },
  { id: 'P07', color: '#1F2937', label: 'Black illustration (P07)', normalPos: [-0.6, -0.9, -0.3], altPos: [-0.5, 0.5, 0], rotation: [0.05, -0.1, -0.05] },
  { id: 'P08', color: '#1F2937', label: 'Black illustration (P08)', normalPos: [0.6, -1.1, 0.4], altPos: [-0.5, -0.5, 0], rotation: [-0.15, 0.1, 0.1] },
  { id: 'P09', color: '#6B7280', label: 'Grey illustration (P09)', normalPos: [1.8, -0.8, -0.2], altPos: [1.5, 1.5, 0], rotation: [0.1, 0.15, -0.05] },
  { id: 'P10', color: '#10B981', label: 'Green illustration (P10)', normalPos: [0.1, 0.1, 0.6], altPos: [1.5, 0.5, 0], rotation: [0, 0, 0] },
]

function TileMesh({ tile, isAltMode }: { tile: TileData; isAltMode: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const targetPos = isAltMode ? tile.altPos : tile.normalPos

  useFrame((_, delta) => {
    if (!meshRef.current) return
    // Smooth transition toward targetPos
    meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetPos[0], delta * 3)
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetPos[1], delta * 3)
    meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetPos[2], delta * 3)

    // Gentle orbit and tilt
    if (!isAltMode) {
      meshRef.current.rotation.y += delta * 0.2
    }
  })

  return (
    <Float speed={1.5} rotationIntensity={0.6} floatIntensity={0.8}>
      <mesh
        ref={meshRef}
        position={tile.normalPos}
        rotation={tile.rotation}
      >
        <boxGeometry args={[1.1, 0.7, 0.12]} />
        <meshPhysicalMaterial
          color={tile.color}
          roughness={0.15}
          transmission={0.6}
          thickness={0.5}
          transparent
          opacity={0.88}
          metalness={0.1}
          reflectivity={0.9}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>
    </Float>
  )
}

function SceneContents({ isAltMode, onScanCaption }: { isAltMode: boolean; onScanCaption: (text: string) => void }) {
  const [, setScanIndex] = useState(0)

  // Periodic scanning light beam cycle
  useEffect(() => {
    const timer = setInterval(() => {
      setScanIndex((prev) => {
        const next = (prev + 1) % FIXTURE_TILES.length
        const current = FIXTURE_TILES[next]
        onScanCaption(`Scanning ${current.id}: ${current.label} • Rule-based verification active`)
        return next
      })
    }, 2800)
    return () => clearInterval(timer)
  }, [onScanCaption])

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 8, 5]} intensity={1.5} />
      <pointLight position={[-4, -3, 2]} intensity={0.9} color="#FF9900" />
      <pointLight position={[4, 3, 2]} intensity={0.9} color="#4F46E5" />

      {FIXTURE_TILES.map((t) => (
        <TileMesh
          key={t.id}
          tile={t}
          isAltMode={isAltMode}
        />
      ))}
    </>
  )
}

export function Hero3DScene() {
  const [caption, setCaption] = useState('Scanning P01: Blue rounded rectangular product illustration...')
  const [isAltMode, setIsAltMode] = useState(false)
  const [hasWebGL, setHasWebGL] = useState(true)
  const typedKeys = useRef('')

  useEffect(() => {
    // Check WebGL availability
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      if (!gl) setHasWebGL(false)
    } catch {
      setHasWebGL(false)
    }

    // Easter egg: type "alt" on landing page
    const handleKeyPress = (e: KeyboardEvent) => {
      typedKeys.current += e.key.toLowerCase()
      if (typedKeys.current.length > 5) {
        typedKeys.current = typedKeys.current.slice(-5)
      }
      if (typedKeys.current.endsWith('alt')) {
        setIsAltMode((prev) => !prev)
        setCaption(
          !isAltMode
            ? '✨ Easter egg triggered: Glass tiles arranged into ALT formation!'
            : 'Scanning P01: Blue rounded rectangular product illustration...'
        )
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isAltMode])

  // Reduced motion preference
  const prefersReduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div className="hero-3d-canvas-wrap" aria-hidden="true">
      {hasWebGL && !prefersReduced ? (
        <Canvas
          camera={{ position: [0, 0, 5.5], fov: 45 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <SceneContents isAltMode={isAltMode} onScanCaption={setCaption} />
          </Suspense>
        </Canvas>
      ) : (
        /* Graceful static fallback if no WebGL or reduced-motion */
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-tile tile-1" />
          <div className="glass-tile tile-2" />
          <div className="glass-tile tile-3" />
          <div className="glass-tile tile-4" />
        </div>
      )}

      {/* Typing Scanner Caption */}
      <div className="hero-3d-caption">
        <span>{caption}</span>
      </div>
    </div>
  )
}
