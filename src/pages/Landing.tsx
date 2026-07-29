import { Link } from "react-router-dom";
import {
  Heart, Calendar, BarChart2, Bell,
  ArrowRight, Check, Menu, X, Droplets, BookOpen, Users, ShieldCheck
} from "lucide-react";
import { useState } from "react";

// ── Mini WOOMB chart data (matches the internal CycleChartView logic) ──
const CHART_DAYS = [
  { day:  1, label: "25/3", symbol: "●", bg: "bg-red-500",    text: "text-white",     rule: "R1", sens: "Menstruação" },
  { day:  2, label: "26/3", symbol: "●", bg: "bg-red-500",    text: "text-white",     rule: "R1", sens: "Menstruação" },
  { day:  3, label: "27/3", symbol: "●", bg: "bg-red-500",    text: "text-white",     rule: "R1", sens: "Menstruação" },
  { day:  6, label: "30/3", symbol: "|", bg: "bg-green-500",  text: "text-white",     rule: "R2", sens: "Seca" },
  { day:  7, label: "31/3", symbol: "|", bg: "bg-green-500",  text: "text-white",     rule: "R2", sens: "Seca" },
  { day: 10, label: "03/4", symbol: "O", bg: "bg-white",      text: "text-gray-700",  rule: "",   sens: "Úmida" },
  { day: 13, label: "06/4", symbol: "O", bg: "bg-white",      text: "text-gray-700",  rule: "",   sens: "Molhada" },
  { day: 14, label: "07/4", symbol: "OX",bg: "bg-white",      text: "text-gray-700",  rule: "A",  sens: "Escorregadia" },
  { day: 15, label: "08/4", symbol: "1=",bg: "bg-white",      text: "text-gray-700",  rule: "1",  sens: "Úmida" },
  { day: 18, label: "11/4", symbol: "=", bg: "bg-yellow-300", text: "text-gray-800",  rule: "RA", sens: "Seca" },
  { day: 19, label: "12/4", symbol: "=", bg: "bg-yellow-300", text: "text-gray-800",  rule: "RA", sens: "Seca" },
  { day: 20, label: "13/4", symbol: "=", bg: "bg-yellow-300", text: "text-gray-800",  rule: "RA", sens: "Seca" },
];

const features = [
  {
    icon: Droplets,
    title: "Registro diário",
    desc: "O casal registra as observações diárias do muco seguindo os critérios do Método Billings. Interface simples, pensada para o dia a dia de ambos.",
    color: "bg-rose-100 text-rose-500",
  },
  {
    icon: Calendar,
    title: "Gráfico WOOMB",
    desc: "Visualize o ciclo completo no gráfico padrão WOOMB: símbolos, sensações, regras MOB — exatamente como o método foi concebido.",
    color: "bg-pink-100 text-pink-500",
  },
  {
    icon: Users,
    title: "Conta do casal",
    desc: "Marido e esposa acessam o app, registram e acompanham o ciclo juntos em tempo real. Planejamento familiar de verdade, feito a dois.",
    color: "bg-rose-100 text-rose-500",
  },
  {
    icon: Bell,
    title: "Lembretes diários",
    desc: "Notificações para não esquecer o registro. Configure o horário que funciona para a rotina de vocês.",
    color: "bg-pink-100 text-pink-500",
  },
  {
    icon: BookOpen,
    title: "Baseado no Billings",
    desc: "Fundamentado no Método de Ovulação Billings® (WOOMB), método natural de planejamento familiar reconhecido pela Igreja Católica e pela OMS.",
    color: "bg-rose-100 text-rose-500",
  },
  {
    icon: ShieldCheck,
    title: "Privacidade total",
    desc: "Seus dados são seus. Sem compartilhamento com terceiros. Segurança e privacidade em primeiro lugar.",
    color: "bg-pink-100 text-pink-500",
  },
];

const steps = [
  { n: "01", title: "Casal cria a conta", desc: "A esposa se cadastra e convida o marido. Dois em um — uma conta compartilhada para o casal." },
  { n: "02", title: "Registrem diariamente", desc: "Qualquer um do casal pode adicionar as observações do muco seguindo as instruções do método Billings." },
  { n: "03", title: "Casal acompanha junto", desc: "O marido acompanha o gráfico, identificam o período fértil e tomam decisões juntos, em comunhão." },
];

