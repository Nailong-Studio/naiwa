// Older embedded WebViews can load the title UI but lack Canvas roundRect.
// Install only on our drawing context, leaving browser prototypes untouched.
// All game callers use one numeric radius shared by the four corners.
export function prepareGameCanvas(ctx){
 if(!ctx)throw new Error('无法创建游戏画面，请重新打开游戏。');
 if(typeof ctx.roundRect!=='function')ctx.roundRect=function(x,y,width,height,radius=0){
  if(typeof radius!=='number')throw new TypeError('Game roundRect expects one numeric radius');
  if(radius<0)throw new RangeError('Corner radius cannot be negative');
  if(![x,y,width,height,radius].every(Number.isFinite))return;
  if(width<0){x+=width;width=-width}
  if(height<0){y+=height;height=-height}
  const r=Math.min(radius,width/2,height/2),right=x+width,bottom=y+height;
  this.moveTo(x+r,y);
  this.lineTo(right-r,y);this.arcTo(right,y,right,y+r,r);
  this.lineTo(right,bottom-r);this.arcTo(right,bottom,right-r,bottom,r);
  this.lineTo(x+r,bottom);this.arcTo(x,bottom,x,bottom-r,r);
  this.lineTo(x,y+r);this.arcTo(x,y,x+r,y,r);
  this.closePath();this.moveTo(x,y);
 };
 return ctx;
}
