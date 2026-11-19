 "use client";
import Link from "next/link";
import {FormEvent,useState} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client";
export default function ResetPasswordPage(){
 const[password,setPassword]=useState("");const[message,setMessage]=useState("");const[error,setError]=useState("");const router=useRouter();
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setError("");setMessage("");const{error}=await createClient().auth.updateUser({password});if(error)setError(error.message);else{setMessage("Password updated. Redirecting to sign in.");setTimeout(()=>router.replace("/login"),1200);}}
 return <main className="shell"><nav className="nav"><Link href="/" className="brand"><span className="brandmark">S</span>SUPRA<span className="brand-sep">/</span><span className="gold">SCIENCE</span></Link></nav><div className="authwrap"><section className="panel authcard"><div className="eyebrow">Secure account recovery</div><h1>Choose a new <span className="gold">password.</span></h1><form onSubmit={submit}><div className="field"><label htmlFor="password">New password</label><input id="password" type="password" minLength={12} required value={password} onChange={e=>setPassword(e.target.value)}/></div>{error&&<p className="error">{error}</p>}{message&&<p className="success">{message}</p>}<button className="btn" style={{width:"100%"}}>Update password</button></form></section></div></main>
}