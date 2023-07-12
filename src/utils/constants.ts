export const height = window.innerHeight;
export const width = window.innerWidth;
export const settings = {
  maxTilt: 25,
  rotationPower: 50,
  swipeThreshold: 0.5,
};

export const reactNativeSettings = {
  ...settings,
  swipeThreshold: 1.5,
};

// physical properties of the spring
export const physics = {
  touchResponsive: {
    friction: 50,
    tension: 2000,
  },
  animateOut: {
    friction: 30,
    tension: 400,
  },
  animateBack: {
    friction: 10,
    tension: 200,
  },
};
