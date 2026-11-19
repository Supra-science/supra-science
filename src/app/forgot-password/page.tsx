 "use client";
import Link from "next/link";
import {FormEvent,useEffect,useState} from "react";
import {getRecaptchaToken,loadRecaptcha} from "@/lib/recaptcha";
// Reset goes through /api/auth/forgot-password (added 2026-11-19, audit
// finding M1): server-side rate limit + reCAPTCHA v3 (action
// "forgot-password"), then Supabase reset mail. No direct browser call.
export default function ForgotPasswordPage(){
 const[email,setEmail]=useState("");const[message,setMessage]=useState("");const[error,setError]=useState("");
 // Preload reCAPTCHA on mount (M3): same missing_token fix as login.
 useEffect(()=>{loadRecaptcha();},[]);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setError("");setMessage("");try{const recaptchaToken=await getRecaptchaToken("forgot-password");const res=await fetch("/api/auth/forgot-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,recaptcha_token:recaptchaToken})});const data=await res.json().catch(()=>({})) as {ok?:boolean;error?:string;message?:string};if(!res.ok||!data.ok){setError(data.error||"Reset failed. Please try again.");return;}setMessage(data.message||"If an account exists for this address, a password reset link has been sent.");}catch(err){setError(err instanceof Error?err.message:"Reset failed. Please try again.");}}
 return <main className="shell"><nav className="nav"><Link href="/" className="brand"><span className="brandmark">S</span>SUPRA<span className="brand-sep">/</span><span className="gold">SCIENCE</span></Link><Link href="/login" className="muted">Back to sign in</Link></nav><div className="authwrap"><section className="panel authcard"><div className="eyebrow">Account recovery</div><h1>Reset your <span className="gold">password.</span></h1><form onSubmit={submit}><div className="field"><label htmlFor="email">Email address</label><input id="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></div>{error&&<p className="error">{error}</p>}{message&&<p className="success">{message}</p>}<button className="btn" style={{width:"100%"}}>Send reset link</button></form></section></div></main>
}