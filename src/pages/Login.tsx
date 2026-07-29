import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function Login() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true)
    setServerError('')

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      setServerError('E-mail ou senha incorretos. Verifique e tente novamente.')
      setIsLoading(false)
      return
    }

    navigate('/dashboard')
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center space-y-2">
        <div className="text-5xl">🌸</div>
        <h1 className="text-2xl font-bold text-rose-700">Somos Billings</h1>
        <p className="text-sm text-gray-500">Método de Ovulação Billings®</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-800">Entrar</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-11 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          {serverError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{serverError}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-semibold rounded-xl py-3 text-sm transition"
          >
            {isLoading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-gray-500">
        Não tem conta?{' '}
        <Link to="/signup" className="text-rose-600 font-medium hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  )
}
