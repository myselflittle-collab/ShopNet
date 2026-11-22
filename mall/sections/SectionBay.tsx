"use client";
import { memo,useEffect,useMemo,useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MALL,STORE_BACK_OFFSET,STORE_FRONT_OFFSET } from "@/lib/config/mall";
import type { PlacedSection } from "@/lib/config/sections";
import { useMallStore } from "@/lib/bridge/mallStore";
import { openState } from "@/mall/transitions/openState";
import { pathFrameAt } from "@/mall/navigation/path";
import { makeLabelTexture } from "@/mall/scene/labelTexture";
import { SectionVideoPanel } from "./SectionVideoPanel";
import { getPolishedStoneTexture,getStoreWallpaper } from "@/mall/scene/materialTextures";

const WALL_TONE={women:"#e4dbd6",men:"#d8dbdf"} as const;
const ACCENT_IDLE=new THREE.Color("#c9c2b5");
const ACCENT_HOT=new THREE.Color("#e3b66b");

function SectionBayImpl({s}:{s:PlacedSection}){
 const hovered=useMallStore(st=>st.hoveredId===s.id);
 const tutorialComplete=useMallStore(st=>st.tutorialComplete);
 const frame=useMemo(()=>pathFrameAt(s.sCenter),[s.sCenter]);
 const returnWidth=s.width>=8?1.2:0.6;
 const clearOpening=s.width-returnWidth*2;
 const depth=STORE_BACK_OFFSET-STORE_FRONT_OFFSET;
 const centreX=s.side*(STORE_FRONT_OFFSET+STORE_BACK_OFFSET)/2;
 const wallpaper=useMemo(()=>getStoreWallpaper(s.gender,s.id),[s.gender,s.id]);
 const stone=useMemo(()=>getPolishedStoneTexture(),[]);
 const sign=useMemo(()=>makeLabelTexture([
  {text:s.label.toUpperCase(),size:s.width>=8?46:40,weight:700,letterSpacing:5,color:"#24211d"},
  {text:s.gender==="women"?"WOMEN  ·  SHOPNET":"MEN  ·  SHOPNET",size:16,weight:500,letterSpacing:4,color:"#9a6a1f"}
 ],{width:768,height:128,bg:"#f6f3ee"}),[s]);
 const accent=useRef<THREE.MeshStandardMaterial>(null);
 const floorGlow=useRef<THREE.MeshBasicMaterial>(null);
 const revealScrim=useRef<THREE.Mesh>(null);
 const scrimProgress=useRef(0);
 const glow=useRef(0);
 // The polished floor texture is a shared cache entry; only this bay's sign texture is owned here.
 useEffect(()=>()=>{sign.dispose();},[sign]);
 useFrame((_,dt)=>{
  const active=hovered||openState.id===s.id;
  glow.current+=(Number(active)-glow.current)*(1-Math.exp(-dt*8));
  if(accent.current){accent.current.emissive.copy(ACCENT_IDLE).lerp(ACCENT_HOT,glow.current);accent.current.emissiveIntensity=0.22+glow.current*1.7;}
  if(floorGlow.current)floorGlow.current.opacity=glow.current*0.32;
  if(s.id==="women-blazers" && revealScrim.current){
   const target=tutorialComplete?1:0;
   scrimProgress.current+=(target-scrimProgress.current)*(1-Math.exp(-dt*1.45));
   revealScrim.current.position.y=1.95+scrimProgress.current*2.0;
   revealScrim.current.visible=scrimProgress.current<0.995;
  }
 });
 const sideZ=s.width/2-returnWidth/2;
 const signRotation=-s.side*Math.PI/2;
 return <group position={[frame.x,0,frame.z]} rotation-y={frame.yaw}>
  {[-1,1].map(edge=><group key={edge}>
   <mesh position={[centreX,MALL.ceiling/2,edge*sideZ]}>
    <boxGeometry args={[depth,MALL.ceiling,returnWidth]}/>
    <meshStandardMaterial map={wallpaper??undefined} color={WALL_TONE[s.gender]} roughness={0.74}/>
   </mesh>
   <mesh position={[centreX,MALL.ceiling/2,edge*(s.width/2-0.06)]}>
    <boxGeometry args={[depth,MALL.ceiling+0.04,0.055]}/>
    <meshStandardMaterial color="#b99a6a" metalness={0.72} roughness={0.27}/>
   </mesh>
  </group>)}
  <mesh position={[s.side*(STORE_BACK_OFFSET-0.06),MALL.ceiling/2,0]}>
   <boxGeometry args={[0.12,MALL.ceiling,s.width]}/>
   <meshStandardMaterial map={wallpaper??undefined} color={WALL_TONE[s.gender]} roughness={0.78}/>
  </mesh>
  <mesh position={[centreX,0.009,0]}>
   <boxGeometry args={[depth-0.06,0.018,s.width-0.04]}/>
   <meshStandardMaterial map={stone??undefined} color="#ddd5c9" roughness={0.3} metalness={0.04}/>
  </mesh>
  {[-1,1].map(edge=><mesh key={edge} position={[centreX,0.022,edge*(s.width/2-0.015)]}>
   <boxGeometry args={[depth-0.16,0.018,0.035]}/>
   <meshStandardMaterial color="#b99a6a" metalness={0.76} roughness={0.24}/>
  </mesh>)}
  <mesh position={[s.side*(STORE_FRONT_OFFSET+0.05),3.62,0]}>
   <boxGeometry args={[0.24,0.62,s.width+0.12]}/>
   <meshStandardMaterial color={WALL_TONE[s.gender]} metalness={0.24} roughness={0.28}/>
  </mesh>
  <mesh position={[s.side*(STORE_FRONT_OFFSET+0.19),3.62,0]} rotation-y={signRotation}>
   <planeGeometry args={[Math.max(2.4,clearOpening),0.46]}/>
   <meshStandardMaterial map={sign} emissive="#8f6629" emissiveMap={sign} emissiveIntensity={0.18} metalness={0.38} roughness={0.25}/>
  </mesh>
  <mesh position={[s.side*(STORE_BACK_OFFSET-0.18),3.9,0]}>
   <boxGeometry args={[0.035,0.055,s.width-0.55]}/>
   <meshStandardMaterial color="#fff1d8" emissive="#ffcf87" emissiveIntensity={1.25}/>
  </mesh>
  <mesh position={[s.side*(STORE_FRONT_OFFSET+0.19),3.22,0]}>
   <boxGeometry args={[0.04,0.035,clearOpening]}/>
   <meshStandardMaterial ref={accent} color="#d8d1c4" emissive={ACCENT_IDLE} emissiveIntensity={0.22}/>
  </mesh>
  <mesh position={[centreX,0.016,0]} rotation-x={-Math.PI/2}>
   <planeGeometry args={[0.82,s.width-0.35]}/>
   <meshBasicMaterial ref={floorGlow} color="#e8bd79" transparent opacity={0} depthWrite={false}/>
  </mesh>
  <SectionVideoPanel section={s}/>
  {s.id==="women-blazers" && !tutorialComplete && (
   <mesh ref={revealScrim} position={[s.side*(STORE_FRONT_OFFSET+0.12),1.95,0]} rotation-y={-s.side*Math.PI/2}>
    <planeGeometry args={[clearOpening,3.45]}/>
    <meshStandardMaterial color="#d8c8ae" transparent opacity={0.58} roughness={0.32} metalness={0.12} depthWrite={false} side={THREE.DoubleSide}/>
   </mesh>
  )}
 </group>;
}
export const SectionBay=memo(SectionBayImpl);
