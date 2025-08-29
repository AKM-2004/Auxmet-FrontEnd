import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function CyberGrid() {
  const mesh1 = useRef()
  const mesh2 = useRef()
  const mesh3 = useRef()
  
  useFrame((state) => {
    const time = state.clock.elapsedTime
    
    if (mesh1.current) {
      mesh1.current.rotation.x = Math.sin(time * 0.2) * 0.1
      mesh1.current.rotation.z = Math.sin(time * 0.15) * 0.1
      mesh1.current.position.y = Math.sin(time * 0.1) * 0.5
    }
    if (mesh2.current) {
      mesh2.current.rotation.x = Math.sin(time * 0.25) * 0.1
      mesh2.current.rotation.z = Math.sin(time * 0.18) * 0.1
      mesh2.current.position.y = Math.cos(time * 0.12) * 0.3
    }
    if (mesh3.current) {
      mesh3.current.rotation.y += 0.005
      mesh3.current.position.z = -10 + Math.sin(time * 0.1) * 2
    }
  })

  return (
    <>
      {/* Primary Cyber Grid */}
      <mesh ref={mesh1} position={[0, -3, -10]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[50, 50, 120, 120]} />
        <meshBasicMaterial
          color="#00ff88"
          wireframe
          transparent
          opacity={0.25}
        />
      </mesh>
      
      {/* Secondary Grid Layer */}
      <mesh ref={mesh2} position={[0, 1, -15]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
        <planeGeometry args={[35, 35, 100, 100]} />
        <meshBasicMaterial
          color="#22ff44"
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>
      
      {/* Vertical Grid Wall */}
      <mesh ref={mesh3} position={[0, 0, -20]} rotation={[0, 0, 0]}>
        <planeGeometry args={[40, 30, 80, 60]} />
        <meshBasicMaterial
          color="#44ff88"
          wireframe
          transparent
          opacity={0.1}
        />
      </mesh>
    </>
  )
}

function HolographicSpheres() {
  const sphere1 = useRef()
  const sphere2 = useRef()
  const sphere3 = useRef()
  
  useFrame((state) => {
    const time = state.clock.elapsedTime
    
    if (sphere1.current) {
      sphere1.current.rotation.x += 0.01
      sphere1.current.rotation.y += 0.008
      sphere1.current.position.y = Math.sin(time * 0.5) * 2
    }
    if (sphere2.current) {
      sphere2.current.rotation.x -= 0.008
      sphere2.current.rotation.z += 0.01
      sphere2.current.position.x = Math.cos(time * 0.3) * 3
    }
    if (sphere3.current) {
      sphere3.current.rotation.y += 0.012
      sphere3.current.rotation.z -= 0.006
      sphere3.current.position.z = -8 + Math.sin(time * 0.2) * 2
    }
  })

  return (
    <>
      <mesh ref={sphere1} position={[-5, 0, -12]}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial color="#22ff44" wireframe transparent opacity={0.3} />
      </mesh>
      <mesh ref={sphere2} position={[5, 2, -15]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#00ff88" wireframe transparent opacity={0.4} />
      </mesh>
      <mesh ref={sphere3} position={[0, -2, -8]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshBasicMaterial color="#44ff88" wireframe transparent opacity={0.5} />
      </mesh>
    </>
  )
}

function MovingStars() {
  const ref = useRef()
  const [stars] = useMemo(() => {
    const count = 1000
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      // Random star positions
      positions[i * 3] = (Math.random() - 0.5) * 50
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30
      positions[i * 3 + 2] = Math.random() * -30 - 5
      
      // Random velocities for movement
      velocities[i * 3] = (Math.random() - 0.5) * 0.02
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.01
      velocities[i * 3 + 2] = Math.random() * 0.05 + 0.01
    }
    
    return [positions, velocities]
  }, [])

  useFrame((state, delta) => {
    if (ref.current && ref.current.geometry.attributes.position) {
      const positions = ref.current.geometry.attributes.position.array
      const velocities = stars[1]
      
      for (let i = 0; i < positions.length; i += 3) {
        // Move stars
        positions[i] += velocities[i] * delta * 60
        positions[i + 1] += velocities[i + 1] * delta * 60
        positions[i + 2] += velocities[i + 2] * delta * 60
        
        // Reset stars that moved too far
        if (positions[i + 2] > 5) {
          positions[i] = (Math.random() - 0.5) * 50
          positions[i + 1] = (Math.random() - 0.5) * 30
          positions[i + 2] = -35
        }
      }
      
      ref.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={stars[0].length / 3}
          array={stars[0]}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        transparent
        color="#ffffff"
        size={0.015}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function QuantumParticles() {
  const ref = useRef()
  const [particles] = useMemo(() => {
    const count = 1500
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      // Create spiral galaxy pattern
      const radius = Math.random() * 12
      const angle = Math.random() * Math.PI * 2
      const height = (Math.random() - 0.5) * 8
      
      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = height
      positions[i * 3 + 2] = Math.sin(angle) * radius - 10
      
      // Green color variations
      colors[i * 3] = 0.1 + Math.random() * 0.3 // R
      colors[i * 3 + 1] = 0.8 + Math.random() * 0.2 // G
      colors[i * 3 + 2] = 0.3 + Math.random() * 0.3 // B
    }
    
    return [positions, colors]
  }, [])

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.08
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.15
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles[0].length / 3}
          array={particles[0]}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particles[1].length / 3}
          array={particles[1]}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        transparent
        vertexColors
        size={0.008}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function NeuralConnections() {
  const groupRef = useRef()
  const [nodes] = useMemo(() => {
    const nodeCount = 30
    const nodes = []
    
    // Generate nodes
    for (let i = 0; i < nodeCount; i++) {
      nodes.push([
        THREE.MathUtils.randFloat(-8, 8),
        THREE.MathUtils.randFloat(-5, 5),
        THREE.MathUtils.randFloat(-15, -5)
      ])
    }
    
    return [nodes]
  }, [])

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.5
    }
  })

  return (
    <group ref={groupRef}>
      {/* Nodes */}
      {nodes.map((position, index) => (
        <mesh key={`node-${index}`} position={position}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial 
            color="#00ff88" 
            transparent 
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  )
}

function EnergyOrbs() {
  const orb1 = useRef()
  const orb2 = useRef()
  const orb3 = useRef()
  
  useFrame((state) => {
    const time = state.clock.elapsedTime
    
    if (orb1.current) {
      orb1.current.position.x = Math.sin(time * 0.5) * 8
      orb1.current.position.y = Math.cos(time * 0.3) * 3
      orb1.current.rotation.y += 0.02
    }
    if (orb2.current) {
      orb2.current.position.x = Math.cos(time * 0.4) * 6
      orb2.current.position.z = -12 + Math.sin(time * 0.2) * 3
      orb2.current.rotation.x += 0.015
    }
    if (orb3.current) {
      orb3.current.position.y = Math.sin(time * 0.6) * 4
      orb3.current.position.z = -8 + Math.cos(time * 0.25) * 2
      orb3.current.rotation.z += 0.01
    }
  })

  return (
    <>
      <mesh ref={orb1} position={[0, 0, -10]}>
        <icosahedronGeometry args={[0.5, 2]} />
        <meshBasicMaterial 
          color="#22ff44" 
          transparent 
          opacity={0.6}
          emissive="#22ff44"
          emissiveIntensity={0.3}
        />
      </mesh>
      <mesh ref={orb2} position={[3, 1, -12]}>
        <octahedronGeometry args={[0.3, 0]} />
        <meshBasicMaterial 
          color="#00ff88" 
          transparent 
          opacity={0.7}
          emissive="#00ff88"
          emissiveIntensity={0.4}
        />
      </mesh>
      <mesh ref={orb3} position={[-3, -1, -8]}>
        <dodecahedronGeometry args={[0.4, 0]} />
        <meshBasicMaterial 
          color="#44ff88" 
          transparent 
          opacity={0.5}
          emissive="#44ff88"
          emissiveIntensity={0.2}
        />
      </mesh>
    </>
  )
}

export default function FuturisticBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 1], fov: 75 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.1} />
        <MovingStars />
        <QuantumParticles />
        <CyberGrid />
        <HolographicSpheres />
        <NeuralConnections />
        <EnergyOrbs />
      </Canvas>
    </div>
  )
}
