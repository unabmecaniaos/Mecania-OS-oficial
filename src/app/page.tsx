import type { Metadata } from "next";
import Link from "next/link";

import { BrandMark } from "@/components/brand/brand-mark";
import { DemoLeadForm } from "@/components/landing/demo-lead-form";

export const metadata: Metadata = {
  title: "Software de gestión para talleres y aseguradoras",
  description:
    "Centraliza órdenes, inventario, aseguradoras, finanzas y personas con MecaniaOS. Solicita una demostración para tu taller.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "MecaniaOS | Tu taller, bajo control",
    description:
      "La plataforma que conecta la operación de talleres mecánicos y liquidadores de aseguradoras en un solo lugar.",
    url: "/",
    type: "website",
  },
};

const features = [
  {
    title: "Portal Aseguradoras",
    description:
      "Conecta taller, liquidador y cliente en un flujo trazable. Presupuestos, evidencias y estados siempre disponibles.",
    icon: InsuranceIcon,
    label: "Menos correos y llamadas",
  },
  {
    title: "Búsqueda por VIN",
    description:
      "Encuentra vehículos e historial técnico en segundos. La información correcta aparece antes de abrir una nueva orden.",
    icon: VinIcon,
    label: "Historial en una vista",
  },
  {
    title: "Control Financiero",
    description:
      "Visualiza costos, márgenes, presupuestos y pagos para decidir con datos, no con planillas desactualizadas.",
    icon: FinanceIcon,
    label: "Rentabilidad visible",
  },
  {
    title: "RRHH y Equipo",
    description:
      "Ordena responsables, carga de trabajo, asistencia y desempeño para que cada persona sepa qué debe mover hoy.",
    icon: PeopleIcon,
    label: "Equipo coordinado",
  },
];

const problemItems = [
  "Información repartida entre WhatsApp, papel y planillas",
  "Horas perdidas buscando estados, repuestos y responsables",
  "Clientes y liquidadores preguntando por cada avance",
  "Márgenes difíciles de medir hasta que ya es tarde",
];

