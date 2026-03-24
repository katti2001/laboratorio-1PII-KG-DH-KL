import { useMemo, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, Link } from 'react-router-dom'

type Clase = 'economica' | 'ejecutiva' | 'primera'
type Temporada = 'baja' | 'media' | 'alta'
type TipoCompra = 'anticipada' | 'mismo-dia'

type Venta = {
  id: number
  nombre: string
  edad: number
  distancia: number
  clase: Clase
  temporada: Temporada
  equipajeExtra: number
  tipoCompra: TipoCompra
  ocupacion: number
  subtotal: number
  total: number
  detalle: string[]
  clasificacion: 'Premium' | 'Regular' | 'Económico'
}

const TARIFA_KM = 0.3
const CLASE_MULTIPLIER: Record<Clase, number> = {
  economica: 0,
  ejecutiva: 0.35,
  primera: 0.7,
}
const TEMPORADA_MULTIPLIER: Record<Temporada, number> = {
  baja: -0.15,
  media: 0,
  alta: 0.25,
}
const EDAD_DISCOUNT = (edad: number) => {
  if (edad < 12) return -0.5
  if (edad > 65) return -0.3
  return 0
}
const COMPRA_MULTIPLIER: Record<TipoCompra, number> = {
  anticipada: -0.05,
  'mismo-dia': 0.2,
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-vh-100 text-dark">
        <header className="border-bottom border-primary bg-white bg-opacity-90 shadow-sm">
          <div className="container py-3 d-flex justify-content-between align-items-center">
            <div className="fw-semibold text-primary">Sistema Tarifas Tren</div>
            <nav className="d-flex gap-3 small">
              <Link className="text-decoration-none text-dark" to="/">Calcular</Link>
              <Link className="text-decoration-none text-dark" to="/reporte">Reporte</Link>
            </nav>
          </div>
        </header>

        <main className="container py-4">
          <Routes>
            <Route path="/" element={<Calculadora />} />
            <Route path="/reporte" element={<Reporte />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

type FormState = {
  nombre: string
  edad: number | ''
  distancia: number | ''
  clase: Clase
  temporada: Temporada
  equipajeExtra: number | ''
  tipoCompra: TipoCompra
}

const initialForm: FormState = {
  nombre: '',
  edad: '',
  distancia: '',
  clase: 'economica',
  temporada: 'media',
  equipajeExtra: 0,
  tipoCompra: 'anticipada',
}

function Calculadora() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [ventas, setVentas] = useState<Venta[]>([])
  const [detalleActual, setDetalleActual] = useState<string[]>([])
  const [totalActual, setTotalActual] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const trenCompleto = ventas.length >= 120

  const handleChange = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: key === 'nombre' ? value : value }))
  }

  const parseNumber = (val: number | '') => (val === '' || Number.isNaN(Number(val)) ? null : Number(val))

  const calcular = () => {
    setError(null)
    const distanciaNum = parseNumber(form.distancia)
    const edadNum = parseNumber(form.edad)
    const equipajeNum = parseNumber(form.equipajeExtra)

    if (trenCompleto) {
      setError('Tren Completo: máximo 120 pasajeros por día')
      return
    }
    if (!form.nombre.trim()) {
      setError('El nombre no puede estar vacío')
      return
    }
    if (edadNum === null || edadNum < 0) {
      setError('La edad no puede ser negativa ni vacía')
      return
    }
    if (distanciaNum === null || distanciaNum < 20) {
      setError('Distancia mínima: 20 km')
      return
    }
    if (equipajeNum === null || equipajeNum < 0) {
      setError('El equipaje extra no puede ser negativo')
      return
    }

    const detalle: string[] = []
    const base = distanciaNum * TARIFA_KM
    detalle.push(`Base por distancia (${distanciaNum} km × $${TARIFA_KM.toFixed(2)}) = $${base.toFixed(2)}`)

    const claseAdj = base * CLASE_MULTIPLIER[form.clase]
    detalle.push(`Clase (${labelClase(form.clase)}) ${formatPct(CLASE_MULTIPLIER[form.clase])} = $${claseAdj.toFixed(2)}`)

    const temporadaAdj = base * TEMPORADA_MULTIPLIER[form.temporada]
    detalle.push(`Temporada (${labelTemporada(form.temporada)}) ${formatPct(TEMPORADA_MULTIPLIER[form.temporada])} = $${temporadaAdj.toFixed(2)}`)

    const edadAdj = base * EDAD_DISCOUNT(edadNum)
    detalle.push(`Edad (${edadNum} años) ${formatPct(EDAD_DISCOUNT(edadNum))} = $${edadAdj.toFixed(2)}`)

    const equipajeAdj = equipajeNum * 6
    detalle.push(`Equipaje extra (${equipajeNum} maletas × $6) = $${equipajeAdj.toFixed(2)}`)

    const compraAdj = base * COMPRA_MULTIPLIER[form.tipoCompra]
    detalle.push(`Tipo de compra (${labelCompra(form.tipoCompra)}) ${formatPct(COMPRA_MULTIPLIER[form.tipoCompra])} = $${compraAdj.toFixed(2)}`)

    const ocupacion = Math.floor(50 + Math.random() * 50)
    let ocupacionAdj = 0
    if (ocupacion > 85) {
      ocupacionAdj = base * 0.12
      detalle.push(`Alta demanda (ocupación ${ocupacion}%) +12% = $${ocupacionAdj.toFixed(2)}`)
    } else {
      detalle.push(`Ocupación simulada ${ocupacion}% (sin recargo) = $0.00`)
    }

    const subtotal = base + claseAdj + temporadaAdj + edadAdj + compraAdj + equipajeAdj + ocupacionAdj
    const total = Math.max(0, subtotal)
    const clasificacion =
      total > 150 ? 'Premium' : total >= 70 ? 'Regular' : 'Económico'

    const nuevaVenta: Venta = {
      id: Date.now(),
      nombre: form.nombre.trim(),
      edad: edadNum,
      distancia: distanciaNum,
      clase: form.clase,
      temporada: form.temporada,
      equipajeExtra: equipajeNum,
      tipoCompra: form.tipoCompra,
      ocupacion,
      subtotal,
      total,
      detalle,
      clasificacion,
    }

    setVentas((prev) => [...prev, nuevaVenta])
    setDetalleActual(detalle)
    setTotalActual(total)
  }

  const reset = () => {
    setForm(initialForm)
    setDetalleActual([])
    setTotalActual(null)
    setError(null)
  }

  const { stats } = useStats(ventas)

  return (
    <div className="row g-4">
      <div className="col-lg-6">
        <div className="card bg-white border border-primary border-opacity-50 shadow-sm">
          <div className="card-body">
            <h5 className="card-title mb-3">Calcular boleto</h5>
            {trenCompleto && <div className="alert alert-warning">Tren Completo (120 pasajeros)</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="row g-3">
              <div className="col-12">
                <label className="form-label">Nombre</label>
                <input
                  className="form-control bg-white text-dark border-secondary"
                  value={form.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  placeholder="Nombre del pasajero"
                />
              </div>
              <div className="col-6">
                <label className="form-label">Edad</label>
                <input
                  type="number"
                  className="form-control bg-white text-dark border-secondary"
                  value={form.edad}
                  onChange={(e) => handleChange('edad', e.target.value)}
                  min={0}
                />
              </div>
              <div className="col-6">
                <label className="form-label">Distancia (km)</label>
                <input
                  type="number"
                  className="form-control bg-white text-dark border-secondary"
                  value={form.distancia}
                  onChange={(e) => handleChange('distancia', e.target.value)}
                  min={20}
                />
              </div>
              <div className="col-6">
                <label className="form-label">Clase</label>
                <select
                  className="form-select bg-white text-dark border-secondary"
                  value={form.clase}
                  onChange={(e) => handleChange('clase', e.target.value)}
                >
                  <option value="economica">Económica</option>
                  <option value="ejecutiva">Ejecutiva</option>
                  <option value="primera">Primera Clase</option>
                </select>
              </div>
              <div className="col-6">
                <label className="form-label">Temporada</label>
                <select
                  className="form-select bg-white text-dark border-secondary"
                  value={form.temporada}
                  onChange={(e) => handleChange('temporada', e.target.value)}
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
              <div className="col-6">
                <label className="form-label">Equipaje extra (maletas)</label>
                <input
                  type="number"
                  className="form-control bg-white text-dark border-secondary"
                  value={form.equipajeExtra}
                  onChange={(e) => handleChange('equipajeExtra', e.target.value)}
                  min={0}
                />
              </div>
              <div className="col-6">
                <label className="form-label">Tipo de compra</label>
                <select
                  className="form-select bg-white text-dark border-secondary"
                  value={form.tipoCompra}
                  onChange={(e) => handleChange('tipoCompra', e.target.value)}
                >
                  <option value="anticipada">Anticipada</option>
                  <option value="mismo-dia">Mismo día</option>
                </select>
              </div>
            </div>

            <div className="d-flex gap-3 mt-4">
              <button className="btn btn-primary" onClick={calcular} disabled={trenCompleto}>
                Calcular
              </button>
              <button className="btn btn-outline-secondary" onClick={reset}>
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="col-lg-6">
        <div className="card bg-white border border-success border-opacity-50 shadow-sm mb-3">
          <div className="card-body">
            <h5 className="card-title mb-3">Detalle del cálculo</h5>
            {totalActual === null ? (
              <p className="text-secondary">Realiza un cálculo para ver el detalle.</p>
            ) : (
              <div className="vstack gap-2">
                {detalleActual.map((linea, idx) => (
                  <div key={idx} className="text-sm text-dark">
                    {linea}
                  </div>
                ))}
                <hr className="border-secondary" />
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-semibold">Total</span>
                  <span className="fs-4 fw-bold text-success">${totalActual.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card bg-white border border-info border-opacity-50 shadow-sm">
          <div className="card-body">
            <h5 className="card-title mb-3">Ventas del día ({ventas.length}/120)</h5>
            {ventas.length === 0 ? (
              <p className="text-secondary mb-0">Aún no hay ventas registradas.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped table-sm align-middle">
                  <thead>
                    <tr>
                      <th>Pasajero</th>
                      <th>Clase</th>
                      <th>Temporada</th>
                      <th>Total</th>
                      <th>Clasificación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventas.map((v) => (
                      <tr key={v.id}>
                        <td>{v.nombre}</td>
                        <td>{labelClase(v.clase)}</td>
                        <td>{labelTemporada(v.temporada)}</td>
                        <td>${v.total.toFixed(2)}</td>
                        <td>{v.clasificacion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="col-12">
        <Stats stats={stats} />
      </div>
    </div>
  )
}

function useStats(ventas: Venta[]) {
  const stats = useMemo(() => {
    if (ventas.length === 0) {
      return {
        totalVendido: 0,
        promedio: 0,
        claseMasUsada: 'N/A',
        temporadaMayorIngreso: 'N/A',
        pasajerosDescuentoEdad: 0,
        pasajerosAltaDemanda: 0,
        boletoMasCaro: 'N/A',
      }
    }

    const totalVendido = ventas.reduce((acc, v) => acc + v.total, 0)
    const promedio = totalVendido / ventas.length

    const conteoClases: Record<Clase, number> = {
      economica: 0,
      ejecutiva: 0,
      primera: 0,
    }
    const ingresoPorTemporada: Record<Temporada, number> = {
      baja: 0,
      media: 0,
      alta: 0,
    }

    let pasajerosDescuentoEdad = 0
    let pasajerosAltaDemanda = 0
    let boletoMasCaro = ventas[0]

    ventas.forEach((v) => {
      conteoClases[v.clase] += 1
      ingresoPorTemporada[v.temporada] += v.total
      if (EDAD_DISCOUNT(v.edad) < 0) pasajerosDescuentoEdad += 1
      if (v.ocupacion > 85) pasajerosAltaDemanda += 1
      if (v.total > boletoMasCaro.total) boletoMasCaro = v
    })

    const claseMasUsada = labelClase(
      (Object.entries(conteoClases).sort((a, b) => b[1] - a[1])[0][0] as Clase) ?? 'economica',
    )
    const temporadaMayorIngreso = labelTemporada(
      (Object.entries(ingresoPorTemporada).sort((a, b) => b[1] - a[1])[0][0] as Temporada) ?? 'media',
    )

    return {
      totalVendido,
      promedio,
      claseMasUsada,
      temporadaMayorIngreso,
      pasajerosDescuentoEdad,
      pasajerosAltaDemanda,
      boletoMasCaro: `${boletoMasCaro.nombre} ($${boletoMasCaro.total.toFixed(2)})`,
    }
  }, [ventas])

  return { stats }
}

function Stats({
  stats,
}: {
  stats: {
    totalVendido: number
    promedio: number
    claseMasUsada: string
    temporadaMayorIngreso: string
    pasajerosDescuentoEdad: number
    pasajerosAltaDemanda: number
    boletoMasCaro: string
  }
}) {
  const items = [
    { label: 'Total vendido', value: `$${stats.totalVendido.toFixed(2)}` },
    { label: 'Promedio por pasajero', value: `$${stats.promedio.toFixed(2)}` },
    { label: 'Clase más utilizada', value: stats.claseMasUsada },
    { label: 'Temporada mayor ingreso', value: stats.temporadaMayorIngreso },
    { label: 'Pasajeros con descuento edad', value: stats.pasajerosDescuentoEdad },
    { label: 'Pasajeros alta demanda', value: stats.pasajerosAltaDemanda },
    { label: 'Boleto más caro', value: stats.boletoMasCaro },
  ]

  return (
    <div className="card bg-white border border-secondary shadow-sm">
      <div className="card-body">
        <h5 className="card-title mb-3">Reporte del día</h5>
        <div className="row g-3">
          {items.map((item) => (
            <div className="col-md-4" key={item.label}>
              <div className="p-3 rounded border border-secondary border-opacity-50 h-100 bg-light">
                <div className="text-uppercase text-muted small fw-semibold">{item.label}</div>
                <div className="fs-5 fw-bold text-dark">{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Reporte() {
  return (
    <div className="text-secondary">
      Usa la pestaña "Calcular" para registrar ventas y ver el reporte dinámico.
    </div>
  )
}

function labelClase(c: Clase) {
  return c === 'economica' ? 'Económica' : c === 'ejecutiva' ? 'Ejecutiva' : 'Primera Clase'
}
function labelTemporada(t: Temporada) {
  return t === 'baja' ? 'Baja' : t === 'media' ? 'Media' : 'Alta'
}
function labelCompra(c: TipoCompra) {
  return c === 'anticipada' ? 'Anticipada' : 'Mismo día'
}
function formatPct(value: number) {
  const pct = (value * 100).toFixed(0)
  return `${value >= 0 ? '+' : ''}${pct}%`
}

export default App
