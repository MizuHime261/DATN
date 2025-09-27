import { useState } from 'react'
import axios from 'axios'

export default function ParentBoarding(){
  const [studentId, setStudentId] = useState('')
  const [termId, setTermId] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [msg, setMsg] = useState('')

  async function register(){
    setMsg('')
    try{
      await axios.post(`/api/parent/children/${studentId}/boarding`, {
        term_id: termId,
        start_date: start,
        end_date: end
      })
      setMsg('Đăng ký bán trú thành công')
    }catch{ setMsg('Đăng ký thất bại') }
  }

  async function cancel(){
    setMsg('')
    try{
      await axios.delete(`/api/parent/children/${studentId}/boarding`, { data: { term_id: termId } })
      setMsg('Hủy đăng ký bán trú thành công')
    }catch{ setMsg('Hủy thất bại (có thể do đã bắt đầu)') }
  }

  return (
    <div className="card" style={{maxWidth:700}}>
      <h3>Đăng ký bán trú</h3>
      <div className="row mt16">
        <input className="input" placeholder="student_id" value={studentId} onChange={e=>setStudentId(e.target.value)} />
        <input className="input" placeholder="term_id" value={termId} onChange={e=>setTermId(e.target.value)} />
      </div>
      <div className="row mt16">
        <input className="input" type="date" value={start} onChange={e=>setStart(e.target.value)} />
        <input className="input" type="date" value={end} onChange={e=>setEnd(e.target.value)} />
      </div>
      <div className="row mt16">
        <button className="btn" onClick={register} disabled={!studentId || !termId || !start || !end}>Đăng ký</button>
        <button className="btn secondary" onClick={cancel} disabled={!studentId || !termId}>Hủy</button>
      </div>
      {msg && <div className="mt16">{msg}</div>}
    </div>
  )
}



