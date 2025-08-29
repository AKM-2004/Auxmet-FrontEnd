import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function FloatingParticles() {
  const ref = useRef()
  const [sphere] = useMemo(() => {
    const sphere = new Float32Array(3000 * 3)
    for (let i = 0; i < 3000; i++) {
      const theta = THREE.MathUtils.randFloatSpread(360)
      const phi = THREE.MathUtils.randFloatSpread(360)
      const x = Math.cos(theta) * Math.cos(phi) * THREE.MathUtils.randFloat(2, 8)
      const y = Math.sin(theta) * Math.cos(phi) * THREE.MathUtils.randFloat(2, 8)
      const z = Math.sin(phi) * THREE.MathUtils.randFloat(2, 8)
      sphere.set([x, y, z], i * 3)
    }
    return [sphere]
  }, [])

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 20
      ref.current.rotation.y -= delta / 25
      ref.current.rotation.z += delta / 30
    }
  })

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <points ref={ref}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={sphere.length / 3}
            array={sphere}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          transparent
          color="#22ff44"
          size={0.006}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </points>
    </group>
  )
}

function NeuroNetwork() {
  const groupRef = useRef()
  const [connections] = useMemo(() => {
    const points = []
    const lines = []
    
    // Create network nodes
    for (let i = 0; i < 50; i++) {
      points.push({
        position: [
          THREE.MathUtils.randFloat(-10, 10),
          THREE.MathUtils.randFloat(-10, 10),
          THREE.MathUtils.randFloat(-10, 10)
        ],
        connections: []
      })
    }
    
    // Create connections between nearby nodes
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const distance = new THREE.Vector3(...points[i].position)
          .distanceTo(new THREE.Vector3(...points[j].position))
        
        if (distance < 5 && Math.random() > 0.7) {
          lines.push([points[i].position, points[j].position])
        }
      }
    }
    
    return [points, lines]
  }, [])

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1
    }
  })

  return (
    <group ref={groupRef}>
      {connections[0].map((point, index) => (
        <mesh key={index} position={point.position}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#00ff88" transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  )
}

function WaveGrid() {
  const mesh1 = useRef()
  const mesh2 = useRef()
  
  useFrame((state) => {
    if (mesh1.current) {
      mesh1.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1
      mesh1.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.15) * 0.1
      mesh1.current.position.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.5
    }
    if (mesh2.current) {
      mesh2.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.25) * 0.1
      mesh2.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.18) * 0.1
      mesh2.current.position.y = Math.cos(state.clock.elapsedTime * 0.12) * 0.3
    }
  })

  return (
    <>
      {/* Primary Grid */}
      <mesh ref={mesh1} position={[0, -2, -8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 40, 100, 100]} />
        <meshBasicMaterial
          color="#00ff88"
          wireframe
          transparent
          opacity={0.2}
        />
      </mesh>
      
      {/* Secondary Grid */}
      <mesh ref={mesh2} position={[0, 2, -12]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
        <planeGeometry args={[30, 30, 80, 80]} />
        <meshBasicMaterial
          color="#22ff44"
          wireframe
          transparent
          opacity={0.1}
        />
      </mesh>
    </>
  )
}

function HolographicRings() {
  const ring1 = useRef()
  const ring2 = useRef()
  const ring3 = useRef()
  
  useFrame((state) => {
    if (ring1.current) {
      ring1.current.rotation.x += 0.01
      ring1.current.rotation.y += 0.008
    }
    if (ring2.current) {
      ring2.current.rotation.x -= 0.008
      ring2.current.rotation.z += 0.01
    }
    if (ring3.current) {
      ring3.current.rotation.y += 0.012
      ring3.current.rotation.z -= 0.006
    }
  })

  return (
    <group position={[0, 0, -15]}>
      <mesh ref={ring1}>
        <torusGeometry args={[8, 0.1, 16, 100]} />
        <meshBasicMaterial color="#22ff44" transparent opacity={0.3} />
      </mesh>
      <mesh ref={ring2}>
        <torusGeometry args={[6, 0.08, 16, 100]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.4} />
      </mesh>
      <mesh ref={ring3}>
        <torusGeometry args={[10, 0.05, 16, 100]} />
        <meshBasicMaterial color="#44ff88" transparent opacity={0.2} />
      </mesh>
    </group>
  )
}

function DataStream() {
  const streamRef = useRef()
  const [streamPoints] = useMemo(() => {
    const points = new Float32Array(500 * 3)
    for (let i = 0; i < 500; i++) {
      points[i * 3] = (i / 500) * 20 - 10 // x
      points[i * 3 + 1] = Math.sin(i * 0.1) * 2 // y
      points[i * 3 + 2] = Math.cos(i * 0.1) * 2 - 5 // z
    }
    return [points]
  }, [])

  useFrame((state) => {
    if (streamRef.current) {
      streamRef.current.rotation.y += 0.005
    }
  })

  return (
    <group ref={streamRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={streamPoints.length / 3}
            array={streamPoints}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          transparent
          color="#00ff88"
          size={0.02}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </points>
    </group>
  )
}

export default function ThreeBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 1], fov: 75 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.1} />
        <FloatingParticles />
        <WaveGrid />
        <HolographicRings />
        <NeuroNetwork />
        <DataStream />
      </Canvas>
    </div>
  )
}
