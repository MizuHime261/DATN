import { useEffect, useState } from 'react'
import axios from 'axios'

export default function ParentResults(){
  const [studentId, setStudentId] = useState('')
  const [rows, setRows] = useState([])
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(false)

  async function load(){
    if(!studentId) return
    setLoading(true)
    try{
      const { data } = await axios.get(`/api/parent/children/${studentId}/results`)
      setRows(data||[])
    } finally { setLoading(false) }
  }

  useEffect(()=>{ (async()=>{
    try{
      const { data } = await axios.get('/api/parent/children')
      setChildren(data||[])
      if ((data||[]).length === 1){
        setStudentId(String(data[0].id))
      }
    }catch(_e){}
  })() },[])

  useEffect(()=>{ setRows([]); if(studentId) load() }, [studentId])

  return (
    <div className="card">
      <div className="header" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h3>Kết quả học tập của con</h3>
        <div>
          {children.length <= 1 ? (
            <div style={{opacity:.9}}>{children.length === 1 ? `Học sinh: ${children[0].username}` : 'Chưa có liên kết học sinh'}</div>
          ) : (
            <select className="input" value={studentId} onChange={e=>setStudentId(e.target.value)}>
              <option value="">Chọn con</option>
              {children.map(c=> (
                <option key={c.id} value={c.id}>{c.username}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {loading ? (
        <div className="mt16">Đang tải...</div>
      ) : (
        <div className="mt16">
          {rows.length===0? ' ' : (
            <div className="table-responsive">
              <table>
                <thead><tr><th>Học kỳ</th><th>Môn</th><th>Miệng</th><th>KT</th><th>Thi</th><th>TB</th></tr></thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={`${r.term_id}-${r.subject_id}`}><td>{r.term_name}</td><td>{r.subject_name}</td><td>{r.oral ?? ''}</td><td>{r.test ?? ''}</td><td>{r.exam ?? ''}</td><td>{r.average ?? ''}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