const testimonials = [
  {
    name: "Ana e Carlos",
    role: "Paróquia São Pedro — Petrópolis/RJ",
    text: "Usávamos caderno de papel. Com o app, o gráfico fica sempre com a gente e meu marido consegue acompanhar tudo. Facilitou muito a nossa comunicação como casal.",
  },
  {
    name: "Fernanda e Rodrigo",
    role: "Grupo Familiar — Diocese de Petrópolis",
    text: "Fomos formados pelo CENPLAFAM e o app segue exatamente o que aprendemos. Os símbolos são os mesmos do material impresso. Recomendamos para todos os casais da nossa comunidade.",
  },
  {
    name: "Juliana e Marcos",
    role: "Usuários há 6 meses",
    text: "O histórico é incrível. Conseguimos mostrar os gráficos para a nossa instrutora Billings e ela ficou impressionada com a fidelidade ao método WOOMB.",
  },
];

const references = [
  {
    name: "CENPLAFAM WOOMB Brasil",
    desc: "Centro Nacional de Planejamento Familiar — formação e acompanhamento oficial do Método Billings no Brasil.",
    url: "https://www.cenplafam.com.br/",
    highlight: true,
  },
  {
    name: "WOOMB International",
    desc: "Organização mundial responsável pelo desenvolvimento e difusão do Método de Ovulação Billings®.",
    url: "https://www.woomb.org/",
    highlight: false,
  },
  {
    name: "Diocese de Petrópolis",
    desc: "Pastoral Familiar e grupos de apoio ao planejamento familiar natural na Diocese de Petrópolis/RJ.",
    url: "https://www.diocesepetrópolis.org.br/",
    highlight: false,
  },
  {
    name: "Canção Nova",
    desc: "Comunidade católica de evangelização — conteúdos sobre família, amor conjugal e planejamento natural.",
    url: "https://www.cancaonova.com/",
    highlight: false,
  },
  {
    name: "Santa Sé — Vaticano",
    desc: "Site oficial do Vaticano com os documentos do magistério, incluindo Humanae Vitae e Familiaris Consortio.",
    url: "https://www.vatican.va/",
    highlight: false,
  },
];

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-rose-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-400 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">Cicla MOB</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-rose-500 transition-colors">Funcionalidades</a>
            <a href="#how" className="text-sm text-gray-600 hover:text-rose-500 transition-colors">Como funciona</a>
            <a href="#referencias" className="text-sm text-gray-600 hover:text-rose-500 transition-colors">Referências</a>
            <Link to="/login" className="text-sm font-medium text-rose-500 hover:text-rose-600">Entrar</Link>
            <Link to="/signup" className="bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors">
              Começar
            </Link>
          </div>
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-rose-100 bg-white px-4 py-4 flex flex-col gap-4">
            <a href="#features" className="text-sm text-gray-600">Funcionalidades</a>
            <a href="#how" className="text-sm text-gray-600">Como funciona</a>
            <a href="#referencias" className="text-sm text-gray-600">Referências</a>
            <Link to="/signup" className="bg-rose-500 text-white text-sm font-medium px-4 py-2 rounded-full text-center">Começar</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 bg-gradient-to-br from-rose-50 via-pink-50 to-white">
        <div className="max-w-6xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 bg-rose-100 text-rose-700 text-xs font-semibold px-3 py-1 rounded-full mb-6">
            <Heart className="w-3 h-3" /> Método de Ovulação Billings® — WOOMB
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Planejamento familiar<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-pink-500">
              pelo Método de Ovulação Billings®
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-4">
            Acompanhe o ciclo da esposa com o gráfico WOOMB — o mesmo padrão ensinado pelo CENPLAFAM e pela Diocese de Petrópolis. Simples, fiel ao método e feito para o casal.
          </p>
          <p className="text-sm text-gray-400 italic mb-8">
            "Cada pessoa humana, homem e mulher, tem uma dignidade intrínseca e inviolável." — <em>Humanae Vitae</em>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="inline-flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-semibold px-8 py-4 rounded-full transition-colors text-lg shadow-lg shadow-rose-200">
              Começar agora <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#features" className="inline-flex items-center justify-center gap-2 bg-white border border-rose-200 text-rose-600 font-semibold px-8 py-4 rounded-full hover:bg-rose-50 transition-colors text-lg">
              Saiba mais
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-400">R$ 9,90/mês por casal ou individual · Privado · Baseado no método WOOMB</p>
        </div>

        {/* Mini WOOMB chart mockup */}
        <div className="max-w-sm mx-auto mt-16 bg-white rounded-3xl shadow-2xl shadow-rose-100 border border-rose-100 overflow-hidden">
          <div className="bg-gradient-to-r from-rose-600 to-pink-500 px-5 py-4">
            <p className="text-white/70 text-xs mb-0.5">Ana e Carlos · Ciclo 3</p>
            <p className="text-white font-bold text-base">Gráfico WOOMB — Março/Abril</p>
            <p className="text-rose-100 text-xs">Úmida — Infértil</p>
          </div>
          <div className="px-3 py-3 overflow-x-auto">
            {/* Header rows */}
            <div className="flex w-max text-[8px]">
              {/* Label column */}
              <div className="w-16 shrink-0 border-r-2 border-gray-300 mr-0.5">
                <div className="h-5 flex items-center pl-1 border-b border-gray-200 font-semibold text-gray-500">Dia ciclo</div>
                <div className="h-8 flex items-center pl-1 border-b border-gray-200 font-semibold text-gray-500">Símbolo</div>
                <div className="h-4 flex items-center pl-1 border-b border-gray-200 font-semibold text-gray-500">Dia mês</div>
                <div className="h-16 flex items-start pt-1 pl-1 border-b border-gray-200 font-semibold text-gray-500">
                  <span>Sensação</span>
                </div>
                <div className="h-5 flex items-center pl-1 font-semibold text-gray-500">Regra</div>
              </div>
              {/* Day columns */}
              {CHART_DAYS.map((d) => (
                <div key={d.day} className="w-8 shrink-0 border-r border-gray-100">
                  <div className="h-5 flex items-center justify-center border-b border-gray-200 font-bold text-gray-600 text-[9px]">
                    {String(d.day).padStart(2, "0")}
                  </div>
                  <div className="h-8 flex items-center justify-center border-b border-gray-200 p-0.5">
                    <div className={`w-full h-full rounded flex items-center justify-center text-[8px] font-bold border ${d.bg} ${d.text} border-gray-300`}>
                      {d.symbol}
                    </div>
                  </div>
                  <div className="h-4 flex items-center justify-center border-b border-gray-200 text-[7px] text-gray-500">
                    {d.label}
                  </div>
                  <div className="h-16 flex items-center justify-center border-b border-gray-200 overflow-hidden">
                    <span className="text-[7px] text-gray-600" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                      {d.sens}
                    </span>
                  </div>
                  <div className="h-5 flex items-center justify-center text-[8px] font-bold text-gray-600">
                    {d.rule}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="px-4 pb-3">
            <div className="flex flex-wrap gap-2 text-[9px]">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> Menstruação</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> Seca</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-gray-300 inline-block" /> Fértil/Ápice</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-300 inline-block" /> Úmida</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Feito para casais que vivem o Billings</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Fiel ao método WOOMB. Simples de usar. Para a família.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-rose-100 transition-all">
                <div className={`w-11 h-11 rounded-full ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how" className="py-20 px-4 sm:px-6 bg-gradient-to-br from-rose-50 to-pink-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Como funciona para o casal</h2>
            <p className="text-gray-500 text-lg">Três passos para começar a usar junto.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.n} className="text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-pink-400 text-white font-black text-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-200">
                  {s.n}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 text-center mb-14">O que os casais dizem</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Heart key={i} className="w-4 h-4 fill-rose-400 text-rose-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-gray-400 text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* References / CENPLAFAM */}
      <section id="referencias" className="py-20 px-4 sm:px-6 bg-gradient-to-br from-rose-50 to-pink-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Fundamentado e reconhecido</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              O Cicla MOB é desenvolvido em harmonia com as organizações que ensinam e promovem o Método Billings no Brasil e no mundo.
            </p>
          </div>

          {/* CENPLAFAM destaque */}
          <a
            href="https://www.cenplafam.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col sm:flex-row items-center gap-6 bg-white border-2 border-rose-200 rounded-2xl p-6 mb-6 shadow-sm hover:shadow-md transition-all"
          >
            <div className="shrink-0">
              <img
                src="/cenplafam-logo.png"
                alt="Logo CENPLAFAM WOOMB Brasil"
                className="w-24 h-24 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden w-24 h-24 rounded-full bg-gradient-to-br from-[#2e3a8c] to-[#c0447a] flex items-center justify-center text-white text-xs font-bold text-center leading-tight p-2">
                CENPLAFAM<br />WOOMB<br />Brasil
              </div>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg mb-1">CENPLAFAM WOOMB Brasil</p>
              <p className="text-gray-500 text-sm leading-relaxed">
                Centro Nacional de Planejamento Familiar — organização oficial do Método Billings no Brasil. Responsável pela formação de instrutores e pelo acompanhamento de casais em todo o país, incluindo a Diocese de Petrópolis.
              </p>
              <span className="mt-2 inline-block text-xs text-rose-600 font-medium">www.cenplafam.com.br →</span>
            </div>
          </a>

          {/* Other references */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {references.slice(1).map((r) => (
              <a
                key={r.name}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border border-gray-100 rounded-xl p-4 hover:border-rose-200 hover:shadow-sm transition-all"
              >
                <p className="font-semibold text-gray-900 text-sm mb-1">{r.name}</p>
                <p className="text-gray-400 text-xs leading-relaxed">{r.desc}</p>
              </a>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-gray-400">
            O Cicla MOB não é afiliado oficialmente ao CENPLAFAM ou à Diocese de Petrópolis. Faz referência a essas organizações por seguir fielmente os critérios do Método de Ovulação Billings® (WOOMB).
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-r from-rose-600 to-pink-500">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Comece a usar com seu casal hoje</h2>
          <p className="text-rose-100 text-lg mb-8">R$ 9,90/mês por casal ou individual. Privado e fiel ao Método Billings.</p>
          <Link to="/signup" className="inline-flex items-center justify-center gap-2 bg-white text-rose-600 font-bold px-8 py-4 rounded-full hover:bg-rose-50 transition-colors text-lg shadow-lg">
            Criar conta <ArrowRight className="w-5 h-5" />
          </Link>
          <ul className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-rose-100">
            {["R$ 9,90/mês por casal ou individual", "Privacidade garantida", "Gráfico WOOMB fiel ao método"].map((i) => (
              <li key={i} className="flex items-center gap-2"><Check className="w-4 h-4" />{i}</li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-10 px-4 sm:px-6 text-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-500 to-pink-400 flex items-center justify-center">
                <Heart className="w-3 h-3 text-white" />
              </div>
              <span className="font-bold text-white">Cicla MOB</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-xs">
              <a href="https://www.cenplafam.com.br/" target="_blank" rel="noopener noreferrer" className="hover:text-rose-400 transition-colors">CENPLAFAM</a>
              <a href="https://www.woomb.org/" target="_blank" rel="noopener noreferrer" className="hover:text-rose-400 transition-colors">WOOMB International</a>
              <a href="https://www.cancaonova.com/" target="_blank" rel="noopener noreferrer" className="hover:text-rose-400 transition-colors">Canção Nova</a>
              <a href="https://www.vatican.va/" target="_blank" rel="noopener noreferrer" className="hover:text-rose-400 transition-colors">Vaticano</a>
            </div>
          </div>
          <p className="text-center text-xs">© {new Date().getFullYear()} Cicla MOB. Todos os direitos reservados.</p>
          <p className="text-center text-xs mt-1 text-gray-600">Desenvolvido com respeito à vida e à família, em harmonia com os ensinamentos da Igreja Católica.</p>
        </div>
      </footer>
    </div>
  );
}
