import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { isAdult, MIN_AGE } from '@/lib/utils/age'

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  birthDate: z.string().min(1, 'Informe sua data de nascimento'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
}).refine((data) => !data.birthDate || isAdult(data.birthDate), {
  message: `É preciso ter ${MIN_AGE} anos ou mais para criar uma conta`,
  path: ['birthDate'],
})
type FormData = z.infer<typeof schema>

interface InviteInfo {
  token: string
  inviterName: string
  inviterId: string
  valid: boolean
}

export default function Invite() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [invite, setInvite] = useState<InviteInfo | null>(null)
  const [loadingInvite, setLoadingInvite] = useState(true)
  const [serverError, setServerError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!token) { setLoadingInvite(false); return }

    supabase
      .from('mob_invites')
      .select('token, inviter_id, expires_at, used_at')
      .eq('token', token)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!data || data.used_at || new Date(data.expires_at) < new Date()) {
          setInvite({ token, inviterName: '', inviterId: '', valid: false })
          setLoadingInvite(false)
          return
        }
        // buscar nome de quem convidou
        const { data: profile } = await supabase
          .from('mob_user_profiles')
          .select('name')
          .eq('id', data.inviter_id)
          .maybeSingle()

        setInvite({
          token,
          inviterId: data.inviter_id,
          inviterName: profile?.name || 'sua parceira',
          valid: true,
        })
        setLoadingInvite(false)
      })
  }, [token])

  async function onSubmit(formData: FormData) {
    if (!invite?.valid) return
    setIsLoading(true)
    setServerError('')

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: { data: { name: formData.name } },
    })

    if (signUpError || !signUpData.user) {
      setServerError(signUpError?.message ?? 'Erro ao criar conta.')
      setIsLoading(false)
      return
    }

    // Garante sessão ativa para as operações seguintes passarem no RLS
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    })

    if (signInError) {
      setServerError('Conta criada, mas não foi possível fazer login automático. Faça login manualmente.')
      setIsLoading(false)
      return
    }

    const userId = signUpData.user.id

    // Criar perfil como homem
    await supabase.from('mob_user_profiles').upsert({
      id: userId,
      name: formData.name,
      user_type: 'man',
      birth_date: formData.birthDate,
    })

    // Criar vínculo: inviter = mulher, novo user = homem
    await supabase.from('mob_couple_links').insert({
      woman_id: invite.inviterId,
      man_id: userId,
    })

    // Marcar convite como usado
    await supabase
      .from('mob_invites')
      .update({ used_at: new Date().toISOString() })
      .eq('token', invite.token)

    navigate('/dashboard')
  }

  if (loadingInvite) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-rose-200 border-t-rose-600 rounded-full" />
      </div>
    )
  }

  if (!token || !invite) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6 text-center space-y-3">
        <p className="text-2xl">🔗</p>
        <p className="font-semibold text-gray-800">Link inválido</p>
        <p className="text-sm text-gray-500">Este convite não existe.</p>
        <Link to="/login" className="text-sm text-rose-600 hover:underline">Ir para o login</Link>
      </div>
    )
  }

  if (!invite.valid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6 text-center space-y-3">
        <p className="text-2xl">⏰</p>
        <p className="font-semibold text-gray-800">Convite expirado ou já utilizado</p>
        <p className="text-sm text-gray-500">Peça para sua parceira gerar um novo convite.</p>
        <Link to="/login" className="text-sm text-rose-600 hover:underline">Ir para o login</Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <p className="text-4xl">🌸</p>
          <h1 className="text-xl font-bold text-gray-900">Você foi convidado!</h1>
          <p className="text-sm text-gray-500">
            <strong>{invite.inviterName}</strong> te convidou para acompanhar o ciclo no Somos Billings.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Seu nome</label>
            <input
              {...register('name')}
              placeholder="Como você se chama"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">E-mail</label>
            <input
              {...register('email')}
              type="email"
              placeholder="seu@email.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Data de nascimento</label>
            <input
              {...register('birthDate')}
              type="date"
              autoComplete="bday"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
            {errors.birthDate && <p className="text-xs text-red-500 mt-1">{errors.birthDate.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Senha</label>
            <input
              {...register('password')}
              type="password"
              placeholder="Mínimo 6 caracteres"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>

          <p className="text-xs text-gray-400">
            Serviço destinado a pessoas com {MIN_AGE} anos ou mais.
          </p>

          {serverError && <p className="text-sm text-red-600">{serverError}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition text-sm"
          >
            {isLoading ? 'Criando conta...' : 'Criar conta e vincular'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400">
          Já tem conta?{' '}
          <Link to="/login" className="text-rose-600 hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  )
}
