import { useEffect, useState } from 'react'
import axios from 'axios'

export default function StudentClassInfo(){
  const [info, setInfo] = useState(null)
  const [mates, setMates] = useState([])
  useEffect(()=>{
    (async()=>{
      const [c, m] = await Promise.all([
        axios.get('/api/student/me/class'),
        axios.get('/api/student/me/classmates')
      ])
      setInfo(c.data)
      setMates(m.data)
    })()
  },[])
  return (
    <div className="card">
      <h3>Thông tin lớp của tôi</h3>
      {info ? (
        <div className="mt16">
          <div>Lớp: {info.name} - Phòng {info.room_name}</div>
          <div>GVCN: {info.homeroom_teacher || ''}</div>
          <div className="mt16">
            <h4>Danh sách bạn cùng lớp</h4>
            {mates && mates.length ? (
              <div className="table-wrapper" style={{marginTop:8}}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Mã</th>
                      <th>Họ tên</th>
                      <th>Giới tính</th>
                      <th>Ngày sinh</th>
                      <th>Điện thoại</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mates.map(m => (
                      <tr key={m.id}>
                        <td>{m.id}</td>
                        <td>{m.username}</td>
                        <td>{m.gender || ''}</td>
                        <td>{m.birthdate || ''}</td>
                        <td>{m.phone || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt8" style={{color:'#64748b'}}>Chưa có danh sách bạn cùng lớp.</div>
            )}
          </div>
        </div>
      ) : 'Đang tải...'}
    </div>
  )
}


