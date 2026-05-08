import { Link } from "react-router-dom";
import {
  Heart, Calendar, BarChart2, Bell, Star,
  ArrowRight, Check, Menu, X, Droplets, Moon, Sun
} from "lucide-react";
import { useState } from "react";

const features = [
  {
    icon: Droplets,
    title: "Registro diário",
    desc: "Registre suas observações diárias seguindo o Método Billings de ovulação. Interface intuitiva pensada para o dia a dia.",
    color: "bg-rose-100 text-rose-500",
  },
  {
    icon: Calendar,
    title: "Calendário do ciclo",
    desc: "Visualize seu ciclo completo em um calendário colorido e fácil de entender. Identifique padrões e tendências mês a mês.",
    color: "bg-pink-100 text-pink-500",
  },
  {
    icon: BarChart2,
    title: "Histórico detalhado",
    desc: "Acompanhe seu histórico completo de registros. Visualize a evolução do seu ciclo ao longo do tempo com gráficos claros.",
    color: "bg-rose-100 text-rose-500",
  },
  {
    icon: Bell,
    title: "Notificações inteligentes",
    desc: "Lembretes diários para não esquecer o registro. Configure o horário que funciona melhor para a sua rotina.",
    color: "bg-pink-100 text-pink-500",
  },
  {
    icon: Moon,
    title: "Método Billings",
    desc: "Baseado no Método de Ovulação Billings, um dos métodos naturais de planejamento familiar mais estudados do mundo.",
    color: "bg-rose-100 text-rose-500",
  },
  {
    icon: Heart,
    title: "Privacidade total",
    desc: "Seus dados são seus. Segurança e privacidade em primeiro lugar, com dados protegidos e sem compartilhamento com terceiros.",
    color: "bg-pink-100 text-pink-500",
  },
];

const steps = [
  { n: "01", title: "Crie sua conta", desc: "Cadastro simples e rápido. Seus dados ficam protegidos e privados." },
  { n: "02", title: "Registre diariamente", desc: "Adicione suas observações do dia de forma rápida e intuitiva." },
  { n: "03", title: "Acompanhe seu ciclo", desc: "Visualize padrões, aprenda sobre seu corpo e tome decisões informadas." },
];

const testimonials = [
  { name: "Isabela Rocha", role: "Usuária há 8 meses", text: "Finalmente entendo meu ciclo de verdade. O app é simples, bonito e me lembra de registrar todo dia. Recomendo para todas as mulheres!" },
  { name: "Marina Oliveira", role: "Usuária há 1 ano", text: "Uso o Método Billings há anos e nunca tive um app tão fácil de usar. O histórico me ajuda muito nas consultas com meu ginecologista." },
  { name: "Tatiane Souza", role: "Usuária há 5 meses", text: "A visualização do calendário é incrível. Dá para ver tudo de uma vez e entender o que está acontecendo com o meu corpo." },
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
            <a href="#testimonials" className="text-sm text-gray-600 hover:text-rose-500 transition-colors">Depoimentos</a>
            <Link to="/login" className="text-sm font-medium text-rose-500 hover:text-rose-600">Entrar</Link>
            <Link to="/cadastro" className="bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors">
              Começar grátis
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
            <Link to="/cadastro" className="bg-rose-500 text-white text-sm font-medium px-4 py-2 rounded-full text-center">Começar grátis</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 bg-gradient-to-br from-rose-50 via-pink-50 to-white">
        <div className="max-w-6xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 bg-rose-100 text-rose-600 text-xs font-semibold px-3 py-1 rounded-full mb-6">
            <Sun className="w-3 h-3" /> Acompanhe seu ciclo com o Método Billings
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Conheça seu corpo,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">
              viva com mais consciência
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10">
            O aplicativo mais simples e bonito para acompanhar seu ciclo menstrual com o Método de Ovulação Billings. Registre, visualize e entenda seu corpo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/cadastro" className="inline-flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-semibold px-8 py-4 rounded-full transition-colors text-lg shadow-lg shadow-rose-200">
              Começar grátis <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#features" className="inline-flex items-center justify-center gap-2 bg-white border border-rose-200 text-rose-600 font-semibold px-8 py-4 rounded-full hover:bg-rose-50 transition-colors text-lg">
              Saiba mais
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-400">100% gratuito · Seus dados são privados</p>
        </div>

        {/* Mockup mobile-first */}
        <div className="max-w-sm mx-auto mt-16 bg-white rounded-3xl shadow-2xl shadow-rose-100 border border-rose-100 overflow-hidden">
          <div className="bg-gradient-to-r from-rose-500 to-pink-400 px-6 py-5">
            <p className="text-white/70 text-xs mb-1">Olá, Isabela 👋</p>
            <p className="text-white font-bold text-lg">Ciclo atual — Dia 14</p>
            <p className="text-rose-100 text-sm">Período fértil em andamento</p>
          </div>
          <div className="p-5">
            <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Maio 2026</p>
            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-4">
              {["S","T","Q","Q","S","S","D"].map((d, i) => (
                <span key={i} className="text-gray-400 font-medium py-1">{d}</span>
              ))}
              {Array.from({length: 31}, (_, i) => i + 1).map((day) => (
                <span key={day} className={`py-1.5 rounded-full text-xs font-medium ${
                  [8,9,10,11,12,13,14].includes(day) ? "bg-rose-100 text-rose-600" :
                  day === 14 ? "bg-rose-500 text-white" :
                  [1,2,3,4,5].includes(day) ? "bg-pink-100 text-pink-500" :
                  "text-gray-500"
                }`}>{day}</span>
              ))}
            </div>
            <div className="bg-rose-50 rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                <Droplets className="w-4 h-4 text-rose-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700">Registrar hoje</p>
                <p className="text-xs text-gray-400">Toque para adicionar observações</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Tudo que você precisa para conhecer seu ciclo</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Simples, intuitivo e baseado em ciência.</p>
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
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Simples como deve ser</h2>
            <p className="text-gray-500 text-lg">Três passos para começar a acompanhar seu ciclo.</p>
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
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 text-center mb-14">O que as usuárias dizem</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex gap-1 mb-4">{[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-rose-400 text-rose-400" />)}</div>
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

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-r from-rose-500 to-pink-500">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Comece a se conhecer melhor hoje</h2>
          <p className="text-rose-100 text-lg mb-8">Gratuito, privado e sempre ao seu lado.</p>
          <Link to="/cadastro" className="inline-flex items-center justify-center gap-2 bg-white text-rose-500 font-bold px-8 py-4 rounded-full hover:bg-rose-50 transition-colors text-lg shadow-lg">
            Criar conta grátis <ArrowRight className="w-5 h-5" />
          </Link>
          <ul className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-rose-100">
            {["100% gratuito", "Privacidade garantida", "Sem anúncios"].map((i) => (
              <li key={i} className="flex items-center gap-2"><Check className="w-4 h-4" />{i}</li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-10 px-4 sm:px-6 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-500 to-pink-400 flex items-center justify-center">
            <Heart className="w-3 h-3 text-white" />
          </div>
          <span className="font-bold text-white">Cicla MOB</span>
        </div>
        <p>© {new Date().getFullYear()} Cicla MOB. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
