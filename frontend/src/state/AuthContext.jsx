import { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'

const AuthCtx = createContext(null)

export function AuthProvider({ children }){
  const [token, setToken] = useState('')
  const [user, setUser] = useState(null)

  useEffect(()=>{
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }, [])

  useEffect(()=>{
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }, [token])

  async function login(email, password){
    const { data } = await axios.post('/api/auth/login', { email, password })
    setToken(data.token); localStorage.setItem('token', data.token)
    setUser(data.user); localStorage.setItem('user', JSON.stringify(data.user))
  }

  function logout(){
    setToken(''); localStorage.removeItem('token')
    setUser(null); localStorage.removeItem('user')
  }

  return <AuthCtx.Provider value={{ token, user, login, logout }}>{children}</AuthCtx.Provider>
}

export function useAuth(){
  return useContext(AuthCtx)
}

