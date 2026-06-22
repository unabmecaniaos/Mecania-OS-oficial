import Link from "next/link";

const capabilities = [
  {
    number: "01",
    title: "Operación en un solo lugar",
    text: "Órdenes de trabajo, clientes, vehículos y repuestos conectados en un flujo claro para todo el equipo.",
  },
  {
    number: "02",
    title: "Clientes siempre informados",
    text: "Comparte avances, presupuestos y el historial del vehículo sin depender de llamadas ni mensajes dispersos.",
  },
  {
    number: "03",
    title: "Control que escala",
    text: "Convierte cada orden en información útil para planificar mejor, reducir demoras y cuidar el margen.",
  },
];

function ArrowUpRight() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <main className="landing">
      <div className="landing-grid" aria-hidden="true" />
      <nav className="landing-nav" aria-label="Navegación principal">
        <Link className="landing-logo" href="#inicio" aria-label="Mecania, inicio">
          <span className="landing-logo-mark"><i /><i /><i /></span>
          <span>MECANIA</span>
        </Link>
        <div className="landing-nav-links">
          <a href="#producto">Producto</a>
          <a href="#operacion">Para talleres</a>
          <Link className="landing-login" href="/login">Ingresar</Link>
        </div>
      </nav>

      <section className="landing-hero" id="inicio">
        <div className="landing-hero-copy">
          <p className="landing-eyebrow"><span /> SOFTWARE PARA TALLERES</p>
          <h1>El control que<br /><em>mueve</em> tu taller.</h1>
          <p className="landing-intro">Mecania reúne la operación de tu taller en un sistema simple: desde que entra un vehículo hasta que el cliente vuelve.</p>
          <div className="landing-actions">
            <a className="landing-button landing-button-primary" href="mailto:hola@mecania.cl?subject=Quiero%20conocer%20Mecania">
              Solicitar una demo <ArrowUpRight />
            </a>
            <a className="landing-button landing-button-quiet" href="#producto">Conocer Mecania <span>↓</span></a>
          </div>
        </div>

        <div className="landing-product" aria-label="Vista previa del panel de operaciones de Mecania">
          <div className="product-glow" />
          <div className="product-window">
            <div className="product-sidebar">
              <div className="product-symbol"><i /><i /><i /></div>
              <span className="product-active" />
              <span /><span /><span /><span />
              <span className="product-sidebar-bottom" />
            </div>
            <div className="product-content">
              <div className="product-topbar"><span>Resumen de operación</span><div><b /><b /></div></div>
              <div className="product-welcome"><div><small>Jueves, 22 de mayo</small><strong>Buenos días, equipo.</strong></div><button>+ Nueva orden</button></div>
              <div className="product-stats">
                <div><small>Órdenes activas</small><strong>24</strong><em>+8% esta semana</em></div>
                <div><small>Por entregar hoy</small><strong>07</strong><em className="warn">Requieren atención</em></div>
                <div><small>Facturación mensual</small><strong>$18.4M</strong><em>+12% vs. anterior</em></div>
              </div>
              <div className="product-table"><div className="product-table-title"><strong>Órdenes recientes</strong><small>Ver todas →</small></div><div className="product-table-head"><span>VEHÍCULO</span><span>ESTADO</span><span>MONTO</span></div>{["Toyota Hilux 2021", "Mazda CX-5 2020", "Chevrolet Onix 2023"].map((vehicle, index) => <div className="product-row" key={vehicle}><span><b className={`vehicle-dot dot-${index}`} />{vehicle}</span><span><i className={`status status-${index}`} />{index === 0 ? "En proceso" : index === 1 ? "Pendiente" : "Listo"}</span><strong>{index === 0 ? "$420.000" : index === 1 ? "$185.000" : "$96.000"}</strong></div>)}</div>
            </div>
          </div>
          <div className="product-tag"><span className="pulse" /> OPERACIÓN EN TIEMPO REAL</div>
        </div>
      </section>

      <section className="landing-proof" aria-label="Beneficios principales">
        <p>UNA PLATAFORMA DISEÑADA PARA LA OPERACIÓN REAL</p>
        <div><span>Menos fricción.</span><span>Más control.</span><span>Mejor servicio.</span></div>
      </section>

      <section className="landing-features" id="producto">
        <div className="landing-section-heading"><p className="landing-eyebrow"><span /> TODO CONECTADO</p><h2>Un taller ordenado<br />se nota <em>afuera.</em></h2></div>
        <div className="landing-feature-list">{capabilities.map((capability) => <article key={capability.number}><span>{capability.number}</span><div><h3>{capability.title}</h3><p>{capability.text}</p></div><ArrowUpRight /></article>)}</div>
      </section>

      <section className="landing-cta" id="operacion">
        <p className="landing-eyebrow"><span /> LISTO PARA AVANZAR</p>
        <h2>Haz que tu taller<br />trabaje <em>mejor.</em></h2>
        <a className="landing-button landing-button-primary" href="mailto:hola@mecania.cl?subject=Quiero%20conocer%20Mecania">Hablemos de tu taller <ArrowUpRight /></a>
      </section>

      <footer className="landing-footer"><div className="landing-logo"><span className="landing-logo-mark"><i /><i /><i /></span><span>MECANIA</span></div><p>Operación clara para talleres que quieren crecer.</p><span>© {new Date().getFullYear()} Mecania</span></footer>
    </main>
  );
}
