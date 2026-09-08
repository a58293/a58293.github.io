import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from 'motion/react';
import { requiredImage } from './media-library';
import { sceneDepth, scenePointer } from './flower-scene-motion';

function DepthLayer({ name, x, y, reduced, decorative = true, children }: {
  name: keyof typeof sceneDepth; x: MotionValue<number>; y: MotionValue<number>; reduced: boolean;
  decorative?: boolean; children: ReactNode;
}) {
  const offsetX = useTransform(x, value => reduced || !sceneDepth[name] ? 0 : -value * sceneDepth[name]);
  const offsetY = useTransform(y, value => reduced || !sceneDepth[name] ? 0 : -value * sceneDepth[name] * .25);
  return <motion.div className={`flower-depth-layer flower-depth-${name}`} data-scene-layer={name}
    style={{ x: offsetX, y: offsetY }} aria-hidden={decorative ? true : undefined}>{children}</motion.div>;
}

export default function FlowerScene({ foreground, pending = false, children }: { foreground?: string; pending?: boolean; children: ReactNode }) {
  const reduced = !!useReducedMotion();
  const rawX = useMotionValue(0), rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 76, damping: 19, mass: .9 });
  const y = useSpring(rawY, { stiffness: 76, damping: 19, mass: .9 });
  const reset = () => { rawX.set(0); rawY.set(0); };
  useEffect(() => {
    if (reduced) { rawX.set(0); rawY.set(0); }
    return () => { x.stop(); y.stop(); };
  }, [reduced, rawX, rawY, x, y]);
  return <div className="flower-scene" data-lighting="flat" data-scene-state={pending ? 'pending' : 'published'}
    onPointerMove={event => {
      // Hover moves the view; touch is reserved for choosing a character.
      if (reduced || event.pointerType !== 'mouse' || event.buttons !== 0) return;
      const point = scenePointer(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect());
      rawX.set(point.x); rawY.set(point.y);
    }} onPointerLeave={reset} onPointerCancel={reset} onPointerDownCapture={reset} onKeyDownCapture={reset}>
    <DepthLayer name="clouds" x={x} y={y} reduced={reduced}>
      <img src={requiredImage('flowerCloudSea')} alt="" draggable={false} />
    </DepthLayer>
    <div className="flower-pending-environment" aria-hidden="true">
      <img src={requiredImage('flowerPendingScene')} alt="" draggable={false} />
    </div>
    {/* The floor and columns are one fixed architectural frame around the still deity. */}
    <div className="flower-stage-floor" aria-hidden="true">
      <img src={requiredImage('flowerCloudSea')} alt="" draggable={false} />
    </div>
    <DepthLayer name="deity" x={x} y={y} reduced={reduced} decorative={false}>
      {children}
    </DepthLayer>
    <DepthLayer name="columns" x={x} y={y} reduced={reduced}>
      <span className="flower-column-contact-shadow" />
      <img src={requiredImage('flowerColumns')} alt="" draggable={false} />
    </DepthLayer>
    <DepthLayer name="flowers" x={x} y={y} reduced={reduced}>
      <AnimatePresence>
        {foreground && <motion.div key={foreground} className="flower-front-pair"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .3 }}>
          <img className="flower-front-left" src={foreground} alt="" draggable={false} />
          <img className="flower-front-right" src={foreground} alt="" draggable={false} />
        </motion.div>}
      </AnimatePresence>
    </DepthLayer>
  </div>;
}
