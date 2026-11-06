
import {
  useEffect,
  useRef,
  type RefObject,
} from "react";

import * as THREE from "three";

type Point = {
  x: number;
  y: number;
  z?: number;
};

export type HandFrame = {
  timestamp: number;
  hands: {
    id: string;
    points: Point[];
  }[];
};

type VisualHand = {
  mesh: THREE.Mesh<
    THREE.ExtrudeGeometry,
    THREE.MeshPhysicalMaterial
  >;
  lastUpdated: number;
};

const UPDATE_INTERVAL_MS = 45;
const MAX_FRAME_AGE_MS = 230;

// MediaPipe finger landmarks:
// thumb, index, middle, ring, pinky.
const FINGERS = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12],
  [13, 14, 15, 16],
  [17, 18, 19, 20],
] as const;

const clamp = THREE.MathUtils.clamp;

function createMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffdfb5,
    emissive: 0x9d592b,
    emissiveIntensity: 0.08,

    transparent: true,
    opacity: 0.48,

    roughness: 0.19,
    metalness: 0.04,

    clearcoat: 1,
    clearcoatRoughness: 0.09,

    side: THREE.DoubleSide,
    depthWrite: false,
    flatShading: false,
  });
}

function midpoint(
  a: THREE.Vector2,
  b: THREE.Vector2
) {
  return a.clone().add(b).multiplyScalar(0.5);
}

function offsetPoint(
  point: THREE.Vector2,
  normal: THREE.Vector2,
  amount: number
) {
  return point
    .clone()
    .addScaledVector(normal, amount);
}

