import { redirect } from 'next/navigation'
import { format } from 'date-fns'

export const runtime = 'edge'
import { createClient } from '@/lib/infrastructure/supabase/server'
import { SupabaseDailyRecordRepository } from '@/lib/infrastructure/repositories/SupabaseDailyRecordRepository'
import { DailyRecordForm } from '@/components/forms/DailyRecordForm'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface RegisterPageProps {
  searchParams: Promise<{ date?: string }>
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const today = format(new Date(), 'yyyy-MM-dd')
  const targetDate = params.date ?? today

  const repository = new SupabaseDailyRecordRepository(supabase)
  const existingRecord = await repository.findByDate(user.id, targetDate)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {existingRecord ? 'Editar registro' : 'Novo registro'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Registre o que você sentiu e observou hoje na vulva.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Observação diária</CardTitle>
          <CardDescription>
            Anote a sensação mais próxima da fertilidade observada durante o dia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DailyRecordForm
            defaultDate={today}
            existingRecord={existingRecord ?? undefined}
          />
        </CardContent>
      </Card>
    </div>
  )
}
