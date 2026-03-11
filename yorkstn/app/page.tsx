'use client'
import Link from 'next/link'
import { useEffect } from 'react'
import Footer from '@/components/Footer'

export default function Home() {
  useEffect(() => {
    const d = document.getElementById('cur-d')
    const r = document.getElementById('cur-r')
    
    // Mouse trailing logic
    let mx=-300, my=-300, rx=-300, ry=-300
    const handleMouseMove = (e: MouseEvent ) => {
      mx = e.clientX; 
      my = e.clientY;
      if (d) { d.style.left = mx + 'px'; d.style.top = my + 'px'; }
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    
    const loop = () => {
      rx += (mx - rx) * 0.11;
      ry += (my - ry) * 0.11;
      if (r) { r.style.left = rx + 'px'; r.style.top = ry + 'px'; }
      requestAnimationFrame(loop)
    }
    loop()

    // Intersection Observer for animations
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target)
        }
      })
    }, { threshold: 0.07 })

    document.querySelectorAll('.rv').forEach(el => io.observe(el))

    // Cleanup listener on unmount
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const openInq = () => document.dispatchEvent(new CustomEvent('yorkstn:inquiry:open'))

  return (
    <>
      {/* ... rest of your JSX ... */}
      <Footer/>
    </>
  )
}
