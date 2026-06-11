'use client'

import { Suspense, lazy } from 'react'

const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <Suspense
      fallback={
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden">
          {/* Grid sutil */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.015)_1px,_transparent_1px)] bg-[size:30px_30px] opacity-40 pointer-events-none" />
          
          {/* Glow */}
          <div className="absolute size-80 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="size-8 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin" />
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Inicializando Robô 3D...</span>
          </div>
        </div>
      }
    >
      <Spline scene={scene} className={className} />
    </Suspense>
  )
}