function createHandShape(
  landmarks: Point[],
  width: number,
  height: number
): {
  shape: THREE.Shape;
  palmWidth: number;
  depthTilt: number;
} | null {
  if (landmarks.length !== 21) {
    return null;
  }

  const p = landmarks.map(
    (point) =>
      new THREE.Vector2(
        (1 - point.x) * width,
        height - point.y * height
      )
  );

  if (
    p.some(
      (point) =>
        !Number.isFinite(point.x) ||
        !Number.isFinite(point.y)
    )
  ) {
    return null;
  }

  const palmWidth = p[5].distanceTo(p[17]);

  if (palmWidth < 5) {
    return null;
  }

  const shape = new THREE.Shape();

  // Widths are proportional to the actual
  // tracked hand rather than fixed pixels.
  const fingerWidths = [
    0.235,
    0.205,
    0.22,
    0.195,
    0.17,
  ].map((value) => value * palmWidth);

  // Create a rounded finger contour that follows
  // its four tracked joints.
  function fingerContour(
    chain: readonly number[],
    fingerWidth: number
  ) {
    const base = p[chain[0]];
    const tip = p[chain[3]];

    const direction = tip.clone().sub(base);

    if (direction.lengthSq() < 0.001) {
      direction.set(0, 1);
    }

    direction.normalize();

    const normal = new THREE.Vector2(
      -direction.y,
      direction.x
    );

    const widths = [
      fingerWidth * 0.57,
      fingerWidth * 0.49,
      fingerWidth * 0.43,
      fingerWidth * 0.37,
    ];

    const left = chain.map((index, i) =>
      offsetPoint(
        p[index],
        normal,
        widths[i]
      )
    );

    const right = chain.map((index, i) =>
      offsetPoint(
        p[index],
        normal,
        -widths[i]
      )
    );

    return {
      left,
      right,
      tip,
      normal,
      tipRadius: widths[3],
    };
  }

  const contours = FINGERS.map(
    (finger, index) =>
      fingerContour(
        finger,
        fingerWidths[index]
      )
  );

  // Determine which side of each finger points
  // toward the next finger. This keeps the
  // outline correct for either hand.
  function orientedContour(
    index: number,
    nextBase?: THREE.Vector2
  ) {
    const contour = contours[index];

    if (!nextBase) {
      return contour;
    }

    const leftDistance =
      contour.left[0].distanceTo(nextBase);

    const rightDistance =
      contour.right[0].distanceTo(nextBase);

    if (rightDistance <= leftDistance) {
      return contour;
    }

    return {
      ...contour,
      left: contour.right,
      right: contour.left,
      normal: contour.normal
        .clone()
        .negate(),
    };
  }

  // The outline is constructed from thumb to
  // pinky, with a smooth valley between fingers.
  const ordered = contours.map((_, i) =>
    orientedContour(
      i,
      i < 4
        ? p[FINGERS[i + 1][0]]
        : undefined
    )
  );

  // Ensure each successive finger starts from
  // the same contour direction.
  for (let i = 1; i < ordered.length; i++) {
    const previous = ordered[i - 1];
    const current = ordered[i];

    const distanceLeft =
      previous.right[0].distanceTo(
        current.left[0]
      );

    const distanceRight =
      previous.right[0].distanceTo(
        current.right[0]
      );

    if (distanceRight < distanceLeft) {
      const temporary = current.left;
      current.left = current.right;
      current.right = temporary;
      current.normal.negate();
    }
  }

  const wrist = p[0];

  const palmAcross = p[5]
    .clone()
    .sub(p[17])
    .normalize();

  const wristHalfWidth = palmWidth * 0.31;

  const wristThumbSide = wrist
    .clone()
    .addScaledVector(
      palmAcross,
      wristHalfWidth
    );

  const wristPinkySide = wrist
    .clone()
    .addScaledVector(
      palmAcross,
      -wristHalfWidth
    );

  // Start at the wrist.
  shape.moveTo(
    wristThumbSide.x,
    wristThumbSide.y
  );

  // Connect the wrist to the thumb.
  const thumb = ordered[0];

  const thumbStart = midpoint(
    wristThumbSide,
    thumb.left[0]
  );

  shape.quadraticCurveTo(
    thumbStart.x,
    thumbStart.y,
    thumb.left[0].x,
    thumb.left[0].y
  );

  function traceFinger(
    index: number
  ) {
    const finger = ordered[index];

    // Outer finger contour.
    for (let i = 1; i < 4; i++) {
      const point = finger.left[i];

      shape.lineTo(
        point.x,
        point.y
      );
    }

    // Rounded fingertip.
    const tip = finger.tip;

    const tipForward = finger.normal
      .clone();

    // Find the outward direction of the finger.
    const direction = p[FINGERS[index][3]]
      .clone()
      .sub(p[FINGERS[index][2]])
      .normalize();

    const roundedTip = tip
      .clone()
      .addScaledVector(
        direction,
        finger.tipRadius * 0.9
      );

    shape.quadraticCurveTo(
      roundedTip.x,
      roundedTip.y,
      finger.right[3].x,
      finger.right[3].y
    );

    // Inner finger contour.
    for (let i = 2; i >= 0; i--) {
      const point = finger.right[i];

      shape.lineTo(
        point.x,
        point.y
      );
    }

    void tipForward;
  }

  for (let i = 0; i < ordered.length; i++) {
    traceFinger(i);

    if (i === ordered.length - 1) {
      break;
    }

    const current = ordered[i];
    const next = ordered[i + 1];

    // Finger webbing: a soft U-shaped valley
    // rather than sharp, disconnected tubes.
    const valley = midpoint(
      p[FINGERS[i][0]],
      p[FINGERS[i + 1][0]]
    );

    const valleyDepth =
      i === 0 ? 0.16 : 0.08;

    const towardWrist = wrist
      .clone()
      .sub(valley)
      .normalize();

    valley.addScaledVector(
      towardWrist,
      palmWidth * valleyDepth
    );

    shape.quadraticCurveTo(
      valley.x,
      valley.y,
      next.left[0].x,
      next.left[0].y
    );
  }

  // Pinky-side palm contour.
  const pinkyBase = p[17];

  const outerPalm = midpoint(
    pinkyBase,
    wristPinkySide
  );

  outerPalm.addScaledVector(
    palmAcross,
    -palmWidth * 0.12
  );

  shape.quadraticCurveTo(
    outerPalm.x,
    outerPalm.y,
    wristPinkySide.x,
    wristPinkySide.y
  );

  // Close the wrist edge.
  const wristCenter = midpoint(
    wristThumbSide,
    wristPinkySide
  );

  const towardArm = wrist
    .clone()
    .sub(p[9])
    .normalize();

  wristCenter.addScaledVector(
    towardArm,
    palmWidth * 0.08
  );

  shape.quadraticCurveTo(
    wristCenter.x,
    wristCenter.y,
    wristThumbSide.x,
    wristThumbSide.y
  );

  shape.closePath();

  // Approximate the depth orientation from
  // MediaPipe's existing z values.
  const indexDepth = landmarks[5].z ?? 0;
  const pinkyDepth = landmarks[17].z ?? 0;

  const depthTilt = clamp(
    (indexDepth - pinkyDepth) * 1.2,
    -0.25,
    0.25
  );

  return {
    shape,
    palmWidth,
    depthTilt,
  };
}

function createGeometry(
  shape: THREE.Shape,
  palmWidth: number
) {
  // A bevel rounds the front, back and edges,
  // giving the silhouette real 3D thickness.
  const depth = clamp(
    palmWidth * 0.19,
    5,
    26
  );

  const bevel = clamp(
    palmWidth * 0.055,
    2,
    8
  );

  const geometry = new THREE.ExtrudeGeometry(
    shape,
    {
      depth,
      steps: 1,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 3,
      curveSegments: 5,
    }
  );

  geometry.computeVertexNormals();

  return geometry;
}

