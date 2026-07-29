import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'

const cadastroSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('E-mail inválido'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type CadastroFormData = z.infer<typeof cadastroSchema>

export default function SignUp() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CadastroFormData>({ resolver: zodResolver(cadastroSchema) })

  async function onSubmit(data: CadastroFormData) {
    setIsLoading(true)
    setServerError('')

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { name: data.name } },
    })

    if (error) {
      setServerError(
        error.message === 'User already registered'
          ? 'Este e-mail já está cadastrado. Tente fazer login.'
          : 'Erro ao criar conta. Tente novamente.',
      )
      setIsLoading(false)
      return
    }

    navigate('/calendar')
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center space-y-2">
        <div className="text-5xl">🌸</div>
        <h1 className="text-2xl font-bold text-rose-700">Somos Billings</h1>
        <p className="text-sm text-gray-500">Crie sua conta gratuitamente</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-800">Criar conta</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {[
            { id: 'name', label: 'Nome', type: 'text', placeholder: 'Seu nome', autocomplete: 'name' },
            { id: 'email', label: 'E-mail', type: 'email', placeholder: 'seu@email.com', autocomplete: 'email' },
            { id: 'password', label: 'Senha', type: 'password', placeholder: '••••••••', autocomplete: 'new-password' },
            { id: 'confirmPassword', label: 'Confirmar senha', type: 'password', placeholder: '••••••••', autocomplete: 'new-password' },
          ].map(({ id, label, type, placeholder, autocomplete }) => (
            <div key={id} className="space-y-1">
              <label htmlFor={id} className="text-sm font-medium text-gray-700">
                {label}
              </label>
              <input
                id={id}
                type={type}
                autoComplete={autocomplete}
                placeholder={placeholder}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition"
                {...register(id as keyof CadastroFormData)}
              />
              {errors[id as keyof CadastroFormData] && (
                <p className="text-xs text-red-500">
                  {errors[id as keyof CadastroFormData]?.message}
                </p>
              )}
            </div>
          ))}

          {serverError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{serverError}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-semibold rounded-xl py-3 text-sm transition"
          >
            {isLoading ? 'Criando conta…' : 'Criar conta'}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-gray-500">
        Já tem conta?{' '}
        <Link to="/login" className="text-rose-600 font-medium hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}
