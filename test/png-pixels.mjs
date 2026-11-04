// Read-only PNG decoder for checking the actual atlas pixels, without a browser or dependencies.
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
export function pngPixels(path){
 const b=readFileSync(path),width=b.readUInt32BE(16),height=b.readUInt32BE(20),channels=b[25]===6?4:3;
 if(b[24]!==8||![2,6].includes(b[25])||b[28]!==0)throw Error('Unsupported PNG format');
 const chunks=[];for(let p=8;p<b.length;){const n=b.readUInt32BE(p);if(b.toString('ascii',p+4,p+8)==='IDAT')chunks.push(b.subarray(p+8,p+8+n));p+=n+12}
 const raw=inflateSync(Buffer.concat(chunks)),stride=width*channels,data=new Uint8Array(stride*height);
 const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c};
 for(let y=0,src=0;y<height;y++){const filter=raw[src++];for(let x=0;x<stride;x++){const i=y*stride+x,a=x>=channels?data[i-channels]:0,u=y?data[i-stride]:0,c=y&&x>=channels?data[i-stride-channels]:0;data[i]=(raw[src++]+(filter===0?0:filter===1?a:filter===2?u:filter===3?Math.floor((a+u)/2):paeth(a,u,c)))&255}}
 return {width,height,alpha:(x,y)=>channels===4?data[(y*width+x)*4+3]:255};
}
