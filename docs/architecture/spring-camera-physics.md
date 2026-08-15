# Spring Camera Physics & Mathematical Formulations

This document details the mathematical models and physics engines powering camera tracking, multi-curve easing, viewport avoidance framing, and vector cursor smoothing in `@focaldom/core`.

---

## 1. 2nd-Order Differential Spring Camera ODE

The camera's position $(x, y)$ and zoom scale ($s$) are modeled as a critically or under-damped spring-mass-damper system governed by the 2nd-order ordinary differential equation:

$$F_{\text{net}} = -k (x - x_{\text{target}}) - c \cdot v$$

$$\ddot{x} = \frac{-k(x - x_{\text{target}}) - c \cdot \dot{x}}{m}$$

Where:
- $k$: Spring Stiffness (`stiffness`, default `140`)
- $c$: Damping Coefficient (`damping`, default `16`)
- $m$: Virtual Camera Mass (`mass`, default `1.0`)
- $x, x_{\text{target}}$: Current and target state coordinates
- $v$: Instantaneous velocity ($\dot{x}$)

### Numerical Sub-Stepping Integration
To guarantee numerical stability regardless of frame delta variance ($\Delta t$), the simulation performs sub-stepping integration at a maximum step size of $\Delta t_{\text{sub}} \le \frac{1}{120}\text{s}$:

```typescript
const subSteps = Math.max(1, Math.ceil(deltaTimeSeconds / (1 / 120)));
const dt = deltaTimeSeconds / subSteps;

for (let i = 0; i < subSteps; i++) {
  const ax = (stiffness * (target.x - current.x) - damping * velocity.x) / mass;
  const ay = (stiffness * (target.y - current.y) - damping * velocity.y) / mass;
  const aScale = (stiffness * (target.scale - current.scale) - damping * velocity.scale) / mass;

  velocity.x += ax * dt;
  velocity.y += ay * dt;
  velocity.scale += aScale * dt;

  current.x += velocity.x * dt;
  current.y += velocity.y * dt;
  current.scale += velocity.scale * dt;
}
```

---

## 2. Multi-Curve Analytical Easing Formulations

When keyframes explicitly specify non-spring easing transitions, FocalDOM evaluates closed-form analytical interpolation curves:

### 1. `easeInOutCubic`
Provides smooth acceleration and deceleration with continuous $C^1$ derivatives:

$$f(t) = \begin{cases} 4t^3 & \text{for } t < 0.5 \\ 1 - \frac{(-2t + 2)^3}{2} & \text{for } t \ge 0.5 \end{cases}$$

### 2. `easeOutQuad`
Provides rapid initial motion with gentle deceleration into the target frame:

$$f(t) = 1 - (1 - t)^2$$

### 3. `linear`
Direct proportional interpolation:

$$f(t) = t$$

---

## 3. Viewport Dead-Zone Avoidance Framing

When zooming into an element on a web page, sticky headers, fixed navigation bars, and floating footers can obstruct content. FocalDOM calculates an **unobstructed usable viewport rectangle**:

```
┌─────────────────────────────────────────────────────────────┐
│ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒ Fixed / Sticky Top Header ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ │  <- deadZones.top
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                Usable Unobstructed Viewport                 │
│                 (Target Element Framed Here)                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ ▒▒▒▒▒▒▒▒▒▒▒▒▒ Fixed / Sticky Bottom Bar ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ │  <- deadZones.bottom
└─────────────────────────────────────────────────────────────┘
```

### Usable Center & Scale Calculation:
$$\text{UsableWidth} = \text{ViewportWidth} - \text{DeadZone}_{\text{left}} - \text{DeadZone}_{\text{right}}$$
$$\text{UsableHeight} = \text{ViewportHeight} - \text{DeadZone}_{\text{top}} - \text{DeadZone}_{\text{bottom}}$$

$$\text{Scale}_{\text{desired}} = \min\left(\frac{\text{UsableWidth}}{\text{ElementWidth} \times \text{PaddingRatio}}, \frac{\text{UsableHeight}}{\text{ElementHeight} \times \text{PaddingRatio}}\right)$$

$$\text{TargetPanX} = (\text{UsableCenterX} - \text{ElementCenterX}) \times \text{Scale}_{\text{desired}}$$
$$\text{TargetPanY} = (\text{UsableCenterY} - \text{ElementCenterY}) \times \text{Scale}_{\text{desired}}$$

---

## 4. Cubic Bezier Vector Cursor Smoothing

Raw recorded mouse events often exhibit sub-pixel jitter or discrete step artifacts. The `CubicBezierSmoother` computes Catmull-Rom spline control points from neighboring velocity tangents:

Given consecutive sample points $P_0, P_1, P_2, P_3$:

$$\text{CP}_1 = P_1 + \frac{P_2 - P_0}{6} \cdot \tau$$
$$\text{CP}_2 = P_2 - \frac{P_3 - P_1}{6} \cdot \tau$$

Where $\tau = 0.5$ represents the spline tension parameter. The interpolated position $B(t)$ for $t \in [0, 1]$ is computed as:

$$B(t) = (1-t)^3 P_1 + 3(1-t)^2 t \text{CP}_1 + 3(1-t)t^2 \text{CP}_2 + t^3 P_2$$
