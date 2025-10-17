import { useEffect, useState } from 'react'
import axios from 'axios'

export default function ParentClassInfo(){
  const [studentId, setStudentId] = useState('')
  const [info, setInfo] = useState(null)
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(false)

  async function load(){
    if(!studentId) return
    setLoading(true)
    try{
      const { data } = await axios.get(`/api/parent/children/${studentId}/class`)
      setInfo(data)
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

  useEffect(()=>{ if (studentId) { load() } }, [studentId])

  return (
    <div className="parent-class-page">
      <div className="header">
        <div className="title-wrap">
          <div className="title">Lớp học của con</div>
          <div className="subtitle">Thông tin lớp, giáo viên chủ nhiệm và bạn cùng lớp</div>
        </div>
        <div className="controls">
          {children.length <= 1 ? (
            <div className="single-child">
              {children.length === 1 ? (
                <>
                  <div className="child-avatar">👧</div>
                  <div className="child-name">{children[0].username}</div>
                </>
              ) : (
                <div className="no-child">Chưa có liên kết học sinh</div>
              )}
            </div>
          ) : (
            <select className="input child-select" value={studentId} onChange={e=>setStudentId(e.target.value)}>
              <option value="">Chọn con</option>
              {children.map(c=> (
                <option key={c.id} value={c.id}>{c.username}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <div>Đang tải thông tin lớp...</div>
        </div>
      ) : info ? (
        <div className="content-grid">
          <div className="card class-card">
            <div className="card-header">
              <div className="card-icon">🏫</div>
              <div className="card-title">Thông tin lớp</div>
            </div>
            <div className="card-body">
              <div className="info-row">
                <div className="info-label">Lớp</div>
                <div className="info-value">{info.class_name}</div>
              </div>
              <div className="info-row">
                <div className="info-label">Phòng</div>
                <div className="info-value badge badge-room">{info.room_name}</div>
              </div>
            </div>
          </div>

          <div className="card teacher-card">
            <div className="card-header">
              <div className="card-icon">👩‍🏫</div>
              <div className="card-title">Giáo viên chủ nhiệm</div>
            </div>
            <div className="card-body">
              <div className="info-row">
                <div className="info-label">Họ tên</div>
                <div className="info-value">{info.homeroom_teacher_name || '-'}</div>
              </div>
              <div className="info-row">
                <div className="info-label">Số điện thoại</div>
                <div className="info-value">
                  {info.homeroom_teacher_phone ? (
                    <a className="link" href={`tel:${info.homeroom_teacher_phone}`}>{info.homeroom_teacher_phone}</a>
                  ) : ('-')}
                </div>
              </div>
            </div>
          </div>

          <div className="card mates-card">
            <div className="card-header">
              <div className="card-icon">👫</div>
              <div className="card-title">Bạn cùng lớp</div>
            </div>
            <div className="card-body">
              {(!info.classmates || info.classmates.length===0) ? (
                <div className="empty">Chưa có dữ liệu</div>
              ) : (
                <div className="mates-grid">
                  {info.classmates.map(m => (
                    <div key={m.id} className="mate-item">
                      <div className="mate-avatar">🧒</div>
                      <div className="mate-name">{m.username}</div>
                      {m.phone ? <div className="mate-phone">{m.phone}</div> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="placeholder">Hãy chọn học sinh để xem thông tin lớp.</div>
      )}
    </div>
  )
}


