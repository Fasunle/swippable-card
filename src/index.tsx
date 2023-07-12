import React, { forwardRef, useCallback, useImperativeHandle, useLayoutEffect, useRef } from "react";
import { useSpring, animated } from "@react-spring/web";
import { GestureState, Props, Vector } from "types";
import * as constants from "utils/constants";
import { animateBack, animateOut, getSwipeDirection, normalize, threeDTransformation } from "utils";

const TinderCard = (
  {
    flickOnSwipe = true,
    children,
    onSwipe,
    onCardLeftScreen,
    className,
    preventSwipe = [],
    swipeRequirementType = "velocity",
    swipeThreshold = constants.settings.swipeThreshold,
    onSwipeRequirementFulfilled,
    onSwipeRequirementUnfulfilled,
  }: Props,
  ref: any
) => {
  const [ { xyrot }, setSpringTarget ] = useSpring( () => ( {
    xyrot: [ 0, 0, 0 ],
    config: constants.physics.touchResponsive,
  } ) );

  constants.settings.swipeThreshold = swipeThreshold;

  useImperativeHandle( ref, () => ( {
    async swipe( dir: any = "right" ) {
      if ( onSwipe ) onSwipe( dir );
      const power = 1.3;
      const disturbance = ( Math.random() - 0.5 ) / 2;
      if ( dir === "right" ) {
        await animateOut( { x: power, y: disturbance }, setSpringTarget );
      } else if ( dir === "left" ) {
        await animateOut( { x: -power, y: disturbance }, setSpringTarget );
      } else if ( dir === "up" ) {
        await animateOut( { x: disturbance, y: power }, setSpringTarget );
      } else if ( dir === "down" ) {
        await animateOut( { x: disturbance, y: -power }, setSpringTarget );
      }
      if ( onCardLeftScreen ) onCardLeftScreen( dir );
    },
    async restoreCard() {
      await animateBack( setSpringTarget );
    },
  } ) );

  const handleSwipeReleased = useCallback(
    async ( setSpringTarget: any, gesture: GestureState ) => {
      // Check if this is a swipe
      const dir = getSwipeDirection( {
        x: swipeRequirementType === "velocity" ? gesture.vx : gesture.dx,
        y: swipeRequirementType === "velocity" ? gesture.vy : gesture.dy,
      } );

      if ( dir !== "none" ) {
        if ( flickOnSwipe ) {
          if ( !preventSwipe.includes( dir ) ) {
            if ( onSwipe ) onSwipe( dir );

            const _gesture =
              swipeRequirementType === "velocity"
                ? {
                  x: gesture.vx!,
                  y: gesture.vy!,
                }
                : normalize( { x: gesture.dx!, y: gesture.dy! } );

            await animateOut( _gesture, setSpringTarget );
            if ( onCardLeftScreen ) onCardLeftScreen( dir );
            return;
          }
        }
      }

      // Card was not flicked away, animate back to start
      animateBack( setSpringTarget );
    },
    [
      swipeRequirementType,
      flickOnSwipe,
      preventSwipe,
      onSwipe,
      onCardLeftScreen,
    ]
  );

  let swipeThresholdFulfilledDirection = "none";

  const gestureStateFromWebEvent = (
    ev: any,
    startPositon: Vector,
    lastPosition: GestureState,
    isTouch: boolean
  ) => {
    let dx = isTouch
      ? ev.touches[ 0 ].clientX - startPositon.x
      : ev.clientX - startPositon.x;
    let dy = isTouch
      ? ev.touches[ 0 ].clientY - startPositon.y
      : ev.clientY - startPositon.y;

    // We cant calculate velocity from the first event
    if ( startPositon.x === 0 && startPositon.y === 0 ) {
      dx = 0;
      dy = 0;
    }

    const vx = -( dx - lastPosition.dx ) / ( lastPosition.timeStamp - Date.now() );
    const vy = -( dy - lastPosition.dy ) / ( lastPosition.timeStamp - Date.now() );

    const gestureState = { dx, dy, vx, vy, timeStamp: Date.now() };
    return gestureState;
  };

  useLayoutEffect( () => {
    let startPositon = { x: 0, y: 0 };
    let lastPosition = { dx: 0, dy: 0, vx: 0, vy: 0, timeStamp: Date.now() };
    let isClicking = false;

    if ( !element.current ) return;

    element.current.addEventListener( "touchstart", ( ev ) => {
      if ( !ev.target ) return;
      if ( 'className' in ev.target && ( ev.target.className as string[] ).includes( 'pressable' ) && ev.cancelable ) {
        ev.preventDefault();
      }

      const gestureState = gestureStateFromWebEvent(
        ev,
        startPositon,
        lastPosition,
        true
      );
      lastPosition = gestureState;
      startPositon = { x: ev.touches[ 0 ].clientX, y: ev.touches[ 0 ].clientY };
    } );

    element.current.addEventListener( "mousedown", ( ev ) => {
      isClicking = true;
      const gestureState = gestureStateFromWebEvent(
        ev,
        startPositon,
        lastPosition,
        false
      );
      lastPosition = gestureState;
      startPositon = { x: ev.clientX, y: ev.clientY };
    } );

    const handleMove = ( gestureState: GestureState ) => {
      // Check fulfillment
      if ( onSwipeRequirementFulfilled || onSwipeRequirementUnfulfilled ) {
        const dir = getSwipeDirection( {
          x:
            swipeRequirementType === "velocity"
              ? gestureState.vx
              : gestureState.dx,
          y:
            swipeRequirementType === "velocity"
              ? gestureState.vy
              : gestureState.dy,
        } );
        if ( dir !== swipeThresholdFulfilledDirection ) {
          swipeThresholdFulfilledDirection = dir;
          if ( swipeThresholdFulfilledDirection === "none" ) {
            if ( onSwipeRequirementUnfulfilled ) onSwipeRequirementUnfulfilled();
          } else {
            if ( onSwipeRequirementFulfilled ) onSwipeRequirementFulfilled( dir );
          }
        }
      }

      // use guestureState.vx / guestureState.vy for velocity calculations
      // translate element
      let rot = gestureState.vx * 15; // Magic number 15 looks about right
      rot = Math.max( Math.min( rot, constants.settings.maxTilt ), -constants.settings.maxTilt );
      setSpringTarget.start( {
        xyrot: [ gestureState.dx, gestureState.dy, rot ],
        config: constants.physics.touchResponsive,
      } );
    };

    window.addEventListener( "mousemove", ( ev ) => {
      if ( !isClicking ) return;
      const gestureState = gestureStateFromWebEvent(
        ev,
        startPositon,
        lastPosition,
        false
      );
      lastPosition = gestureState;
      handleMove( gestureState );
    } );

    window.addEventListener( "mouseup", ( ev ) => {
      if ( !isClicking ) return;
      isClicking = false;
      handleSwipeReleased( setSpringTarget, lastPosition );
      startPositon = { x: 0, y: 0 };
      lastPosition = { dx: 0, dy: 0, vx: 0, vy: 0, timeStamp: Date.now() };
    } );

    if ( !element.current ) return;

    element.current.addEventListener( "touchmove", ( ev ) => {
      const gestureState = gestureStateFromWebEvent(
        ev,
        startPositon,
        lastPosition,
        true
      );
      lastPosition = gestureState;
      handleMove( gestureState );
    } );

    element.current.addEventListener( "touchend", ( ev ) => {
      handleSwipeReleased( setSpringTarget, lastPosition );
      startPositon = { x: 0, y: 0 };
      lastPosition = { dx: 0, dy: 0, vx: 0, vy: 0, timeStamp: Date.now() };
    } );
  } );

  const element = useRef<typeof animated.div & HTMLDivElement | undefined>();

  return (
    <animated.div
      ref={element as any}
      className={className}
      style={{
        transform: xyrot.to(
          threeDTransformation
        ),
      }}
    >
      {children}
    </animated.div>
  )
};

export default forwardRef(TinderCard);
