import type { SnowveilCourse } from "./snowveil-course.ts";
import { snowHeightAt } from "./snowveil-terrain.ts";
import {
  createWorldGeometryBuilder,
  type Vec3,
} from "./snowveil-world-geometry.ts";

export const COURSE_MATERIAL = {
  boundaryPole: 0,
  reflector: 1,
  rope: 2,
  pennant: 3,
  snowCap: 4,
  checkerDark: 5,
  checkerLight: 6,
  goalAccent: 7,
} as const;

export function createSnowveilCourseGeometry(course: SnowveilCourse) {
  const builder = createWorldGeometryBuilder();
  const courseHeight = (x: number, z: number) => snowHeightAt(x, z, course.terrainMode);
  const courseLength = course.startZ - course.finishZ;
  const postSpacing = 4.15;
  const spanCount = Math.ceil(courseLength / postSpacing);

  const addSafetyPost = (x: number, z: number, height = 1.64) => {
    const ground = courseHeight(x, z) - 0.06;
    builder.addTaperedTube(
      [x, ground - 0.14, z],
      [x, ground + height, z],
      0.05,
      0.044,
      COURSE_MATERIAL.boundaryPole,
    );
    builder.addTaperedTube(
      [x, ground + 0.72, z],
      [x, ground + 0.88, z],
      0.058,
      0.056,
      COURSE_MATERIAL.reflector,
    );
    builder.addTaperedTube(
      [x, ground + 1.22, z],
      [x, ground + 1.4, z],
      0.058,
      0.055,
      COURSE_MATERIAL.reflector,
    );
    builder.addTaperedTube(
      [x, ground + height, z],
      [x, ground + height + 0.11, z],
      0.062,
      0.012,
      COURSE_MATERIAL.snowCap,
    );
  };

  const addRopeSpan = (x: number, startZ: number, endZ: number, flagSide: number) => {
    const ropeSegments = 4;
    for (let segment = 0; segment < ropeSegments; segment += 1) {
      const startProgress = segment / ropeSegments;
      const endProgress = (segment + 1) / ropeSegments;
      const pointAt = (progress: number): Vec3 => {
        const z = startZ + (endZ - startZ) * progress;
        const sag = Math.sin(progress * Math.PI) * 0.15;
        return [x, courseHeight(x, z) + 0.92 - sag, z];
      };
      builder.addTaperedTube(
        pointAt(startProgress),
        pointAt(endProgress),
        0.024,
        0.024,
        COURSE_MATERIAL.rope,
        6,
      );
    }

    const flagZ = (startZ + endZ) * 0.5;
    const ropeY = courseHeight(x, flagZ) + 0.77;
    const inward = -Math.sign(x || 1);
    const flagPoints: [Vec3, Vec3, Vec3, Vec3] = [
      [x + inward * 0.018, ropeY + 0.13, flagZ - 0.31],
      [x + inward * 0.018, ropeY + 0.13, flagZ + 0.31],
      [x + inward * 0.04, ropeY - 0.2, flagZ + 0.18],
      [x + inward * 0.04, ropeY - 0.2, flagZ - 0.18],
    ];
    builder.addPanel(flagPoints, [inward * flagSide, 0, 0], COURSE_MATERIAL.pennant);
  };

  for (const side of [-1, 1]) {
    const x = side * course.halfWidth;
    for (let index = 0; index <= spanCount; index += 1) {
      const progress = index / spanCount;
      const z = course.startZ + (course.finishZ - course.startZ) * progress;
      addSafetyPost(x, z);
      if (index < spanCount) {
        const nextProgress = (index + 1) / spanCount;
        const nextZ = course.startZ + (course.finishZ - course.startZ) * nextProgress;
        addRopeSpan(x, z, nextZ, side);
      }
    }
  }

  const addCheckeredLine = (z: number) => {
    const columns = 12;
    const rows = 2;
    const width = course.halfWidth * 1.68;
    const tileWidth = width / columns;
    const depth = 0.95;
    const foundationLift = 0.018;
    builder.addPanel(
      [
        [-width * 0.5 - 0.07, courseHeight(-width * 0.5, z - depth * 0.5) + foundationLift, z - depth * 0.5 - 0.07],
        [width * 0.5 + 0.07, courseHeight(width * 0.5, z - depth * 0.5) + foundationLift, z - depth * 0.5 - 0.07],
        [width * 0.5 + 0.07, courseHeight(width * 0.5, z + depth * 0.5) + foundationLift, z + depth * 0.5 + 0.07],
        [-width * 0.5 - 0.07, courseHeight(-width * 0.5, z + depth * 0.5) + foundationLift, z + depth * 0.5 + 0.07],
      ],
      [0, 1, 0],
      COURSE_MATERIAL.checkerDark,
    );
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const grout = 0.018;
        const x0 = -width * 0.5 + column * tileWidth + grout;
        const x1 = -width * 0.5 + (column + 1) * tileWidth - grout;
        const z0 = z - depth * 0.5 + row * (depth / rows) + grout;
        const z1 = z - depth * 0.5 + (row + 1) * (depth / rows) - grout;
        const lift = 0.026;
        const points: [Vec3, Vec3, Vec3, Vec3] = [
          [x0, courseHeight(x0, z0) + lift, z0],
          [x1, courseHeight(x1, z0) + lift, z0],
          [x1, courseHeight(x1, z1) + lift, z1],
          [x0, courseHeight(x0, z1) + lift, z1],
        ];
        const part =
          (row + column) % 2 === 0
            ? COURSE_MATERIAL.checkerLight
            : COURSE_MATERIAL.checkerDark;
        builder.addPanel(points, [0, 1, 0], part);
      }
    }
  };

  addCheckeredLine(course.startZ);
  addCheckeredLine(course.finishZ);

  const goalPostX = course.halfWidth + 0.15;
  const goalTop = (side: number) => {
    const x = side * goalPostX;
    const ground = courseHeight(x, course.finishZ);
    builder.addTaperedTube(
      [x, ground - 0.1, course.finishZ],
      [x, ground + 3.45, course.finishZ],
      0.085,
      0.07,
      COURSE_MATERIAL.checkerDark,
      8,
    );
    for (let band = 0; band < 4; band += 1) {
      const y = ground + 0.42 + band * 0.72;
      builder.addTaperedTube(
        [x, y, course.finishZ],
        [x, y + 0.28, course.finishZ],
        0.094,
        0.092,
        band % 2 === 0 ? COURSE_MATERIAL.checkerLight : COURSE_MATERIAL.goalAccent,
        8,
      );
    }
    return [x, ground + 3.28, course.finishZ] as Vec3;
  };
  const leftGoalTop = goalTop(-1);
  const rightGoalTop = goalTop(1);
  builder.addTaperedTube(
    leftGoalTop,
    rightGoalTop,
    0.075,
    0.075,
    COURSE_MATERIAL.goalAccent,
    8,
  );

  const flagWidth = 1.8;
  const flagHeight = 1.18;
  const flagColumns = 4;
  const flagRows = 3;
  for (const side of [-1, 1]) {
    const anchorX = side * goalPostX;
    const ground = courseHeight(anchorX, course.finishZ);
    const outward = side;
    for (let row = 0; row < flagRows; row += 1) {
      for (let column = 0; column < flagColumns; column += 1) {
        const x0 = anchorX + outward * (column * (flagWidth / flagColumns));
        const x1 = anchorX + outward * ((column + 1) * (flagWidth / flagColumns));
        const yTop = ground + 3.18 - row * (flagHeight / flagRows);
        const yBottom = yTop - flagHeight / flagRows;
        const points: [Vec3, Vec3, Vec3, Vec3] = [
          [x0, yTop, course.finishZ],
          [x1, yTop, course.finishZ],
          [x1, yBottom, course.finishZ],
          [x0, yBottom, course.finishZ],
        ];
        const part =
          (row + column) % 2 === 0
            ? COURSE_MATERIAL.checkerLight
            : COURSE_MATERIAL.checkerDark;
        builder.addPanel(points, [0, 0, side], part);
      }
    }
  }

  return builder.finish();
}
