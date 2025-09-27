import { useState } from 'react'
import axios from 'axios'

export default function ParentClassInfo(){
  const [studentId, setStudentId] = useState('')
  const [info, setInfo] = useState(null)
  const [fee, setFee] = useState(null)

  async function load(){
    if(!studentId) return
    const { data } = await axios.get(`/api/parent/children/${studentId}/class`)
    setInfo(data)
    const { data:feeData } = await axios.get(`/api/parent/children/${studentId}/fee-status`)
    setFee(feeData)
  }

  return (
    <div className="card">
      <h3>Thông tin lớp học của con</h3>
      <div className="row mt16">
        <input className="input" placeholder="student_id" value={studentId} onChange={e=>setStudentId(e.target.value)} />
        <button className="btn" onClick={load}>Xem</button>
      </div>
      {info && (
        <div className="mt16">
          <div>Lớp: {info.name} - Phòng {info.room_name}</div>
          <div>GVCN: {info.homeroom_teacher || ''}</div>
        </div>
      )}
      {fee && (
        <div className="mt16">
          <div>Đã lập phí: {fee.total_billed} đ</div>
          <div>Đã nộp: {fee.total_paid} đ</div>
          <div>Còn nợ: {fee.due_cents} đ</div>
        </div>
      )}
    </div>
  )
}