export function HandHologramOverlay({
  frameRef,
}: {
  frameRef?: RefObject<HandFrame | null>;
}) {
  const containerRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const scene = new THREE.Scene();

    const camera = new THREE.OrthographicCamera(
      0,
      1,
      1,
      0,
      0.1,
      3000
    );

    camera.position.set(
      0,
      0,
      1500
    );

    camera.lookAt(
      0,
      0,
      0
    );

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });

    renderer.setClearColor(
      0x000000,
      0
    );

    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio || 1,
        1.5
      )
    );

    renderer.outputColorSpace =
      THREE.SRGBColorSpace;

    renderer.domElement.style.width =
      "100%";

    renderer.domElement.style.height =
      "100%";

    renderer.domElement.style.display =
      "block";

    renderer.domElement.style.pointerEvents =
      "none";

    container.appendChild(
      renderer.domElement
    );

    // Champagne-gold studio lighting.
    const ambient = new THREE.AmbientLight(
      0xffe6ce,
      1.35
    );

    const key = new THREE.DirectionalLight(
      0xfff5e5,
      2.1
    );

    key.position.set(
      -280,
      360,
      700
    );

    const fill = new THREE.DirectionalLight(
      0xffc58b,
      0.85
    );

    fill.position.set(
      340,
      100,
      250
    );

    const rim = new THREE.DirectionalLight(
      0xffc48a,
      1.7
    );

    rim.position.set(
      220,
      -180,
      -400
    );

    scene.add(
      ambient,
      key,
      fill,
      rim
    );

    const material = createMaterial();

    const hands = new Map<
      string,
      VisualHand
    >();

    let animationId = 0;
    let previousWidth = 0;
    let previousHeight = 0;

    const render = (time: number) => {
      const width = Math.max(
        1,
        container.clientWidth
      );

      const height = Math.max(
        1,
        container.clientHeight
      );

      if (
        width !== previousWidth ||
        height !== previousHeight
      ) {
        previousWidth = width;
        previousHeight = height;

        renderer.setSize(
          width,
          height,
          false
        );

        camera.left = 0;
        camera.right = width;
        camera.top = height;
        camera.bottom = 0;

        camera.updateProjectionMatrix();
      }

      const frame = frameRef?.current;

      const visibleIds = new Set<string>();

      if (
        frame &&
        time - frame.timestamp <
          MAX_FRAME_AGE_MS
      ) {
        for (const trackedHand of frame.hands) {
          visibleIds.add(
            trackedHand.id
          );

          let hand = hands.get(
            trackedHand.id
          );

          if (!hand) {
            const initialGeometry =
              new THREE.ExtrudeGeometry(
                new THREE.Shape(),
                {
                  depth: 1,
                  bevelEnabled: false,
                }
              );

            const mesh = new THREE.Mesh(
              initialGeometry,
              material
            );

            mesh.frustumCulled = false;

            scene.add(mesh);

            hand = {
              mesh,
              lastUpdated: -Infinity,
            };

            hands.set(
              trackedHand.id,
              hand
            );
          }

          if (
            time - hand.lastUpdated >=
            UPDATE_INTERVAL_MS
          ) {
            const result = createHandShape(
              trackedHand.points,
              width,
              height
            );

            if (!result) {
              hand.mesh.visible = false;
              continue;
            }

            const geometry = createGeometry(
              result.shape,
              result.palmWidth
            );

            hand.mesh.geometry.dispose();
            hand.mesh.geometry = geometry;

            // The mesh is built in board coordinates,
            // so it requires no additional translation.
            hand.mesh.position.set(
              0,
              0,
              0
            );

            // Keep the silhouette facing the player.
            // A small tilt adds depth without
            // distorting the tracked finger positions.
            hand.mesh.rotation.set(
              0,
              0,
              0
            );

            hand.mesh.visible = true;
            hand.lastUpdated = time;

            // Depth is retained for future pose
            // refinement; avoid rotating the whole
            // board-space mesh around the origin.
            void result.depthTilt;
          }
        }
      }

      for (const [id, hand] of hands) {
        if (!visibleIds.has(id)) {
          hand.mesh.visible = false;
        }
      }

      renderer.render(
        scene,
        camera
      );

      animationId =
        requestAnimationFrame(render);
    };

    animationId =
      requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(
        animationId
      );

      for (const hand of hands.values()) {
        scene.remove(hand.mesh);
        hand.mesh.geometry.dispose();
      }

      hands.clear();

      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [frameRef]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 2,
      }}
    />
  );
}
