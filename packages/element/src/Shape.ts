import { simplify } from "points-on-curve";

import {
  pointFrom,
  pointDistance,
  type LocalPoint,
  pointRotateRads,
} from "@excalidraw/math";
import { ROUGHNESS, isTransparent, assertNever } from "@excalidraw/common";

import { RoughGenerator } from "roughjs/bin/generator";

import type { GlobalPoint } from "@excalidraw/math";

import type { Mutable } from "@excalidraw/common/utility-types";

import type { ElementShapes } from "@excalidraw/excalidraw/scene/types";

import { isElbowArrow, isLinearElement } from "./typeChecks";
import { getCornerRadius, isPathALoop } from "./shapes";
import { headingForPointIsHorizontal } from "./heading";

import { canChangeRoundness } from "./comparisons";
import { generateFreeDrawShape } from "./renderElement";
import {
  getArrowheadPoints,
  getCenterForBounds,
  getDiamondPoints,
  getElementBounds,
} from "./bounds";

import type {
  ExcalidrawElement,
  NonDeletedExcalidrawElement,
  ExcalidrawSelectionElement,
  ExcalidrawLinearElement,
  Arrowhead,
  ExcalidrawFreeDrawElement,
  ElementsMap,
} from "./types";

import type { Drawable, Options } from "roughjs/bin/core";
import type { Point as RoughPoint } from "roughjs/bin/geometry";

const getDashArrayDashed = (strokeWidth: number) => [8, 8 + strokeWidth];

const getDashArrayDotted = (strokeWidth: number) => [1.5, 6 + strokeWidth];

function adjustRoughness(element: ExcalidrawElement): number {
  const roughness = element.roughness;

  const maxSize = Math.max(element.width, element.height);
  const minSize = Math.min(element.width, element.height);

  // don't reduce roughness if
  if (
    // both sides relatively big
    (minSize >= 20 && maxSize >= 50) ||
    // is round & both sides above 15px
    (minSize >= 15 &&
      !!element.roundness &&
      canChangeRoundness(element.type)) ||
    // relatively long linear element
    (isLinearElement(element) && maxSize >= 50)
  ) {
    return roughness;
  }

  return Math.min(roughness / (maxSize < 10 ? 3 : 2), 2.5);
}

export const generateRoughOptions = (
  element: ExcalidrawElement,
  continuousPath = false,
): Options => {
  const options: Options = {
    seed: element.seed,
    strokeLineDash:
      element.strokeStyle === "dashed"
        ? getDashArrayDashed(element.strokeWidth)
        : element.strokeStyle === "dotted"
        ? getDashArrayDotted(element.strokeWidth)
        : undefined,
    // for non-solid strokes, disable multiStroke because it tends to make
    // dashes/dots overlay each other
    disableMultiStroke: element.strokeStyle !== "solid",
    // for non-solid strokes, increase the width a bit to make it visually
    // similar to solid strokes, because we're also disabling multiStroke
    strokeWidth:
      element.strokeStyle !== "solid"
        ? element.strokeWidth + 0.5
        : element.strokeWidth,
    // when increasing strokeWidth, we must explicitly set fillWeight and
    // hachureGap because if not specified, roughjs uses strokeWidth to
    // calculate them (and we don't want the fills to be modified)
    fillWeight: element.strokeWidth / 2,
    hachureGap: element.strokeWidth * 4,
    roughness: adjustRoughness(element),
    stroke: element.strokeColor,
    preserveVertices:
      continuousPath || element.roughness < ROUGHNESS.cartoonist,
  };

  switch (element.type) {
    case "rectangle":
    case "diamond":
    case "ellipse": {
      options.fillStyle = element.fillStyle;
      options.fill = isTransparent(element.backgroundColor)
        ? undefined
        : element.backgroundColor;
      if (element.type === "ellipse") {
        options.curveFitting = 1;
      }
      return options;
    }
    case "line":
    case "freedraw": {
      if (isPathALoop(element.points)) {
        options.fillStyle = element.fillStyle;
        options.fill =
          element.backgroundColor === "transparent"
            ? undefined
            : element.backgroundColor;
      }
      return options;
    }
    case "arrow":
      return options;
    default: {
      throw new Error(`Unimplemented type ${element.type}`);
    }
  }
};

