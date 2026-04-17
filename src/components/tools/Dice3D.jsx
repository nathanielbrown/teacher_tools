import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges, Text } from '@react-three/drei';
import * as THREE from 'three';

// Utility to extract distinct flat faces from any BufferGeometry
const getFaces = (geometry, sides) => {
  // Ensure we have vertex normals and non-indexed geometry to easily extract triangles
  const nonIndexedGeo = geometry.toNonIndexed();
  nonIndexedGeo.computeVertexNormals();
  const pos = nonIndexedGeo.attributes.position;
  
  const triangles = [];
  for (let i = 0; i < pos.count; i += 3) {
    const a = new THREE.Vector3().fromBufferAttribute(pos, i);
    const b = new THREE.Vector3().fromBufferAttribute(pos, i + 1);
    const c = new THREE.Vector3().fromBufferAttribute(pos, i + 2);
    const center = a.clone().add(b).add(c).divideScalar(3);
    const normal = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    triangles.push({ a, b, c, center, normal });
  }

  // Group triangles by similar normal to form flat faces
  const distinctFaces = [];
  for (const tri of triangles) {
    const existingFace = distinctFaces.find(f => f.normal.angleTo(tri.normal) < 0.1);
    if (existingFace) {
      existingFace.triangles.push(tri);
    } else {
      distinctFaces.push({ normal: tri.normal.clone(), triangles: [tri] });
    }
  }

  // Calculate face centroids
  return distinctFaces.map((face, index) => {
    const faceCenter = new THREE.Vector3();
    let vertexCount = 0;
    face.triangles.forEach(tri => {
      faceCenter.add(tri.a).add(tri.b).add(tri.c);
      vertexCount += 3;
    });
    faceCenter.divideScalar(vertexCount);
    
    // For D10 (approximated with 20 faces), numbers 1-10 will repeat. Others are 1..sides.
    const faceValue = (index % sides) + 1;
    
    return {
      value: faceValue,
      center: faceCenter,
      normal: face.normal
    };
  });
};

export const DieShape = ({ sides, value, isRolling, index = 0 }) => {
  const groupRef = useRef();

  // Create geometry based on sides
  const geometry = useMemo(() => {
    let geo;
    switch (sides) {
      case 4: geo = new THREE.TetrahedronGeometry(1.2); break;
      case 6: geo = new THREE.BoxGeometry(1.5, 1.5, 1.5); break;
      case 8: geo = new THREE.OctahedronGeometry(1.3); break;
      case 12: geo = new THREE.DodecahedronGeometry(1.2); break;
      case 20: geo = new THREE.IcosahedronGeometry(1.3); break;
      default: geo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    }
    // Very important to ensure normals are fresh
    geo.computeVertexNormals();
    return geo;
  }, [sides]);

  const faces = useMemo(() => getFaces(geometry, sides), [geometry, sides]);

  // Unique random tumbling speed per dice
  const randomSpeed = useMemo(() => ({
    x: (Math.random() * 0.5 + 0.8) * (index % 2 === 0 ? 1 : -1),
    y: (Math.random() * 0.5 + 0.8) * (index % 3 === 0 ? 1 : -1),
    z: (Math.random() * 0.5 + 0.8)
  }), [index]);

  // Target rotation for the rolled value
  const targetQuaternion = useMemo(() => {
    // Find the face that matches the rolled value
    const targetFace = faces.find(f => f.value === value) || faces[0];
    const q = new THREE.Quaternion();
    // We want the target face's normal to point towards the camera [0, 0, 1]
    q.setFromUnitVectors(targetFace.normal, new THREE.Vector3(0, 0, 1));
    return q;
  }, [faces, value]);

  useFrame((state, delta) => {
    if (isRolling && groupRef.current) {
      groupRef.current.rotation.x += delta * 15 * randomSpeed.x;
      groupRef.current.rotation.y += delta * 20 * randomSpeed.y;
      groupRef.current.rotation.z += delta * 10 * randomSpeed.z;
    } else if (groupRef.current) {
      // Smoothly snap to target rotation
      groupRef.current.quaternion.slerp(targetQuaternion, 0.15);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry}>
        <meshStandardMaterial color="#4F46E5" roughness={0.4} metalness={0.1} />
        <Edges scale={1.02} threshold={15} color="white" opacity={0.5} transparent />
      </mesh>
      
      {faces.map((face, i) => (
        <Text
          key={i}
          position={face.center.clone().multiplyScalar(1.05)}
          quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), face.normal)}
          fontSize={sides === 20 || sides === 12 || sides === 10 ? 0.6 : 0.8}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#4F46E5"
          fontWeight="bold"
        >
          {face.value}
        </Text>
      ))}
    </group>
  );
};
