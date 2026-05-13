import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { SupabaseDailyRecordRepository } from '@/lib/infrastructure/repositories/SupabaseDailyRecordRepository'
import { MUCUS_APPEARANCE_OPTIONS } from '@/lib/domain/enums/MucusAppearance'
import { MUCUS_QUANTITY_OPTIONS } from '@/lib/domain/enums/MucusQuantity'
import type { DailyRecord } from '@/lib/domain/entities/DailyRecord'
import type { Sensation } from '@/lib/domain/enums/Sensation'
import type { MucusAppearance } from '@/lib/domain/enums/MucusAppearance'
import type { MucusQuantity } from '@/lib/domain/enums/MucusQuantity'
import type { BleedingIntensity } from '@/lib/domain/enums/BleedingIntensity'

interface Props {
  defaultDate: string
  existingRecord?: DailyRecord
  isMan?: boolean
}

const SENSATION_OPTIONS: { value: Sensation; label: string; description: string }[] = [
  { value: 'seca', label: 'Seca', description: 'Nada se sente, nada se vê' },
  { value: 'umida', label: 'Úmida', description: 'Sensação de umidade' },
  { value: 'molhada', label: 'Molhada', description: 'Sensação de molhado' },
  { value: 'escorregadia', label: 'Escorregadia', description: 'Lubrificada, macia, escorregadia' },
]

const BLEEDING_OPTIONS: { value: BleedingIntensity; label: string }[] = [
  { value: 'nenhum', label: 'Nenhum' },
  { value: 'leve', label: 'Leve' },
  { value: 'moderado', label: 'Moderado' },
  { value: 'intenso', label: 'Intenso' },
]