const getArrowheadShapes = (
  element: ExcalidrawLinearElement,
  shape: Drawable[],
  position: "start" | "end",
  arrowhead: Arrowhead,
  generator: RoughGenerator,
  options: Options,
  canvasBackgroundColor: string,
) => {
  const arrowheadPoints = getArrowheadPoints(
    element,
    shape,
    position,
    arrowhead,
  );

  if (arrowheadPoints === null) {
    return [];
  }

  const generateCrowfootOne = (
    arrowheadPoints: number[] | null,
    options: Options,
  ) => {
    if (arrowheadPoints === null) {
      return [];
    }

    const [, , x3, y3, x4, y4] = arrowheadPoints;

    return [generator.line(x3, y3, x4, y4, options)];
  };

  switch (arrowhead) {
    case "dot":
    case "circle":
    case "circle_outline": {
      const [x, y, diameter] = arrowheadPoints;

      // always use solid stroke for arrowhead
      delete options.strokeLineDash;

      return [
        generator.circle(x, y, diameter, {
          ...options,
          fill:
            arrowhead === "circle_outline"
              ? canvasBackgroundColor
              : element.strokeColor,

          fillStyle: "solid",
          stroke: element.strokeColor,
          roughness: Math.min(0.5, options.roughness || 0),
        }),
      ];
    }
    case "triangle":
    case "triangle_outline": {
      const [x, y, x2, y2, x3, y3] = arrowheadPoints;

      // always use solid stroke for arrowhead
      delete options.strokeLineDash;

      return [
        generator.polygon(
          [
            [x, y],
            [x2, y2],
            [x3, y3],
            [x, y],
          ],
          {
            ...options,
            fill:
              arrowhead === "triangle_outline"
                ? canvasBackgroundColor
                : element.strokeColor,
            fillStyle: "solid",
            roughness: Math.min(1, options.roughness || 0),
          },
        ),
      ];
    }
    case "diamond":
    case "diamond_outline": {
      const [x, y, x2, y2, x3, y3, x4, y4] = arrowheadPoints;

      // always use solid stroke for arrowhead
      delete options.strokeLineDash;

      return [
        generator.polygon(
          [
            [x, y],
            [x2, y2],
            [x3, y3],
            [x4, y4],
            [x, y],
          ],
          {
            ...options,
            fill:
              arrowhead === "diamond_outline"
                ? canvasBackgroundColor
                : element.strokeColor,
            fillStyle: "solid",
            roughness: Math.min(1, options.roughness || 0),
          },
        ),
      ];
    }
    case "crowfoot_one":
      return generateCrowfootOne(arrowheadPoints, options);
    case "bar":
    case "arrow":
    case "crowfoot_many":
    case "crowfoot_one_or_many":
    default: {
      const [x2, y2, x3, y3, x4, y4] = arrowheadPoints;

      if (element.strokeStyle === "dotted") {
        // for dotted arrows caps, reduce gap to make it more legible
        const dash = getDashArrayDotted(element.strokeWidth - 1);
        options.strokeLineDash = [dash[0], dash[1] - 1];
      } else {
        // for solid/dashed, keep solid arrow cap
        delete options.strokeLineDash;
      }
      options.roughness = Math.min(1, options.roughness || 0);
      return [
        generator.line(x3, y3, x2, y2, options),
        generator.line(x4, y4, x2, y2, options),
        ...(arrowhead === "crowfoot_one_or_many"
          ? generateCrowfootOne(
              getArrowheadPoints(element, shape, position, "crowfoot_one"),
              options,
            )
          : []),
      ];
    }
  }
};

