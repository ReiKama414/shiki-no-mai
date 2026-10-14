export const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

export const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uFrom;
  uniform sampler2D uTo;
  uniform vec2 uResolution;
  uniform vec2 uPointer;
  uniform vec3 uSeasonColor;
  uniform vec3 uPaper;
  uniform float uTime;
  uniform float uMorph;
  uniform float uRotate;
  uniform float uFlow;
  uniform float uLens;
  uniform float uDots;
  uniform float uLines;
  uniform float uPixels;
  uniform float uGrain;
  uniform float uSplit;
  uniform float uMix;
  uniform float uScatter;
  uniform float uReveal;

  #define paper uPaper
  const float PI = 3.14159265359;
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),
               mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);
  }
  mat2 rotate(float a) {
    float c=cos(a),s=sin(a);
    return mat2(c,-s,s,c);
  }
  float box(vec2 p, vec2 b) {
    vec2 d=abs(p)-b;
    return length(max(d,0.0))+min(max(d.x,d.y),0.0);
  }
  float circlePetals(vec2 p) {
    return length(abs(p)-vec2(0.235))-0.242;
  }
  float capsules(vec2 p) {
    vec2 q=vec2(p.x, abs(p.y)-0.235);
    return length(vec2(max(abs(q.x)-0.235,0.0),q.y))-0.242;
  }
  float pointedPetals(vec2 p) {
    // Opposing outer square corners match the third silhouette in the film.
    vec2 q=abs(p)-vec2(0.235);
    float round=length(q)-0.242;
    vec2 corner=vec2(sign(p.x)*0.47,sign(p.y)*0.47);
    float wedge=max(box(p-corner*0.75,vec2(0.1175)),
                    dot(abs(p),vec2(0.7071))-0.666);
    float hole=0.063-(abs(p.x)+abs(p.y));
    return max(min(round,wedge),hole);
  }
  float circleLattice(vec2 p) {
    vec2 q=vec2(mod(p.x+0.235,0.47)-0.235,abs(p.y)-0.235);
    return max(length(q)-0.239,box(p,vec2(0.47)));
  }
  float shape(vec2 p,float m) {
    float a=circlePetals(p), b=capsules(p), c=pointedPetals(p), d=circleLattice(p);
    if(m<1.0) return mix(a,b,m);
    if(m<2.0) return mix(b,c,m-1.0);
    if(m<3.0) return mix(c,d,m-2.0);
    return mix(d,a,m-3.0);
  }
  vec2 imageUv(vec2 p) {
    // Uniform cover scale preserves the original 1672 × 941 aspect ratio.
    // All four supplied compositions place their figures inside this central
    // 56.3% width; only the surrounding scenery extends beyond the silhouette.
    vec2 uv=p*vec2(941.0/1672.0,1.0)+0.5;
    return clamp(uv,vec2(0.001),vec2(0.999));
  }
  vec3 photo(vec2 p) {
    vec2 uv=imageUv(p);
    vec2 shift=vec2(uSplit*0.009,0.0);
    vec3 a=texture2D(uFrom,uv).rgb;
    vec3 b=texture2D(uTo,uv).rgb;
    vec3 color=mix(a,b,uMix);
    color.r=mix(texture2D(uFrom,uv+shift).r,texture2D(uTo,uv+shift).r,uMix);
    color.b=mix(texture2D(uFrom,uv-shift).b,texture2D(uTo,uv-shift).b,uMix);
    return color;
  }
  void main() {
    vec2 p=(vUv-0.5)*vec2(720.0,900.0)/550.0;
    // Image and mask rotate independently, as in the source video.
    vec2 maskP=rotate(uRotate)*p;
    float aa=720.0/uResolution.x/550.0;
    float sdf=shape(maskP,uMorph);
    // Keep the central character band intact even in the open lattice mask.
    float subject=length(p/vec2(0.135,0.29))-1.0;
    sdf=min(sdf,subject*0.17);
    float mask=1.0-smoothstep(-aa,aa,sdf);

    vec2 st=p-uPointer*0.006;
    float r=length(st);
    float lensFall=exp(-r*r*7.0);
    st=rotate(uLens*lensFall*2.7)*st;
    st *= 1.0 + sin(r*27.0-uTime*2.0)*uLens*0.095*lensFall;
    vec2 flow=vec2(
      sin(st.y*9.0+uTime*1.5)+sin(st.x*6.0-st.y*4.0+uTime),
      cos(st.x*7.0-uTime*1.3));
    st += flow * uFlow * 0.026;

    float cell=0.012;
    vec2 id=floor((p+0.5)/cell);
    float seed=hash(id);
    vec2 displace=vec2(hash(id+1.3)-0.5,hash(id+8.7)-0.5);
    st += displace*uScatter*0.075*(0.3+r);
    float pixelSize=mix(0.001,0.014,uPixels);
    st=mix(st,(floor(st/pixelSize)+0.5)*pixelSize,uPixels);
    vec3 color=photo(st);

    // The dot layer changes both sampling resolution and each dot's radius.
    vec2 dotP=(p+0.5)/cell;
    vec2 center=(floor(dotP)+0.5)*cell-0.5;
    vec3 sampled=photo(center);
    float lum=dot(sampled,vec3(0.2126,0.7152,0.0722));
    float radius=mix(0.29,0.48,lum);
    float dotMask=1.0-smoothstep(radius-0.065,radius+0.065,length(fract(dotP)-0.5));
    vec3 dots=mix(paper,sampled,dotMask);
    color=mix(color,dots,uDots);

    float lineWave=sin((p.y + sin(p.x*6.0)*uFlow*0.16)*1100.0);
    vec3 lineColor=mix(color,uSeasonColor*0.48,0.7);
    color=mix(color,mix(lineColor,paper,smoothstep(-0.15,0.15,lineWave)),uLines*0.85);
    vec2 gridP=fract((p+0.5)/0.017);
    float grid=step(0.90,max(gridP.x,gridP.y));
    color=mix(color,color*0.38,grid*uPixels*0.62);
    float grain=hash(floor(vUv*uResolution)+floor(uTime*24.0));
    color+=vec3((grain-0.5)*uGrain*0.30);
    color=clamp(color,0.0,1.0);

    float reveal=smoothstep(seed-0.14,seed+0.14,uReveal*1.3);
    mask*=reveal;
    // Discrete fragments only appear at the outline during the measured switch.
    float fragments=step(0.74,seed)*
       (1.0-smoothstep(0.0,0.038*uScatter+0.00001,sdf))*
       smoothstep(-0.005,0.007,sdf)*uScatter;
    float fragmentDot=1.0-smoothstep(0.22,0.35,length(fract(dotP)-0.5));
    mask=max(mask,fragments*fragmentDot);
    // Outside the silhouette, leave the shared page atmosphere untouched.
    // Premultiply explicitly so embedded WebViews cannot expose RGB from
    // transparent pixels as a rectangular plate (especially during grain).
    mask=clamp(mask,0.0,1.0);
    if(mask<0.0001) discard;
    gl_FragColor=vec4(color*mask,mask);
  }
`