const solutionItems = [
  "Una fuente de verdad para toda la operación",
  "Trazabilidad desde el ingreso hasta la entrega",
  "Portales claros para clientes y aseguradoras",
  "Decisiones respaldadas por datos en tiempo real",
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#f4f7fb] text-[#0b1d33]">
      <header className="sticky top-0 z-50 border-b border-[#dce5f0]/80 bg-[#f7f9fc]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] w-full max-w-[1200px] items-center justify-between px-5 sm:px-8">
          <Logo />

          <nav
            aria-label="Navegación principal"
            className="hidden items-center gap-7 text-sm font-semibold text-[#52647c] md:flex"
          >
            <a className="transition hover:text-[#125fdb]" href="#solucion">
              Por qué MecaniaOS
            </a>
            <a className="transition hover:text-[#125fdb]" href="#plataforma">
              Plataforma
            </a>
            <a className="transition hover:text-[#125fdb]" href="#demo">
              Contacto
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              className="hidden rounded-full px-4 py-2.5 text-sm font-semibold text-[#36516f] transition hover:bg-white hover:text-[#125fdb] sm:inline-flex"
              href="/login"
            >
              Ingresar
            </Link>
            <a
              className="inline-flex items-center justify-center rounded-full bg-[#0d63e5] px-4 py-2.5 text-sm font-bold !text-white shadow-[0_10px_24px_rgba(13,99,229,0.22)] transition hover:-translate-y-0.5 hover:bg-[#0b55c5] sm:px-5"
              href="#demo"
            >
              Solicitar demo
            </a>
          </div>
        </div>
      </header>

      <section
        className="relative isolate overflow-hidden border-b border-[#d9e4f0] bg-[#f8fbff] pb-16 pt-14 sm:pb-24 sm:pt-20 lg:pb-28 lg:pt-24"
        id="inicio"
      >
        <div className="absolute -right-32 -top-40 -z-10 h-[520px] w-[520px] rounded-full bg-[#8ec5ff]/25 blur-[80px]" />
        <div className="absolute -bottom-44 left-[18%] -z-10 h-[420px] w-[420px] rounded-full bg-[#d4e6ff]/70 blur-[90px]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(21,92,184,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(21,92,184,0.045)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />

        <div className="mx-auto grid w-full max-w-[1200px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-[0.88fr_1.12fr] lg:gap-14">
          <div className="landing-fade-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#bad5fa] bg-white/85 px-3.5 py-2 text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#21588f] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#1d74ee] shadow-[0_0_0_5px_rgba(29,116,238,0.12)]" />
              Operación conectada, de punta a punta
            </div>

            <h1 className="max-w-[670px] text-[clamp(3.25rem,7vw,5.9rem)] font-extrabold leading-[0.94] tracking-[-0.072em] text-[#081b31]">
              Tu taller,
              <span className="block text-[#1768db]">bajo control.</span>
            </h1>

            <p className="mt-7 max-w-[590px] text-base leading-7 text-[#52657d] sm:text-lg sm:leading-8">
              MecaniaOS conecta órdenes, inventario, aseguradoras, finanzas y
              personas para que tu negocio avance sin perseguir información.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0d63e5] px-6 py-3.5 text-sm font-extrabold !text-white shadow-[0_16px_34px_rgba(13,99,229,0.25)] transition hover:-translate-y-1 hover:bg-[#0b55c5]"
                href="#demo"
              >
                Solicitar Demostración
                <ArrowIcon className="transition group-hover:translate-x-1" />
              </a>
              <a
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#ccd9e8] bg-white/75 px-6 py-3.5 text-sm font-bold text-[#284867] transition hover:-translate-y-0.5 hover:border-[#93b8e8] hover:bg-white"
                href="#plataforma"
              >
                Ver cómo funciona
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-[#687b91]">
              <span className="inline-flex items-center gap-2">
                <CheckMiniIcon /> Implementación acompañada
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckMiniIcon /> Diseñado para Chile
              </span>
            </div>
          </div>

          <ProductMockup />
        </div>
      </section>

      <section className="bg-[#081f3a] text-white" aria-label="Resumen de valor">
        <div className="mx-auto grid w-full max-w-[1200px] gap-0 px-5 py-5 sm:grid-cols-3 sm:px-8 sm:py-0">
          {[
            ["01", "Una operación unificada"],
            ["360°", "Visibilidad del negocio"],
            ["Ahora", "Información para decidir"],
          ].map(([value, label], index) => (
            <div
              className={`flex items-center gap-4 py-4 sm:min-h-[112px] sm:px-8 ${
                index > 0 ? "border-t border-white/10 sm:border-l sm:border-t-0" : ""
              }`}
              key={label}
            >
              <strong className="text-2xl font-extrabold tracking-[-0.05em] text-[#77b4ff]">
                {value}
              </strong>
              <span className="max-w-32 text-xs font-bold uppercase leading-5 tracking-[0.1em] text-[#b9cce2]">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section
        className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28"
        id="solucion"
      >
        <div className="mx-auto w-full max-w-[1200px]">
          <SectionHeading
            eyebrow="El cambio se nota"
            title={
              <>
                Del caos operativo a una
                <span className="text-[#1768db]"> gestión visible.</span>
              </>
            }
            description="Digitalizar no es agregar otra herramienta. Es conectar la información para que todo el equipo avance con el mismo contexto."
          />

          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <article className="group rounded-[28px] border border-[#e0e5ec] bg-[#eef1f5] p-6 transition duration-300 hover:-translate-y-1 sm:p-9">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#7b8795]">
                    El problema
                  </p>
                  <h3 className="mt-2 text-2xl font-extrabold tracking-[-0.045em] text-[#303d4c] sm:text-3xl">
                    El taller tradicional
                  </h3>
                </div>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#738092] shadow-sm">
                  <ProblemIcon />
                </span>
              </div>
              <ul className="space-y-3">
                {problemItems.map((item) => (
                  <li
                    className="flex gap-3 rounded-xl border border-white/70 bg-white/55 px-4 py-3.5 text-sm leading-6 text-[#647283]"
                    key={item}
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#98a5b4]" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>

            <article className="group relative overflow-hidden rounded-[28px] border border-[#1659ac] bg-[#0c3c75] p-6 text-white shadow-[0_24px_60px_rgba(12,60,117,0.16)] transition duration-300 hover:-translate-y-1 sm:p-9">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#2d81ed]/40 blur-3xl" />
              <div className="relative mb-8 flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#8dc0ff]">
                    La solución
                  </p>
                  <h3 className="mt-2 text-2xl font-extrabold tracking-[-0.045em] sm:text-3xl">
                    MecaniaOS conectado
                  </h3>
                </div>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-[#a7d0ff] ring-1 ring-white/15">
                  <SolutionIcon />
                </span>
              </div>
              <ul className="relative space-y-3">
                {solutionItems.map((item) => (
                  <li
                    className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3.5 text-sm leading-6 text-[#d7e7fa]"
                    key={item}
                  >
                    <CheckMiniIcon className="mt-1 shrink-0 text-[#74b5ff]" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section
        className="scroll-mt-24 border-y border-[#dce6f1] bg-white px-5 py-20 sm:px-8 sm:py-28"
        id="plataforma"
      >
        <div className="mx-auto w-full max-w-[1200px]">
          <SectionHeading
            eyebrow="Una plataforma, todo el negocio"
            title={
              <>
                Lo complejo por dentro.
                <span className="text-[#1768db]"> Simple para tu equipo.</span>
              </>
            }
            description="Módulos pensados alrededor del trabajo real de talleres, liquidadores y equipos administrativos."
          />

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <article
                  className="landing-feature-card group relative overflow-hidden rounded-[24px] border border-[#dae4ef] bg-[#f9fbfe] p-6 transition duration-300 hover:-translate-y-1.5 hover:border-[#a9c9f2] hover:bg-white hover:shadow-[0_20px_45px_rgba(22,74,137,0.1)] sm:p-8"
                  key={feature.title}
                >
                  <div className="flex items-start justify-between gap-5">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e4f0ff] text-[#1768db] transition group-hover:scale-105 group-hover:bg-[#1768db] group-hover:text-white">
                      <Icon />
                    </span>
                    <span className="text-xs font-extrabold tracking-[0.16em] text-[#a0adbc]">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-8 text-xl font-extrabold tracking-[-0.04em] text-[#10253e] sm:text-2xl">
                    {feature.title}
                  </h3>
                  <p className="mt-3 max-w-[500px] text-sm leading-6 text-[#60738a]">
                    {feature.description}
                  </p>
                  <div className="mt-7 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.1em] text-[#3971b2]">
                    <span className="h-px w-7 bg-[#83afe2]" />
                    {feature.label}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid w-full max-w-[1200px] items-center gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#3971b2]">
              Un flujo que todos entienden
            </p>
            <h2 className="mt-4 text-[clamp(2.4rem,5vw,4.4rem)] font-extrabold leading-[0.98] tracking-[-0.065em] text-[#0b1d33]">
              Desde el ingreso hasta la entrega.
            </h2>
            <p className="mt-6 max-w-[520px] text-base leading-7 text-[#60738a]">
              Cada actualización mueve la operación y deja una historia clara
              para el siguiente paso.
            </p>
            <a
              className="mt-8 inline-flex items-center gap-2 text-sm font-extrabold text-[#1768db] transition hover:gap-3"
              href="#demo"
            >
              Ver MecaniaOS en acción <ArrowIcon />
            </a>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-[#cedbea] bg-white shadow-[0_22px_55px_rgba(21,69,126,0.1)]">
            {[
              ["01", "Recibe y registra", "Cliente, vehículo, VIN y evidencias quedan conectados."],
              ["02", "Planifica el trabajo", "Asigna responsables, tareas, tiempos y repuestos."],
              ["03", "Informa y aprueba", "Taller, cliente y liquidador avanzan con el mismo contexto."],
              ["04", "Cierra y aprende", "Costos, pagos e historial quedan listos para decidir mejor."],
            ].map(([number, title, copy], index) => (
              <article
                className={`grid grid-cols-[42px_1fr_auto] items-center gap-3 px-5 py-5 transition hover:bg-[#f4f8fd] sm:grid-cols-[56px_1fr_auto] sm:gap-5 sm:px-8 sm:py-6 ${
                  index > 0 ? "border-t border-[#e1e8f0]" : ""
                }`}
                key={title}
              >
                <span className="text-xs font-extrabold tracking-[0.14em] text-[#1768db]">
                  {number}
                </span>
                <div>
                  <h3 className="text-base font-extrabold tracking-[-0.025em] text-[#162b43] sm:text-lg">
                    {title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-[#718299] sm:text-sm">
                    {copy}
                  </p>
                </div>
                <ArrowIcon className="text-[#7ea5d2]" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="scroll-mt-24 bg-[#071f3a] px-5 py-20 text-white sm:px-8 sm:py-28"
        id="demo"
      >
        <div className="mx-auto grid w-full max-w-[1200px] gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#4a78ad] bg-white/[0.06] px-3.5 py-2 text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#9bc7fb]">
              Conversemos
            </div>
            <h2 className="mt-6 text-[clamp(2.7rem,5.5vw,5rem)] font-extrabold leading-[0.96] tracking-[-0.07em]">
              Tu próximo paso puede ser mucho más claro.
            </h2>
            <p className="mt-6 max-w-[530px] text-base leading-7 text-[#b7cbe2]">
              Cuéntanos quién eres y te contactaremos para mostrarte un flujo
              adaptado a la realidad de tu taller o liquidadora.
            </p>
            <div className="mt-8 grid gap-3 text-sm text-[#d2e2f4]">
              <span className="flex items-center gap-3">
                <CheckMiniIcon className="text-[#79b7ff]" />
                Demostración personalizada
              </span>
              <span className="flex items-center gap-3">
                <CheckMiniIcon className="text-[#79b7ff]" />
                Sin compromiso ni instalación previa
              </span>
              <span className="flex items-center gap-3">
                <CheckMiniIcon className="text-[#79b7ff]" />
                Respuesta del equipo comercial
              </span>
            </div>
          </div>

          <DemoLeadForm />
        </div>
      </section>

      <footer className="border-t border-[#183b60] bg-[#06192f] px-5 py-12 text-white sm:px-8">
        <div className="mx-auto grid w-full max-w-[1200px] gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.9fr]">
          <div>
            <Logo inverse />
            <p className="mt-5 max-w-[330px] text-sm leading-6 text-[#8fa8c2]">
              El sistema operativo para talleres y liquidadores que quieren
              crecer con control.
            </p>
          </div>

          <FooterColumn
            title="Plataforma"
            links={[
              ["Beneficios", "#solucion"],
              ["Características", "#plataforma"],
              ["Solicitar demo", "#demo"],
            ]}
          />
          <FooterColumn
            title="Soporte"
            links={[
              ["Centro de acceso", "/login"],
              ["Soporte técnico", "mailto:hola@mecania.cl?subject=Soporte%20MecaniaOS"],
              ["Ventas", "mailto:hola@mecania.cl?subject=Demostración%20MecaniaOS"],
            ]}
          />
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#7fa2c7]">
              Información legal
            </p>
            <p className="mt-4 text-sm leading-6 text-[#9cb2c9]">
              Privacidad y tratamiento responsable de datos.
            </p>
            <p className="mt-5 text-xs leading-5 text-[#6f8ba8]">
              © {new Date().getFullYear()} MecaniaOS.
              <br />
              Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

function ProductMockup() {
  return (
    <div className="landing-fade-up landing-delay-2 relative mx-auto w-full max-w-[680px] lg:mx-0">
      <div className="absolute -left-6 top-16 hidden rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-[0_18px_40px_rgba(26,74,130,0.14)] backdrop-blur md:block">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#7b8ca0]">
          Órdenes activas
        </p>
        <p className="mt-1 text-2xl font-extrabold tracking-[-0.05em] text-[#17324f]">
          24
        </p>
      </div>

      <div className="rounded-[22px] border border-[#b9cce3] bg-[#dbe8f7] p-2.5 shadow-[0_35px_75px_rgba(20,67,122,0.2)] sm:p-3">
        <div className="overflow-hidden rounded-[15px] border border-[#cfdae8] bg-[#f6f9fd]">
          <div className="flex h-10 items-center gap-1.5 border-b border-[#dce4ee] bg-white px-4">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff7a73]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#ffcb68]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#56c58a]" />
            <span className="ml-3 h-5 flex-1 rounded-md bg-[#eef3f8]" />
          </div>
          <div className="grid min-h-[330px] grid-cols-[56px_1fr] sm:min-h-[410px] sm:grid-cols-[116px_1fr]">
            <aside className="bg-[#0b2f59] p-3 sm:p-4">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#1768db] text-[10px] font-black text-white">
                MO
              </div>
              <div className="mt-8 space-y-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    className={`h-7 rounded-lg ${
                      index === 0 ? "bg-white/15" : "bg-white/[0.04]"
                    }`}
                    key={index}
                  >
                    <span
                      className={`mx-auto mt-2 block h-2 rounded-full bg-white/35 sm:mx-2 ${
                        index % 2 === 0 ? "sm:w-12" : "sm:w-14"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </aside>
            <div className="p-4 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#8292a5] sm:text-[10px]">
                    Resumen de operación
                  </p>
                  <h2 className="mt-1 text-base font-extrabold tracking-[-0.04em] text-[#17324f] sm:text-xl">
                    Buenos días, equipo.
                  </h2>
                </div>
                <span className="hidden rounded-lg bg-[#1768db] px-3 py-2 text-[9px] font-bold text-white sm:block">
                  + Nueva orden
                </span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  ["Ingresos", "$18,4M", "+12%"],
                  ["En curso", "24", "8 hoy"],
                  ["Por aprobar", "07", "Prioridad"],
                ].map(([label, value, hint]) => (
                  <div
                    className="rounded-xl border border-[#dfe7f0] bg-white p-2.5 shadow-sm sm:p-4"
                    key={label}
                  >
                    <p className="truncate text-[7px] font-bold text-[#8391a1] sm:text-[9px]">
                      {label}
                    </p>
                    <p className="mt-1 text-sm font-extrabold tracking-[-0.05em] text-[#183650] sm:text-xl">
                      {value}
                    </p>
                    <p className="mt-1 truncate text-[7px] font-bold text-[#26925b] sm:text-[8px]">
                      {hint}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-[#dfe7f0] bg-white p-3 sm:mt-5 sm:p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-extrabold text-[#263d56] sm:text-[11px]">
                    Operación en curso
                  </p>
                  <span className="text-[7px] font-bold text-[#1768db] sm:text-[9px]">
                    Ver todo
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {[
                    ["Toyota Hilux", "En reparación", "$420.000", "bg-[#e7f0ff] text-[#1768db]"],
                    ["Mazda CX-5", "Por aprobar", "$185.000", "bg-[#fff4d9] text-[#9a6610]"],
                    ["Chevrolet Onix", "Listo", "$96.000", "bg-[#e3f7ec] text-[#237c4e]"],
                  ].map(([vehicle, status, amount, badge]) => (
                    <div
                      className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-lg bg-[#f7f9fc] px-2.5 py-2 sm:grid-cols-[1.2fr_1fr_auto] sm:px-3"
                      key={vehicle}
                    >
                      <p className="truncate text-[8px] font-bold text-[#394f66] sm:text-[10px]">
                        {vehicle}
                      </p>
                      <span
                        className={`hidden justify-self-start rounded-full px-2 py-1 text-[7px] font-bold sm:inline-flex ${badge}`}
                      >
                        {status}
                      </span>
                      <p className="text-[8px] font-extrabold text-[#243b52] sm:text-[10px]">
                        {amount}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-5 right-3 rounded-xl bg-[#1768db] px-4 py-3 text-[9px] font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_16px_30px_rgba(23,104,219,0.28)] sm:right-8 sm:text-[10px]">
        Operación en vivo
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description: string;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.55fr] lg:items-end lg:gap-12">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#3971b2]">
          {eyebrow}
        </p>
        <h2 className="mt-4 max-w-[780px] text-[clamp(2.4rem,5vw,4.5rem)] font-extrabold leading-[0.98] tracking-[-0.065em] text-[#0b1d33]">
          {title}
        </h2>
      </div>
      <p className="max-w-[480px] text-sm leading-7 text-[#687b91] sm:text-base">
        {description}
      </p>
    </div>
  );
}

function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <a
      aria-label="MecaniaOS, inicio"
      className="inline-flex items-center gap-2.5"
      href="#inicio"
    >
      <BrandMark
        className="drop-shadow-[0_8px_12px_rgba(23,104,219,0.18)]"
        priority
        size={38}
      />
      <span
        className={`text-lg font-extrabold tracking-[-0.055em] ${
          inverse ? "text-white" : "text-[#0c2340]"
        }`}
      >
        MecaniaOS
      </span>
    </a>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<[string, string]>;
}) {
  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#7fa2c7]">
        {title}
      </p>
      <div className="mt-4 grid gap-3 text-sm text-[#9cb2c9]">
        {links.map(([label, href]) => (
          <a className="transition hover:text-white" href={href} key={label}>
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}

function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`h-4 w-4 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M5 12h14m-5-5 5 5-5 5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function CheckMiniIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`h-4 w-4 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m5 12 4 4L19 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
    </svg>
  );
}

function InsuranceIcon() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 3 4.5 6v5.6c0 4.4 3.1 7.5 7.5 9.4 4.4-1.9 7.5-5 7.5-9.4V6L12 3Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path d="m9 12 2 2 4-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function VinIcon() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
      <circle cx="10.5" cy="10.5" r="5.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="m15 15 5 5M8 8h5M8 11h3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function FinanceIcon() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
      <path d="M4 20V10m6 10V4m6 16v-7m4 7H2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="m4 7 6-4 6 6 4-3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 19c.5-3.3 2.3-5 5.5-5s5 1.7 5.5 5M15 6.2c2.6.3 3.5 3.8 1.2 5.1M16.5 14c2.3.5 3.6 2.2 4 5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function ProblemIcon() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
      <path d="M6 4h9l3 3v13H6V4Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M9 10h6M9 14h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function SolutionIcon() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
      <rect height="6" rx="1.5" stroke="currentColor" strokeWidth="1.8" width="7" x="3" y="4" />
      <rect height="6" rx="1.5" stroke="currentColor" strokeWidth="1.8" width="7" x="14" y="14" />
      <path d="M10 7h3a4 4 0 0 1 4 4v3M14 17h-3a4 4 0 0 1-4-4v-3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}