export const generateLinearCollisionShape = (
  element: ExcalidrawLinearElement | ExcalidrawFreeDrawElement,
  elementsMap: ElementsMap,
) => {
  const generator = new RoughGenerator();
  const options: Options = {
    seed: element.seed,
    disableMultiStroke: true,
    disableMultiStrokeFill: true,
    roughness: 0,
    preserveVertices: true,
  };
  const center = getCenterForBounds(
    getElementBounds(element, elementsMap, true),
  );

  switch (element.type) {
    case "line":
    case "arrow": {
      // points array can be empty in the beginning, so it is important to add
      // initial position to it
      const points = element.points.length
        ? element.points
        : [pointFrom<LocalPoint>(0, 0)];

      if (isElbowArrow(element)) {
        return generator.path(generateElbowArrowShape(points, 16), options)
          .sets[0].ops;
      } else if (!element.roundness) {
        return points.map((point, idx) => {
          const p = pointRotateRads(
            pointFrom<GlobalPoint>(element.x + point[0], element.y + point[1]),
            center,
            element.angle,
          );

          return {
            op: idx === 0 ? "move" : "lineTo",
            data: pointFrom<LocalPoint>(p[0] - element.x, p[1] - element.y),
          };
        });
      }

      return generator
        .curve(points as unknown as RoughPoint[], options)
        .sets[0].ops.slice(0, element.points.length)
        .map((op, i) => {
          if (i === 0) {
            const p = pointRotateRads<GlobalPoint>(
              pointFrom<GlobalPoint>(
                element.x + op.data[0],
                element.y + op.data[1],
              ),
              center,
              element.angle,
            );

            return {
              op: "move",
              data: pointFrom<LocalPoint>(p[0] - element.x, p[1] - element.y),
            };
          }

          return {
            op: "bcurveTo",
            data: [
              pointRotateRads(
                pointFrom<GlobalPoint>(
                  element.x + op.data[0],
                  element.y + op.data[1],
                ),
                center,
                element.angle,
              ),
              pointRotateRads(
                pointFrom<GlobalPoint>(
                  element.x + op.data[2],
                  element.y + op.data[3],
                ),
                center,
                element.angle,
              ),
              pointRotateRads(
                pointFrom<GlobalPoint>(
                  element.x + op.data[4],
                  element.y + op.data[5],
                ),
                center,
                element.angle,
              ),
            ]
              .map((p) =>
                pointFrom<LocalPoint>(p[0] - element.x, p[1] - element.y),
              )
              .flat(),
          };
        });
    }
    case "freedraw": {
      if (element.points.length < 2) {
        return [];
      }

      const simplifiedPoints = simplify(
        element.points as Mutable<LocalPoint[]>,
        0.75,
      );

      return generator
        .curve(simplifiedPoints as [number, number][], options)
        .sets[0].ops.slice(0, element.points.length)
        .map((op, i) => {
          if (i === 0) {
            const p = pointRotateRads<GlobalPoint>(
              pointFrom<GlobalPoint>(
                element.x + op.data[0],
                element.y + op.data[1],
              ),
              center,
              element.angle,
            );

            return {
              op: "move",
              data: pointFrom<LocalPoint>(p[0] - element.x, p[1] - element.y),
            };
          }

          return {
            op: "bcurveTo",
            data: [
              pointRotateRads(
                pointFrom<GlobalPoint>(
                  element.x + op.data[0],
                  element.y + op.data[1],
                ),
                center,
                element.angle,
              ),
              pointRotateRads(
                pointFrom<GlobalPoint>(
                  element.x + op.data[2],
                  element.y + op.data[3],
                ),
                center,
                element.angle,
              ),
              pointRotateRads(
                pointFrom<GlobalPoint>(
                  element.x + op.data[4],
                  element.y + op.data[5],
                ),
                center,
                element.angle,
              ),
            ]
              .map((p) =>
                pointFrom<LocalPoint>(p[0] - element.x, p[1] - element.y),
              )
              .flat(),
          };
        });
    }
  }
};

