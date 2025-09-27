import { useEffect, useState } from 'react'

export default function ResetPassword(){
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(()=>{
    const params = new URLSearchParams(window.location.search)
    setToken(params.get('token') || '')
  },[])

  async function onSubmit(e){
    e.preventDefault(); setLoading(true); setError('')
    if (!password || password !== confirm) { setError('Mật khẩu không khớp'); setLoading(false); return }
    try{
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })
      if(!res.ok) throw new Error('reset-failed')
      setDone(true)
    }catch(err){ setError('Không thể đặt lại mật khẩu. Liên kết có thể đã hết hạn.') }
    finally{ setLoading(false) }
  }

  return (
    <div className="login-page">
      <div className="login-logo-text">LOGO</div>
      <form className="login-card" onSubmit={onSubmit}>
        <div className="login-title">Đặt lại mật khẩu</div>
        {!done ? (
          <>
            <div className="mt16">
              <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mật khẩu mới" />
            </div>
            <div className="mt16">
              <input className="input" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Nhập lại mật khẩu" />
            </div>
            {error && <div className="mt16 login-error">{error}</div>}
            <button className="btn mt24" disabled={loading || !token}>{loading?'Đang xử lý...':'Xác nhận'}</button>
          </>
        ) : (
          <div className="mt16" style={{textAlign:'center'}}>Đặt lại mật khẩu thành công. Bạn có thể <a href="/login">đăng nhập</a>.</div>
        )}
      </form>
    </div>
  )
}



