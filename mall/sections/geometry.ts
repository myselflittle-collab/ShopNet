import * as THREE from "three";
import { MALL, STORE_BACK_OFFSET, STORE_FRONT_OFFSET } from "@/lib/config/mall";
import type { PlacedSection } from "@/lib/config/sections";
import { pathFrameAt, pathOffsetAt, pathSamples } from "@/mall/navigation/path";

export function makePathRibbonGeometry(s0:number,s1:number,lateralMin:number,lateralMax:number,y:number,sampleStep=0.25){
 const samples=pathSamples(s0,s1,sampleStep), vertices:number[]=[], indices:number[]=[];
 for(const frame of samples){const a=pathOffsetAt(frame.s,lateralMin),b=pathOffsetAt(frame.s,lateralMax);vertices.push(a.x,y,a.z,b.x,y,b.z);}
 for(let i=0;i<samples.length-1;i++){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
 const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function makePathWallGeometry(s0:number,s1:number,lateral:number,bottom:number,top:number,sampleStep=0.25){
 const samples=pathSamples(s0,s1,sampleStep),vertices:number[]=[],indices:number[]=[];
 for(const frame of samples){const p=pathOffsetAt(frame.s,lateral);vertices.push(p.x,bottom,p.z,p.x,top,p.z);}
 for(let i=0;i<samples.length-1;i++){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
 const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function sectionWorldMatrix(section:PlacedSection){
 const f=pathFrameAt(section.sCenter),p=new THREE.Vector3(f.x,0,f.z),q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),f.yaw);
 return new THREE.Matrix4().compose(p,q,new THREE.Vector3(1,1,1));
}
export function sectionHitBox(section:PlacedSection,expand=0):THREE.Box3{
 const a=section.side*(STORE_FRONT_OFFSET-0.15),b=section.side*(STORE_BACK_OFFSET+0.15);
 return new THREE.Box3(new THREE.Vector3(Math.min(a,b),0,-section.width/2),new THREE.Vector3(Math.max(a,b),MALL.ceiling,section.width/2)).expandByScalar(expand);
}
export function sectionAnchor(section:PlacedSection):THREE.Vector3{
 return new THREE.Vector3(section.side*2.18,2.55,0).applyMatrix4(sectionWorldMatrix(section));
}
export const BAY_INNER={frontX:(_s:PlacedSection)=>STORE_FRONT_OFFSET,backX:(_s:PlacedSection)=>STORE_BACK_OFFSET,centreX:(_s:PlacedSection)=>(STORE_FRONT_OFFSET+STORE_BACK_OFFSET)/2};
