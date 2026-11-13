import { AudioBands } from '../types';

export interface ShaderCompilationResult {
  success: boolean;
  error?: string;
}

export interface GlslPresetTemplate {
  id: string;
  name: string;
  description: string;
  code: string;
}

export const GLSL_STARTER_PRESETS: GlslPresetTemplate[] = [
  {
    id: 'cyber_tunnel',
    name: 'Audio-Reactive Cyber Tunnel',
    description: 'Hypnotic pulsating infinite wireframe vortex synced to audio bass',
    code: `// Precision statement
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_audio;
uniform vec4 u_bands;

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    float r = length(uv);
    float a = atan(uv.y, uv.x);
    
    // Audio pulsation
    float pulse = 1.0 + u_audio * 1.5;
    
    // Tunnel coordinates
    float depth = 0.4 / (r + 0.02);
    float angle = a / 3.14159265;
    
    // Animated grid rings
    float rings = sin(depth * 8.0 - u_time * 4.0 * pulse);
    float spokes = sin(angle * 16.0 + u_time * 2.0);
    float grid = abs(rings * spokes);
    grid = smoothstep(0.1, 0.9, grid);
    
    // Color palette
    vec3 col1 = vec3(0.0, 0.95, 1.0);  // Cyan
    vec3 col2 = vec3(1.0, 0.0, 0.6);   // Neon Pink
    vec3 col = mix(col1, col2, sin(depth + u_time) * 0.5 + 0.5);
    
    col *= grid * (1.0 + u_bands.y * 2.0);
    col += vec3(0.1, 0.0, 0.2) / (r + 0.1); // Center glow
    
    gl_FragColor = vec4(col, 1.0);
}`,
  },
  {
    id: 'liquid_marble',
    name: 'Liquid Rainbow Marble',
    description: 'Smooth organic domain-warping fluid with vivid chromatic colors',
    code: `precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_audio;

void main() {
    vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution) / min(u_resolution.x, u_resolution.y);
    float t = u_time * 0.5;
    
    for(int i = 1; i < 6; i++) {
        float f = float(i);
        p.x += 0.3 / f * sin(f * 3.0 * p.y + t + 0.3 * f) + 0.5;
        p.y += 0.3 / f * cos(f * 3.0 * p.x + t + 0.3 * f) - 0.5;
    }
    
    float v = sin(p.x * 2.0) * sin(p.y * 2.0);
    vec3 col = 0.5 + 0.5 * cos(u_time * 0.4 + p.xyx + vec3(0.0, 2.0, 4.0));
    col *= 0.8 + 0.4 * v;
    col += u_audio * 0.4;
    
    gl_FragColor = vec4(col, 1.0);
}`,
  },
  {
    id: 'raymarch_orb',
    name: '3D Raymarched Neon Sphere',
    description: 'Real-time raymarched metallic crystal sphere with volumetric lighting',
    code: `precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_audio;

float map(vec3 p) {
    float displacement = sin(5.0 * p.x + u_time) * sin(5.0 * p.y + u_time) * sin(5.0 * p.z + u_time) * (0.15 + u_audio * 0.2);
    return length(p) - 1.0 - displacement;
}

vec3 calcNormal(vec3 p) {
    float d = map(p);
    vec2 e = vec2(0.001, 0.0);
    return normalize(vec3(
        map(p + e.xyy) - d,
        map(p + e.yxy) - d,
        map(p + e.yyx) - d
    ));
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
    vec3 ro = vec3(0.0, 0.0, -2.5);
    vec3 rd = normalize(vec3(uv, 1.0));
    
    float t = 0.0;
    for(int i = 0; i < 48; i++) {
        vec3 p = ro + rd * t;
        float d = map(p);
        if(d < 0.001 || t > 10.0) break;
        t += d;
    }
    
    vec3 col = vec3(0.02, 0.03, 0.08); // background
    if(t < 10.0) {
        vec3 p = ro + rd * t;
        vec3 n = calcNormal(p);
        vec3 light = normalize(vec3(sin(u_time), 1.0, cos(u_time) - 1.0));
        float diff = max(dot(n, light), 0.0);
        float spec = pow(max(dot(reflect(-light, n), -rd), 0.0), 32.0);
        
        vec3 rim = vec3(0.0, 1.0, 0.8) * pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
        vec3 base = mix(vec3(0.1, 0.0, 0.3), vec3(1.0, 0.0, 0.5), n.y * 0.5 + 0.5);
        col = base * diff + spec * vec3(1.0) + rim * 1.5;
    }
    
    gl_FragColor = vec4(col, 1.0);
}`,
  },
  {
    id: 'blank_starter',
    name: 'Minimal Blank Template',
    description: 'Clean starting point with all uniforms pre-wired',
    code: `precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_audio;
uniform vec4 u_bands; // subBass, bass, mid, high

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec3 col = 0.5 + 0.5 * cos(u_time + uv.xyx + vec3(0.0, 2.0, 4.0));
    gl_FragColor = vec4(col, 1.0);
}`,
  },
];

class GlslRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private vertexShader: WebGLShader | null = null;
  private fragmentShader: WebGLShader | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private lastCode: string = '';

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 960;
    this.canvas.height = 540;
    this.gl = this.canvas.getContext('webgl', { preserveDrawingBuffer: true, alpha: false });
    this.initBuffers();
  }

  private initBuffers() {
    const gl = this.gl;
    if (!gl) return;

    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    // Full screen quad (-1 to 1)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,
      ]),
      gl.STATIC_DRAW
    );
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public compile(code: string): ShaderCompilationResult {
    const gl = this.gl;
    if (!gl) return { success: false, error: 'WebGL not supported on this device' };

    // Vertex shader
    const vsSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Process code: if user pasted Shadertoy code (mainImage), wrap it
    let finalFragmentSource = code;
    if (code.includes('mainImage') && !code.includes('void main()')) {
      finalFragmentSource = `
        precision highp float;
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform float u_audio;
        uniform vec4 u_bands;
        
        #define iTime u_time
        #define iResolution vec3(u_resolution, 1.0)
        
        ${code}
        
        void main() {
          mainImage(gl_FragColor, gl_FragCoord.xy);
        }
      `;
    }

    const vs = gl.createShader(gl.VERTEX_SHADER);
    if (!vs) return { success: false, error: 'Failed to create vertex shader' };
    gl.shaderSource(vs, vsSource);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fs) return { success: false, error: 'Failed to create fragment shader' };
    gl.shaderSource(fs, finalFragmentSource);
    gl.compileShader(fs);

    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      const err = gl.getShaderInfoLog(fs) || 'Fragment shader compilation error';
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      return { success: false, error: err };
    }

    const prog = gl.createProgram();
    if (!prog) return { success: false, error: 'Failed to create WebGL program' };
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const err = gl.getProgramInfoLog(prog) || 'Program link error';
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      return { success: false, error: err };
    }

    // Clean up old program
    if (this.program) gl.deleteProgram(this.program);
    if (this.vertexShader) gl.deleteShader(this.vertexShader);
    if (this.fragmentShader) gl.deleteShader(this.fragmentShader);

    this.program = prog;
    this.vertexShader = vs;
    this.fragmentShader = fs;
    this.lastCode = code;

    return { success: true };
  }

  public render(
    width: number,
    height: number,
    timeSec: number,
    bands: AudioBands,
    code: string
  ): HTMLCanvasElement | null {
    const gl = this.gl;
    if (!gl) return null;

    if (code !== this.lastCode || !this.program) {
      const res = this.compile(code);
      if (!res.success) return null;
    }

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    gl.viewport(0, 0, width, height);
    gl.useProgram(this.program);

    // Bind uniforms
    const uTimeLoc = gl.getUniformLocation(this.program!, 'u_time');
    if (uTimeLoc) gl.uniform1f(uTimeLoc, timeSec);

    const uResLoc = gl.getUniformLocation(this.program!, 'u_resolution');
    if (uResLoc) gl.uniform2f(uResLoc, width, height);

    const uAudioLoc = gl.getUniformLocation(this.program!, 'u_audio');
    if (uAudioLoc) gl.uniform1f(uAudioLoc, bands.peak);

    const uBandsLoc = gl.getUniformLocation(this.program!, 'u_bands');
    if (uBandsLoc) gl.uniform4f(uBandsLoc, bands.subBass, bands.bass, bands.mid, bands.high);

    // Bind attributes
    const posAttr = gl.getAttribLocation(this.program!, 'a_position');
    gl.enableVertexAttribArray(posAttr);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    return this.canvas;
  }
}

export const glslRenderer = new GlslRenderer();

