'use client'
import { useEffect } from 'react'
export default function ClientEffects() {
  useEffect(() => {
    const d = document.getElementById('cur-d'), r = document.getElementById('cur-r')
    if (!d || !r || window.innerWidth < 768) return
    let mx=-300,my=-300,rx=-300,ry=-300
    document.addEventListener('mousemove',(e)=>{mx=e.clientX;my=e.clientY;d.style.left=mx+'px';d.style.top=my+'px'})
    const loop=()=>{rx+=(mx-rx)*.11;ry+=(my-ry)*.11;r.style.left=rx+'px';r.style.top=ry+'px';requestAnimationFrame(loop)}
    loop()
    const add=()=>document.body.classList.add('lh'), rem=()=>document.body.classList.remove('lh')
    const attach=()=>document.querySelectorAll('a,button').forEach(el=>{el.addEventListener('mouseenter',add);el.addEventListener('mouseleave',rem)})
    attach()
    new MutationObserver(attach).observe(document.body,{childList:true,subtree:true})
    const io=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.07,rootMargin:'0px 0px -40px 0px'})
    document.querySelectorAll('.rv').forEach(el=>io.observe(el))
  },[])
  return null
}
