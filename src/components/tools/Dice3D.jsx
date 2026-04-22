import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges, Text } from '@react-three/drei';
import * as THREE from 'three';

// Utility to extract distinct flat faces from any BufferGeometry
const getFaces = (geometry, sides) => {
  const nonIndexedGeo = geometry.toNonIndexed();
  nonIndexedGeo.computeVertexNormals();
  const pos = nonIndexedGeo.attributes.position;
  
  const triangles = [];
  for (let i = 0; i < pos.count; i += 3) {
    const a = new THREE.Vector3().fromBufferAttribute(pos, i);
    const b = new THREE.Vector3().fromBufferAttribute(pos, i + 1);
    const c = new THREE.Vector3().fromBufferAttribute(pos, i + 2);
    const normal = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    triangles.push({ a, b, c, normal });
  }

  const distinctFaces = [];
  for (const tri of triangles) {
    const existingFace = distinctFaces.find(f => f.normal.angleTo(tri.normal) < 0.1);
    if (existingFace) {
      existingFace.triangles.push(tri);
    } else {
      distinctFaces.push({ normal: tri.normal.clone(), triangles: [tri] });
    }
  }

  return distinctFaces.map((face, index) => {
    const faceCenter = new THREE.Vector3();
    face.triangles.forEach(tri => faceCenter.add(tri.a).add(tri.b).add(tri.c));
    faceCenter.divideScalar(face.triangles.length * 3);
    
    // For D10 (approximated with 20 faces), numbers 1-10 will repeat.
    const faceValue = (index % (sides === 10 ? 10 : sides)) + 1;
    
    return { value: faceValue, center: faceCenter, normal: face.normal };
  });
};

export const DieShape = ({ sides, value, isRolling, index = 0, controlledPosition, controlledRotation, size = 1 }) => {
  const meshRef = useRef();

  const geometry = useMemo(() => {
    let geo;
    const s = 1.5 * size;
    switch (sides) {
      case 4: geo = new THREE.TetrahedronGeometry(s * 0.8); break;
      case 6: geo = new THREE.BoxGeometry(s, s, s); break;
      case 8: geo = new THREE.OctahedronGeometry(s * 0.85); break;
      case 10: geo = new THREE.IcosahedronGeometry(s * 0.85); break; // Simplified D10
      case 12: geo = new THREE.DodecahedronGeometry(s * 0.8); break;
      case 20: geo = new THREE.IcosahedronGeometry(s * 0.85); break;
      default: geo = new THREE.BoxGeometry(s, s, s);
    }
    geo.computeVertexNormals();
    return geo;
  }, [sides, size]);

  const faces = useMemo(() => getFaces(geometry, sides), [geometry, sides]);

  const targetQuaternion = useMemo(() => {
    const targetFace = faces.find(f => f.value === value) || faces[0];
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(targetFace.normal, new THREE.Vector3(0, 0, 1));
    return q;
  }, [faces, value]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    if (controlledPosition && controlledRotation) {
      meshRef.current.position.copy(controlledPosition);
      meshRef.current.quaternion.copy(controlledRotation);
    } else if (isRolling) {
      // Idle tumbling for the "shelf" preview
      meshRef.current.rotation.x += delta * 2;
      meshRef.current.rotation.y += delta * 1.5;
    } else {
      // Snap to result
      meshRef.current.quaternion.slerp(targetQuaternion, 0.1);
    }
  });

  return (
    <group ref={meshRef}>
      <mesh geometry={geometry}>
        <meshStandardMaterial color="#4F46E5" roughness={0.4} metalness={0.1} />
        <Edges scale={1.02} threshold={15} color="white" opacity={0.5} transparent />
      </mesh>
      
      {faces.map((face, i) => (
        <Text
          key={i}
          position={face.center.clone().multiplyScalar(1.05)}
          quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), face.normal)}
          fontSize={sides > 6 ? 0.4 * size : 0.6 * size}
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

