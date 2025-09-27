import { useState } from 'react'

export default function ForgotPassword(){
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e){
    e.preventDefault(); setLoading(true); setError('')
    try{
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      if(!res.ok) throw new Error('request-failed')
      setSent(true)
    }catch(err){ setError('Không thể gửi yêu cầu. Thử lại sau.') }
    finally{ setLoading(false) }
  }

  return (
    <div className="login-page">
      <div className="login-logo-text">LOGO</div>
      <form className="login-card" onSubmit={onSubmit}>
        <div className="login-title">Quên mật khẩu</div>
        {!sent ? (
          <>
            <div className="mt16">
              <input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email đăng ký" />
            </div>
            {error && <div className="mt16 login-error">{error}</div>}
            <button className="btn mt24" disabled={loading || !email}>{loading?'Đang gửi...':'Gửi liên kết đặt lại'}</button>
          </>
        ) : (
          <div className="mt16" style={{textAlign:'center'}}>Nếu email tồn tại, hệ thống đã gửi liên kết đặt lại mật khẩu.</div>
        )}
      </form>
    </div>
  )
}



