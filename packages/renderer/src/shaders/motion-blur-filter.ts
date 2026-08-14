import { Filter, GlProgram, GpuProgram } from 'pixi.js';

const defaultVertex = `
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

const fragmentSource = `
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

export class MotionBlurFilter extends Filter {
  constructor(velocityX: number = 0, velocityY: number = 0, intensity: number = 0.005) {
    if (typeof document !== 'undefined') {
      const glProgram = GlProgram.from({
        vertex: defaultVertex,
        fragment: fragmentSource,
        name: 'motion-blur-filter',
      });

      super({
        glProgram,
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
