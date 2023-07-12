import { Direction, SetSpringTarget, Vector } from "types";
import { height, physics, settings, width } from "./constants";

export const pythagoras = (x: number, y: number) =>
  Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));

export const normalize = (vector: Vector) => {
  const length = Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));
  return { x: vector.x / length, y: vector.y / length };
};

export const animateOut = async (
  gesture: Vector,
  setSpringTarget: SetSpringTarget
) => {
  const diagonal = pythagoras(height, width);
  const velocity = pythagoras(gesture.x, gesture.y);
  const finalX = diagonal * gesture.x;
  const finalY = diagonal * gesture.y;
  const finalRotation = gesture.x * 45;
  const duration = diagonal / velocity;

  setSpringTarget.start({
    xyrot: [finalX, finalY, finalRotation],
    config: { duration: duration },
  });

  // for now animate back
  return await new Promise((resolve) =>
    setTimeout(() => {
      resolve(null);
    }, duration)
  );
};

export const animateBack = (setSpringTarget: SetSpringTarget) => {
  // translate back to the initial position
  return new Promise((resolve) => {
    setSpringTarget.start({
      xyrot: [0, 0, 0],
      config: physics.animateBack,
      onRest: resolve,
    });
  });
};

export const getSwipeDirection = (property: Vector) => {
  if (Math.abs(property.x) > Math.abs(property.y)) {
    if (property.x > settings.swipeThreshold) {
      return "right";
    } else if (property.x < -settings.swipeThreshold) {
      return "left";
    }
  } else {
    if (property.y > settings.swipeThreshold) {
      return "down";
    } else if (property.y < -settings.swipeThreshold) {
      return "up";
    }
  }
  return "none";
};

export const threeDTransformation = (x: number, y: number, rot: number) =>
  `translate3d(${x}px, ${y}px, ${0}px) rotate(${rot}deg)`;
