import test from 'node:test';
import assert from 'node:assert/strict';
import {spriteRegion} from '../dist/sprite-art.js';
const image={src:'assets/followers-family-v2.png',naturalWidth:1122,naturalHeight:1402};
// Measured opaque bounds of the actual sheet, including ears, feet and attack marks.
const rows=[[79,296],[362,562],[624,815],[880,1028],[1095,1345]];
const columns=[[[54,253],[335,527],[567,798],[879,1077]],[[45,257],[319,527],[564,807],[872,1076]],[[71,242],[345,529],[567,779],[850,1074]],[[60,261],[322,527],[559,806],[871,1074]],[[73,226],[339,491],[572,758],[868,1025]]];
test('every follower frame includes its whole body and excludes adjacent rows and poses',()=>{
 for(let row=0;row<5;row++)for(let col=0;col<4;col++){
  const r=spriteRegion(image,4,5,row,col),[top,bottom]=rows[row],[left,right]=columns[row][col];
  assert.ok(r.top<=top&&r.top+r.h>bottom);assert.ok(r.left<=left&&r.left+r.w>right);
  if(row>0)assert.ok(r.top>rows[row-1][1]);if(row<4)assert.ok(r.top+r.h<=rows[row+1][0]);
  if(col>0)assert.ok(r.left>columns[row][col-1][1]);if(col<3)assert.ok(r.left+r.w<=columns[row][col+1][0]);
 }
});
test('ordinary sprite grids retain their existing source regions',()=>{
 assert.deepEqual(spriteRegion({src:'other.png',naturalWidth:800,naturalHeight:400},4,2,1,2),{left:400,top:200,w:200,h:200});
});
