'use client'

import { useEffect } from 'react'
import Footer from '@/components/Footer'

export default function Home() {

  useEffect(() => {

    const d = document.getElementById('cur-d')
    const r = document.getElementById('cur-r')

    let mx=-300, my=-300, rx=-300, ry=-300

    const handleMouseMove = (e: MouseEvent) => {
      mx = e.clientX
      my = e.clientY

      if (d){
        d.style.left = mx + "px"
        d.style.top = my + "px"
      }
    }

    document.addEventListener("mousemove", handleMouseMove)

    const loop = () => {

      rx += (mx-rx)*0.11
      ry += (my-ry)*0.11

      if (r){
        r.style.left = rx + "px"
        r.style.top = ry + "px"
      }

      requestAnimationFrame(loop)
    }

    loop()

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
    }

  }, [])

  const openInq = () => {
    document.dispatchEvent(new CustomEvent('yorkstn:inquiry:open'))
  }

  return (

    <main style={{padding:"80px"}}>

      <h1>Yorkstn</h1>

      <p>
        Helping Japanese fashion brands enter the Indian market.
      </p>

      <button onClick={openInq}>
        Start a Conversation
      </button>

      <div id="cur-d"></div>
      <div id="cur-r"></div>

      <Footer/>

    </main>

  )

}