/**
 * Generates the roughjs shape for given element.
 *
 * Low-level. Use `ShapeCache.generateElementShape` instead.
 *
 * @private
 */
export const _generateElementShape = (
  element: Exclude<NonDeletedExcalidrawElement, ExcalidrawSelectionElement>,
  generator: RoughGenerator,
  {
    isExporting,
    canvasBackgroundColor,
  }: {
    isExporting: boolean;
    canvasBackgroundColor: string;
  },
): Drawable | Drawable[] | null => {
  switch (element.type) {
    case "rectangle":
    case "diamond": {
      let shape: ElementShapes[typeof element.type];

      const [topX, topY, rightX, rightY, bottomX, bottomY, leftX, leftY] =
        getDiamondPoints(element);
      if (element.roundness) {
        const verticalRadius = getCornerRadius(Math.abs(topX - leftX), element);

        const horizontalRadius = getCornerRadius(
          Math.abs(rightY - topY),
          element,
        );

        shape = generator.path(
          `M ${topX + verticalRadius} ${topY + horizontalRadius} L ${
            rightX - verticalRadius
          } ${rightY - horizontalRadius}
            C ${rightX} ${rightY}, ${rightX} ${rightY}, ${
            rightX - verticalRadius
          } ${rightY + horizontalRadius}
            L ${bottomX + verticalRadius} ${bottomY - horizontalRadius}
            C ${bottomX} ${bottomY}, ${bottomX} ${bottomY}, ${
            bottomX - verticalRadius
          } ${bottomY - horizontalRadius}
            L ${leftX + verticalRadius} ${leftY + horizontalRadius}
            C ${leftX} ${leftY}, ${leftX} ${leftY}, ${leftX + verticalRadius} ${
            leftY - horizontalRadius
          }
            L ${topX - verticalRadius} ${topY + horizontalRadius}
            C ${topX} ${topY}, ${topX} ${topY}, ${topX + verticalRadius} ${
            topY + horizontalRadius
          }`,
          generateRoughOptions(element, true),
        );
      } else {
        shape = generator.polygon(
          [
            [topX, topY],
            [rightX, rightY],
            [bottomX, bottomY],
            [leftX, leftY],
          ],
          generateRoughOptions(element),
        );
      }
      return shape;
    }
    case "ellipse": {
      const shape: ElementShapes[typeof element.type] = generator.ellipse(
        element.width / 2,
        element.height / 2,
        element.width,
        element.height,
        generateRoughOptions(element),
      );
      return shape;
    }
    case "line":
    case "arrow": {
      let shape: ElementShapes[typeof element.type];
      const options = generateRoughOptions(element);

      // points array can be empty in the beginning, so it is important to add
      // initial position to it
      const points = element.points.length
        ? element.points
        : [pointFrom<LocalPoint>(0, 0)];

      if (isElbowArrow(element)) {
        // NOTE (mtolmacs): Temporary fix for extremely big arrow shapes
        if (
          !points.every(
            (point) => Math.abs(point[0]) <= 1e6 && Math.abs(point[1]) <= 1e6,
          )
        ) {
          console.error(
            `Elbow arrow with extreme point positions detected. Arrow not rendered.`,
            element.id,
            JSON.stringify(points),
          );
          shape = [];
        } else {
          shape = [
            generator.path(
              generateElbowArrowShape(points, 16),
              generateRoughOptions(element, true),
            ),
          ];
        }
      } else if (!element.roundness) {
        // curve is always the first element
        // this simplifies finding the curve for an element
        if (options.fill) {
          shape = [
            generator.polygon(points as unknown as RoughPoint[], options),
          ];
        } else {
          shape = [
            generator.linearPath(points as unknown as RoughPoint[], options),
          ];
        }
      } else {
        shape = [generator.curve(points as unknown as RoughPoint[], options)];
      }

      // add lines only in arrow
      if (element.type === "arrow") {
        const { startArrowhead = null, endArrowhead = "arrow" } = element;

        if (startArrowhead !== null) {
          const shapes = getArrowheadShapes(
            element,
            shape,
            "start",
            startArrowhead,
            generator,
            options,
            canvasBackgroundColor,
          );
          shape.push(...shapes);
        }

        if (endArrowhead !== null) {
          if (endArrowhead === undefined) {
            // Hey, we have an old arrow here!
          }

          const shapes = getArrowheadShapes(
            element,
            shape,
            "end",
            endArrowhead,
            generator,
            options,
            canvasBackgroundColor,
          );
          shape.push(...shapes);
        }
      }
      return shape;
    }
    case "freedraw": {
      let shape: ElementShapes[typeof element.type];
      generateFreeDrawShape(element);

      if (isPathALoop(element.points)) {
        // generate rough polygon to fill freedraw shape
        const simplifiedPoints = simplify(
          element.points as Mutable<LocalPoint[]>,
          0.75,
        );
        shape = generator.curve(simplifiedPoints as [number, number][], {
          ...generateRoughOptions(element),
          stroke: "none",
        });
      } else {
        shape = null;
      }
      return shape;
    }
    case "frame":
    case "text":
    case "image": {
      const shape: ElementShapes[typeof element.type] = null;
      // we return (and cache) `null` to make sure we don't regenerate
      // `element.canvas` on rerenders
      return shape;
    }
    default: {
      assertNever(
        element,
        `generateElementShape(): Unimplemented type ${(element as any)?.type}`,
      );
      return null;
    }
  }
};

