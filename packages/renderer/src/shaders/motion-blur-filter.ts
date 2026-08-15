import { Filter, GlProgram, GpuProgram } from 'pixi.js';

const defaultGlslVertex = `
in vec2 aPosition;
out vec2 vTextureCoord;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition(void) {
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
    return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord(void) {
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

void main(void) {
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
}
`;

const defaultGlslFragment = `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform vec2 uVelocity;
uniform float uIntensity;

void main(void) {
    vec2 vel = uVelocity * uIntensity;
    vec4 color = texture(uTexture, vTextureCoord);

    // 4-tap directional accumulation
    color += texture(uTexture, vTextureCoord - vel * 0.25);
    color += texture(uTexture, vTextureCoord - vel * 0.50);
    color += texture(uTexture, vTextureCoord - vel * 0.75);
    color += texture(uTexture, vTextureCoord - vel * 1.00);

    finalColor = color / 5.0;
}
`;

const defaultWgslVertex = `
struct GlobalFilterUniforms {
  uInputSize: vec4<f32>,
  uInputPixel: vec4<f32>,
  uInputClamp: vec4<f32>,
  uOutputFrame: vec4<f32>,
  uGlobalFrame: vec4<f32>,
  uOutputTexture: vec4<f32>,
};

@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;

struct VSOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn mainVertex(@location(0) aPosition: vec2<f32>) -> VSOutput {
  var output: VSOutput;
  let position = aPosition * gfu.uOutputFrame.zw + gfu.uOutputFrame.xy;
  output.position = vec4<f32>(
    position.x * (2.0 / gfu.uOutputTexture.x) - 1.0,
    position.y * (2.0 * gfu.uOutputTexture.z / gfu.uOutputTexture.y) - gfu.uOutputTexture.z,
    0.0,
    1.0
  );
  output.uv = aPosition * (gfu.uOutputFrame.zw * gfu.uInputSize.zw);
  return output;
}
`;

const defaultWgslFragment = `
struct MotionBlurUniforms {
  uVelocity: vec2<f32>,
  uIntensity: f32,
};

@group(0) @binding(1) var uTexture: texture_2d<f32>;
@group(0) @binding(2) var uSampler: sampler;
@group(1) @binding(0) var<uniform> uniforms: MotionBlurUniforms;

@fragment
fn mainFragment(
  @location(0) uv: vec2<f32>,
  @builtin(position) position: vec4<f32>
) -> @location(0) vec4<f32> {
  let vel = uniforms.uVelocity * uniforms.uIntensity;
  var color = textureSample(uTexture, uSampler, uv);
  color += textureSample(uTexture, uSampler, uv - vel * 0.25);
  color += textureSample(uTexture, uSampler, uv - vel * 0.50);
  color += textureSample(uTexture, uSampler, uv - vel * 0.75);
  color += textureSample(uTexture, uSampler, uv - vel * 1.00);
  return color / 5.0;
}
`;

export class MotionBlurFilter extends Filter {
  constructor(velocityX: number = 0, velocityY: number = 0, intensity: number = 0.005) {
    if (typeof document !== 'undefined') {
      const glProgram = GlProgram.from({
        vertex: defaultGlslVertex,
        fragment: defaultGlslFragment,
        name: 'motion-blur-filter-gl',
      });

      const gpuProgram = GpuProgram.from({
        vertex: {
          source: defaultWgslVertex,
          entryPoint: 'mainVertex',
        },
        fragment: {
          source: defaultWgslFragment,
          entryPoint: 'mainFragment',
        },
        name: 'motion-blur-filter-gpu',
      });

      super({
        glProgram,
        gpuProgram,
        resources: {
          motionBlurUniforms: {
            uVelocity: { value: [velocityX, velocityY], type: 'vec2<f32>' },
            uIntensity: { value: intensity, type: 'f32' },
          },
        },
      });
    } else {
      // Headless / Node testing fallback
      super({});
    }
  }

  public setVelocity(vx: number, vy: number): void {
    if (this.resources && this.resources.motionBlurUniforms) {
      const uniforms = this.resources.motionBlurUniforms.uniforms;
      if (uniforms && uniforms.uVelocity) {
        uniforms.uVelocity[0] = vx;
        uniforms.uVelocity[1] = vy;
      }
    }
  }
}
