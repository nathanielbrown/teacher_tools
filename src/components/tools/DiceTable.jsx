import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { DieShape } from './Dice3D';
import * as THREE from 'three';

const PHYSICS_STEPS = 2; // Steps per frame for smoother collisions
const FRICTION = 0.985;
const BOUNCE = 0.7;
const RADIUS = 1.2;

const DicePhysicsManager = ({ pool, onFinished }) => {
  const [diceState, setDiceState] = useState(() => 
    pool.map((d, i) => ({
      ...d,
      pos: new THREE.Vector3((Math.random() - 0.5) * 4, 10 + i * 2, (Math.random() - 0.5) * 4),
      vel: new THREE.Vector3((Math.random() - 0.5) * 15, -10, (Math.random() - 0.5) * 15),
      quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)),
      angVel: new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10),
      isSettled: false
    }))
  );

  const stateRef = useRef(diceState);
  const finishedRef = useRef(false);

  useFrame((state, delta) => {
    if (finishedRef.current) return;

    const subDelta = delta / PHYSICS_STEPS;
    let anyMoving = false;

    for (let s = 0; s < PHYSICS_STEPS; s++) {
      // 1. Update Positions & Check Walls
      stateRef.current.forEach(die => {
        if (die.isSettled) return;

        die.pos.addScaledVector(die.vel, subDelta);
        
        // Rotation update
        const deltaQuat = new THREE.Quaternion().setFromEuler(
          new THREE.Euler(die.angVel.x * subDelta, die.angVel.y * subDelta, die.angVel.z * subDelta)
        );
        die.quat.multiplyQuaternions(deltaQuat, die.quat);

        // Floor collision
        if (die.pos.y < 0) {
          die.pos.y = 0;
          die.vel.y *= -BOUNCE;
          die.vel.x *= FRICTION;
          die.vel.z *= FRICTION;
          die.angVel.multiplyScalar(FRICTION);
        } else {
          die.vel.y -= 15 * subDelta; // Gravity
        }

        // Wall collisions
        const limit = 8;
        if (Math.abs(die.pos.x) > limit) {
          die.pos.x = Math.sign(die.pos.x) * limit;
          die.vel.x *= -BOUNCE;
        }
        if (Math.abs(die.pos.z) > limit) {
          die.pos.z = Math.sign(die.pos.z) * limit;
          die.vel.z *= -BOUNCE;
        }

        if (die.vel.length() > 0.1) anyMoving = true;
      });

      // 2. Dice-to-Dice Collisions
      for (let i = 0; i < stateRef.current.length; i++) {
        for (let j = i + 1; j < stateRef.current.length; j++) {
          const d1 = stateRef.current[i];
          const d2 = stateRef.current[j];
          const distVec = d1.pos.clone().sub(d2.pos);
          const dist = distVec.length();
          const minDist = RADIUS * 2;

          if (dist < minDist) {
            // Collision response
            const normal = distVec.normalize();
            const relativeVelocity = d1.vel.clone().sub(d2.vel);
            const velocityAlongNormal = relativeVelocity.dot(normal);

            if (velocityAlongNormal < 0) {
              const impulseMagnitude = -(1 + BOUNCE) * velocityAlongNormal / 2;
              const impulse = normal.multiplyScalar(impulseMagnitude);
              d1.vel.add(impulse);
              d2.vel.sub(impulse);
              
              // Push apart to prevent overlap
              const overlap = minDist - dist;
              const push = normal.clone().multiplyScalar(overlap / 2);
              d1.pos.add(push);
              d2.pos.sub(push);
            }
          }
        }
      }
    }

    setDiceState([...stateRef.current]);

    if (!anyMoving && !finishedRef.current) {
      finishedRef.current = true;
      setTimeout(() => {
        onFinished(stateRef.current.map(d => ({ ...d, value: d.value })));
      }, 1000);
    }
  });

  return (
    <>
      {diceState.map((die, i) => (
        <DieShape 
          key={die.id}
          sides={die.sides}
          value={die.value}
          controlledPosition={die.pos}
          controlledRotation={die.quat}
        />
      ))}
    </>
  );
};

export const DiceTable = ({ pool, onFinished }) => {
  return (
    <div className="w-full h-full bg-slate-900/10 rounded-[3rem] shadow-inner relative overflow-hidden">
      <Canvas camera={{ position: [0, 15, 10], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]}>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#ffffff" opacity={0.05} transparent />
        </mesh>
        <DicePhysicsManager pool={pool} onFinished={onFinished} />
      </Canvas>
    </div>
  );
};