const generateElbowArrowShape = (
  points: readonly LocalPoint[],
  radius: number,
) => {
  const subpoints = [] as [number, number][];
  for (let i = 1; i < points.length - 1; i += 1) {
    const prev = points[i - 1];
    const next = points[i + 1];
    const point = points[i];
    const prevIsHorizontal = headingForPointIsHorizontal(point, prev);
    const nextIsHorizontal = headingForPointIsHorizontal(next, point);
    const corner = Math.min(
      radius,
      pointDistance(points[i], next) / 2,
      pointDistance(points[i], prev) / 2,
    );

    if (prevIsHorizontal) {
      if (prev[0] < point[0]) {
        // LEFT
        subpoints.push([points[i][0] - corner, points[i][1]]);
      } else {
        // RIGHT
        subpoints.push([points[i][0] + corner, points[i][1]]);
      }
    } else if (prev[1] < point[1]) {
      // UP
      subpoints.push([points[i][0], points[i][1] - corner]);
    } else {
      subpoints.push([points[i][0], points[i][1] + corner]);
    }

    subpoints.push(points[i] as [number, number]);

    if (nextIsHorizontal) {
      if (next[0] < point[0]) {
        // LEFT
        subpoints.push([points[i][0] - corner, points[i][1]]);
      } else {
        // RIGHT
        subpoints.push([points[i][0] + corner, points[i][1]]);
      }
    } else if (next[1] < point[1]) {
      // UP
      subpoints.push([points[i][0], points[i][1] - corner]);
    } else {
      // DOWN
      subpoints.push([points[i][0], points[i][1] + corner]);
    }
  }

  const d = [`M ${points[0][0]} ${points[0][1]}`];
  for (let i = 0; i < subpoints.length; i += 3) {
    d.push(`L ${subpoints[i][0]} ${subpoints[i][1]}`);
    d.push(
      `Q ${subpoints[i + 1][0]} ${subpoints[i + 1][1]}, ${
        subpoints[i + 2][0]
      } ${subpoints[i + 2][1]}`,
    );
  }
  d.push(`L ${points[points.length - 1][0]} ${points[points.length - 1][1]}`);

  return d.join(" ");
};