export function DailyRecordForm({ defaultDate, existingRecord, isMan }: Props) {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [sensation, setSensation] = useState<Sensation>(existingRecord?.sensation ?? 'seca')
  const [bleeding, setBleeding] = useState<BleedingIntensity>(existingRecord?.bleedingIntensity ?? 'nenhum')
  const [mucusAppearance, setMucusAppearance] = useState<MucusAppearance>(existingRecord?.mucusAppearance ?? 'nenhum')
  const [mucusQuantity, setMucusQuantity] = useState<MucusQuantity>(existingRecord?.mucusQuantity ?? 'nenhum')
  const [notes, setNotes] = useState(existingRecord?.notes ?? '')
  const [mobRule, setMobRule] = useState(existingRecord?.mobRule ?? '')
  const [hadIntercourse, setHadIntercourse] = useState(existingRecord?.hadIntercourse ?? false)
  const [pendingBleeding, setPendingBleeding] = useState<BleedingIntensity | null>(null)

  function handleBleedingSelect(value: BleedingIntensity) {
    if (value === 'nenhum') {
      setBleeding('nenhum')
      if (sensation === 'menstruacao' || sensation === 'mancha') setSensation('seca')
      return
    }
    setPendingBleeding(value)
  }

  function confirmMenstruation(isMenstruation: boolean) {
    if (pendingBleeding) {
      setBleeding(pendingBleeding)
      setSensation(isMenstruation ? 'menstruacao' : 'mancha')
    }
    setPendingBleeding(null)
  }

  const hasBleeding = sensation === 'menstruacao' || sensation === 'mancha'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      setError('Sessão expirada. Faça login novamente.')
      setSaving(false)
      return
    }

    const repo = new SupabaseDailyRecordRepository(supabase)
    try {
      await repo.upsert({
        userId: session.user.id,
        date: defaultDate,
        sensation,
        mucusAppearance: hasBleeding ? 'nenhum' : mucusAppearance,
        mucusQuantity: hasBleeding ? 'nenhum' : mucusQuantity,
        bleedingIntensity: bleeding,
        notes,
        mobRule,
        hadIntercourse,
      })
      setSaved(true)
      setTimeout(() => navigate('/calendario'), 1000)
    } catch {
      setError('Erro ao salvar. Tente novamente.')
    }
    setSaving(false)
  }

  return (
    <>
      {/* Menstruation confirmation dialog */}
      {pendingBleeding && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl">
            <div className="text-center space-y-1">
              <p className="text-2xl">🩸</p>
              <h3 className="text-base font-semibold text-gray-900">Este sangramento é menstruação?</h3>
              <p className="text-sm text-gray-500">Isso define se um novo ciclo começa hoje.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => confirmMenstruation(false)}
                className="border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 transition"
              >
                Não (mancha)
              </button>
              <button
                type="button"
                onClick={() => confirmMenstruation(true)}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl text-sm transition"
              >
                Sim, menstruação
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Bleeding — women only */}
        {!isMan && (
          <fieldset>
            <legend className="text-sm font-semibold text-gray-700 mb-2">Sangramento</legend>
            <div className="grid grid-cols-2 gap-2">
              {BLEEDING_OPTIONS.map(opt => (
                <label key={opt.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="bleeding"
                    value={opt.value}
                    checked={bleeding === opt.value}
                    onChange={() => handleBleedingSelect(opt.value)}
                    className="sr-only peer"
                  />
                  <div className="border-2 border-gray-200 peer-checked:border-red-400 peer-checked:bg-red-50 rounded-xl px-3 py-2.5 text-center transition">
                    <p className="text-sm font-medium text-gray-700 peer-checked:text-red-700">{opt.label}</p>
                    {bleeding === opt.value && opt.value !== 'nenhum' && (
                      <p className="text-xs text-red-500 mt-0.5">
                        {sensation === 'menstruacao' ? '● Menstruação' : '⁚ Mancha'}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {/* Sensation — only when no bleeding, women only */}
        {!isMan && !hasBleeding && (
          <fieldset>
            <legend className="text-sm font-semibold text-gray-700 mb-2">Sensação na vulva</legend>
            <div className="grid grid-cols-2 gap-2">
              {SENSATION_OPTIONS.map(opt => (
                <label key={opt.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="sensation"
                    value={opt.value}
                    checked={sensation === opt.value}
                    onChange={() => setSensation(opt.value)}
                    className="sr-only peer"
                  />
                  <div className="border-2 border-gray-200 peer-checked:border-rose-400 peer-checked:bg-rose-50 rounded-xl p-3 text-center transition">
                    <p className="text-sm font-medium text-gray-700 peer-checked:text-rose-700">{opt.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-tight">{opt.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {/* Mucus — only when no bleeding, women only */}
        {!isMan && !hasBleeding && (
          <>
            <fieldset>
              <legend className="text-sm font-semibold text-gray-700 mb-2">Aparência do muco</legend>
              <div className="grid grid-cols-2 gap-2">
                {MUCUS_APPEARANCE_OPTIONS.map(opt => (
                  <label key={opt.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="mucusAppearance"
                      value={opt.value}
                      checked={mucusAppearance === opt.value}
                      onChange={() => setMucusAppearance(opt.value)}
                      className="sr-only peer"
                    />
                    <div className="border-2 border-gray-200 peer-checked:border-rose-400 peer-checked:bg-rose-50 rounded-xl px-3 py-2.5 text-sm font-medium text-center text-gray-700 peer-checked:text-rose-700 transition">
                      {opt.label}
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-semibold text-gray-700 mb-2">Quantidade de muco</legend>
              <div className="grid grid-cols-4 gap-2">
                {MUCUS_QUANTITY_OPTIONS.map(opt => (
                  <label key={opt.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="mucusQuantity"
                      value={opt.value}
                      checked={mucusQuantity === opt.value}
                      onChange={() => setMucusQuantity(opt.value)}
                      className="sr-only peer"
                    />
                    <div className="border-2 border-gray-200 peer-checked:border-rose-400 peer-checked:bg-rose-50 rounded-xl py-2.5 text-xs font-medium text-center text-gray-700 peer-checked:text-rose-700 transition">
                      {opt.label}
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        )}

        {/* MOB Rule — women only */}
        {!isMan && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Regra MOB aplicada</label>
            <div className="grid grid-cols-4 gap-2">
              {([
                { value: '',    label: '—',  desc: 'Não inf.' },
                { value: 'R1',  label: 'R1', desc: 'Menstruação' },
                { value: 'R2',  label: 'R2', desc: 'Noites alt.' },
                { value: 'R3',  label: 'R3', desc: 'Manchas' },
                { value: 'A',   label: 'A',  desc: 'Ápice' },
                { value: '1',   label: '1',  desc: '1° pós-A' },
                { value: '2',   label: '2',  desc: '2° pós-A' },
                { value: '3',   label: '3',  desc: '3° pós-A' },
                { value: 'RA',  label: 'RA', desc: 'Regra Ápice' },
              ]).map(opt => (
                <label key={opt.value} className="cursor-pointer">
                  <input type="radio" name="mobRule" value={opt.value} checked={mobRule === opt.value}
                    onChange={() => setMobRule(opt.value)} className="sr-only peer" />
                  <div className="border-2 border-gray-200 peer-checked:border-rose-400 peer-checked:bg-rose-50 rounded-xl py-2 text-center transition">
                    <p className="text-sm font-bold text-gray-700 peer-checked:text-rose-700">{opt.label || '—'}</p>
                    <p className="text-[9px] text-gray-400 leading-tight">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Intercourse */}
        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
          <div>
            <p className="text-sm font-semibold text-gray-700">Houve relação sexual?</p>
            <p className="text-xs text-gray-400 mt-0.5">Marque se houve contato sexual hoje</p>
          </div>
          <button
            type="button"
            onClick={() => setHadIntercourse(v => !v)}
            className={`w-12 h-6 rounded-full transition-colors ${hadIntercourse ? 'bg-rose-500' : 'bg-gray-200'} relative`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${hadIntercourse ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Observações (opcional)
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Dor, humor, outros sinais..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving || saved}
          className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition text-sm"
        >
          {saved ? '✓ Salvo!' : saving ? 'Salvando...' : isMan ? 'Salvar anotação' : 'Salvar registro'}
        </button>
      </form>
    </>
  )
}
