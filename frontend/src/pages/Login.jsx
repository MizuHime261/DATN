import { useState } from 'react'
import { useAuth } from '../state/AuthContext.jsx'
import { Navigate } from 'react-router-dom'

export default function Login(){
  const { login, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />
  }

  async function onSubmit(e){
    e.preventDefault(); setLoading(true); setError('')
    
    // Validate Gmail email
    if (!email.endsWith('@gmail.com')) {
      setError('Tài khoản gmail không hợp lệ')
      setLoading(false)
      return
    }
    
    try{ 
      await login(email, password)
      // Redirect will happen automatically via HomeRedirect component
    }catch(err){ setError('Tài khoản hoặc mật khẩu sai') } finally{ setLoading(false) }
  }

  return (
    <div className="login-page">
      <div className="login-logo-text">LOGO</div>
      <form className="login-card" onSubmit={onSubmit} autoComplete="off">
        <div className="login-title">Đăng nhập</div>
        <div className="mt16">
          <input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" autoComplete="off" name="admin_login_email" />
        </div>
        <div className="mt16">
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mật khẩu" autoComplete="new-password" name="admin_login_password" />
        </div>
        {error && <div className="mt16 login-error">{error}</div>}
        <button className="btn mt24" disabled={loading}>{loading?'Đang đăng nhập...':'Đăng nhập'}</button>
        <div className="login-forgot mt16" onClick={() => window.location.href = '/forgot-password'}>Quên mật khẩu?</div>
      </form>
    </div>
  )
}


