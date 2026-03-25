import { useState } from 'react'

type Clase = 'economica' | 'ejecutiva' | 'primera'
type Temporada = 'baja' | 'media' | 'alta'
type TipoCompra = 'anticipada' | 'mismo-dia'
type CategoriaJunior = 'bebe' | 'nino' | 'menor-solo'

export type VentaJunior = {
  id: number
  nombre: string
  edad: number
  categoria: CategoriaJunior
  distancia: number
  clase: Clase
  temporada: Temporada
  tipoCompra: TipoCompra
  llevaCertificado: boolean
  vaConAdulto: boolean
  nombreAdulto: string
  subtotal: number
  total: number
  detalle: string[]
}

type FormJunior = {
  nombre: string
  edad: number | ''
  distancia: number | ''
  clase: Clase
  temporada: Temporada
  tipoCompra: TipoCompra
  llevaCertificado: boolean
  vaConAdulto: boolean
  nombreAdulto: string
}

const initialForm: FormJunior = {
  nombre: '',
  edad: '',
  distancia: '',
  clase: 'economica',
  temporada: 'media',
  tipoCompra: 'anticipada',
  llevaCertificado: false,
  vaConAdulto: false,
  nombreAdulto: '',
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
const COMPRA_MULTIPLIER: Record<TipoCompra, number> = {
  anticipada: -0.05,
  'mismo-dia': 0.2,
}

function getCategoriaJunior(edad: number, vaConAdulto: boolean): CategoriaJunior {
  if (edad <= 2) return 'bebe'
  if (!vaConAdulto) return 'menor-solo'
  return 'nino'
}

function labelCategoria(c: CategoriaJunior) {
  if (c === 'bebe') return 'Bebé (0–2 años)'
  if (c === 'nino') return 'Niño/a (3–12 años)'
  return 'Menor solo'
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

function parseNumber(val: number | '') {
  return val === '' || Number.isNaN(Number(val)) ? null : Number(val)
}

export default function CalculadoraJunior(props: {
  ventasJunior: VentaJunior[]
  setVentasJunior: (v: VentaJunior[]) => void
}) {
  const { ventasJunior, setVentasJunior } = props
  const [form, setForm] = useState<FormJunior>(initialForm)
  const [detalleActual, setDetalleActual] = useState<string[]>([])
  const [totalActual, setTotalActual] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleChange = <K extends keyof FormJunior>(key: K, value: FormJunior[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      // Si la edad cae por debajo de 15, forzar vaConAdulto = true
      if (key === 'edad') {
        const edadVal = value as number | ''
        if (edadVal !== '' && Number(edadVal) < 15) {
          next.vaConAdulto = true
        }
      }
      return next
    })
  }

  const calcular = () => {
    setError(null)
    const distanciaNum = parseNumber(form.distancia)
    const edadNum = parseNumber(form.edad)

    if (!form.nombre.trim()) {
      setError('El nombre del niño/a no puede estar vacío')
      return
    }
    if (edadNum === null || edadNum < 0 || edadNum > 17) {
      setError('La edad debe estar entre 0 y 17 años para la categoría Junior')
      return
    }
    if (distanciaNum === null || distanciaNum < 20) {
      setError('Distancia mínima: 20 km')
      return
    }
    if (edadNum < 15 && !form.vaConAdulto) {
      setError('Los menores de 15 años deben viajar obligatoriamente con un adulto responsable')
      return
    }
    if (edadNum <= 2 && !form.vaConAdulto) {
      setError('Los bebés (0–2 años) deben viajar obligatoriamente con un adulto')
      return
    }
    if (edadNum >= 3 && edadNum >= 15 && !form.vaConAdulto && !form.llevaCertificado) {
      setError('Un menor que viaja solo debe presentar autorización firmada (certificado)')
      return
    }
    if (form.vaConAdulto && !form.nombreAdulto.trim()) {
      setError('Debes ingresar el nombre del adulto acompañante')
      return
    }

    const categoria = getCategoriaJunior(edadNum, form.vaConAdulto)
    const detalle: string[] = []

    // ── Bebé: gratis ──────────────────────────────────────────────────────────
    if (categoria === 'bebe') {
      detalle.push(`Categoría: Bebé (0–2 años) → viaje GRATIS (no ocupa asiento)`)
      detalle.push(`Adulto acompañante: ${form.nombreAdulto}`)
      if (form.llevaCertificado) detalle.push(`Documento registrado: certificado presentado`)

      setVentasJunior([
        ...ventasJunior,
        {
          id: Date.now(),
          nombre: form.nombre.trim(),
          edad: edadNum,
          categoria,
          distancia: distanciaNum,
          clase: form.clase,
          temporada: form.temporada,
          tipoCompra: form.tipoCompra,
          llevaCertificado: form.llevaCertificado,
          vaConAdulto: true,
          nombreAdulto: form.nombreAdulto.trim(),
          subtotal: 0,
          total: 0,
          detalle,
        },
      ])
      setDetalleActual(detalle)
      setTotalActual(0)
      return
    }

    // ── Niño / Menor solo: tarifa reducida ────────────────────────────────────
    const base = distanciaNum * TARIFA_KM
    detalle.push(`Base por distancia (${distanciaNum} km × $${TARIFA_KM.toFixed(2)}) = $${base.toFixed(2)}`)

    const descNino = base * -0.4
    detalle.push(`Descuento Junior (3–12 años) -40% = $${descNino.toFixed(2)}`)

    const claseAdj = base * CLASE_MULTIPLIER[form.clase]
    detalle.push(`Clase (${labelClase(form.clase)}) ${formatPct(CLASE_MULTIPLIER[form.clase])} = $${claseAdj.toFixed(2)}`)

    const temporadaAdj = base * TEMPORADA_MULTIPLIER[form.temporada]
    detalle.push(`Temporada (${labelTemporada(form.temporada)}) ${formatPct(TEMPORADA_MULTIPLIER[form.temporada])} = $${temporadaAdj.toFixed(2)}`)

    const compraAdj = base * COMPRA_MULTIPLIER[form.tipoCompra]
    detalle.push(`Tipo de compra (${labelCompra(form.tipoCompra)}) ${formatPct(COMPRA_MULTIPLIER[form.tipoCompra])} = $${compraAdj.toFixed(2)}`)

    let menorSoloAdj = 0
    if (categoria === 'menor-solo') {
      menorSoloAdj = base * 0.1
      detalle.push(`Recargo menor no acompañado +10% (servicio asistencia) = $${menorSoloAdj.toFixed(2)}`)
      detalle.push(`Autorización firmada: presentada`)
    } else {
      detalle.push(`Adulto acompañante: ${form.nombreAdulto} (sin recargo)`)
    }

    let certAdj = 0
    if (form.llevaCertificado && categoria === 'nino') {
      certAdj = base * -0.05
      detalle.push(`Certificado adicional -5% = $${certAdj.toFixed(2)}`)
    }

    const subtotal = base + descNino + claseAdj + temporadaAdj + compraAdj + menorSoloAdj + certAdj
    const total = Math.max(0, subtotal)

    setVentasJunior([
      ...ventasJunior,
      {
        id: Date.now(),
        nombre: form.nombre.trim(),
        edad: edadNum,
        categoria,
        distancia: distanciaNum,
        clase: form.clase,
        temporada: form.temporada,
        tipoCompra: form.tipoCompra,
        llevaCertificado: form.llevaCertificado,
        vaConAdulto: form.vaConAdulto,
        nombreAdulto: form.nombreAdulto.trim(),
        subtotal,
        total,
        detalle,
      },
    ])
    setDetalleActual(detalle)
    setTotalActual(total)
  }

  const reset = () => {
    setForm(initialForm)
    setDetalleActual([])
    setTotalActual(null)
    setError(null)
  }

  const totalJunior = ventasJunior.reduce((acc, v) => acc + v.total, 0)

  // Estadísticas simples
  let totalVendido = 0
  let bebes = 0
  let ninos = 0
  let menoresSolos = 0
  let conCertificado = 0
  let boletoMasCaro = 'N/A'
  let mayorTotal = 0
  let clasesConteo = { economica: 0, ejecutiva: 0, primera: 0 }

  for (const v of ventasJunior) {
    totalVendido += v.total
    if (v.categoria === 'bebe') bebes++
    if (v.categoria === 'nino') ninos++
    if (v.categoria === 'menor-solo') menoresSolos++
    if (v.llevaCertificado) conCertificado++
    if (v.total > mayorTotal) {
      mayorTotal = v.total
      boletoMasCaro = `${v.nombre} ($${v.total.toFixed(2)})`
    }
    clasesConteo[v.clase]++
  }

  const promedio = ventasJunior.length > 0 ? totalVendido / ventasJunior.length : 0

  let claseMasUsada = 'N/A'
  if (ventasJunior.length > 0) {
    if (clasesConteo.primera >= clasesConteo.ejecutiva && clasesConteo.primera >= clasesConteo.economica) {
      claseMasUsada = 'Primera Clase'
    } else if (clasesConteo.ejecutiva >= clasesConteo.economica) {
      claseMasUsada = 'Ejecutiva'
    } else {
      claseMasUsada = 'Económica'
    }
  }

  const edadPreview = parseNumber(form.edad)
  const categoriaPreview =
    edadPreview !== null && edadPreview >= 0 && edadPreview <= 17
      ? getCategoriaJunior(edadPreview, form.vaConAdulto)
      : null

  const mostrarPermisoNotarial = edadPreview !== null && edadPreview < 18
  const mostrarViajarConAdulto = edadPreview !== null && edadPreview < 15

  return (
    <div className="row g-4">
      {/* ── Formulario ─────────────────────────────────────────────────────── */}
      <div className="col-lg-6">
        <div className="card bg-white border border-warning border-opacity-50 shadow-sm">
          <div className="card-body">
            <h5 className="card-title mb-3">Calcular boleto Junior</h5>

            {/* Preview de categoría en tiempo real */}
            {categoriaPreview && (
              <div
                className={`alert py-2 mb-3 ${
                  categoriaPreview === 'bebe'
                    ? 'alert-success'
                    : categoriaPreview === 'menor-solo'
                    ? 'alert-warning'
                    : 'alert-info'
                }`}
              >
                <strong>Categoría:</strong> {labelCategoria(categoriaPreview)}
                {categoriaPreview === 'bebe' && ' — Viaje gratis, no ocupa asiento'}
                {categoriaPreview === 'nino' && ' — Tarifa reducida -40%, ocupa asiento'}
                {categoriaPreview === 'menor-solo' &&
                  ' — Tarifa reducida -40% + recargo asistencia +10%'}
              </div>
            )}

            {/* Alerta: permiso notarial (edad < 18) */}
            {mostrarPermisoNotarial && (
              <div className="alert alert-danger py-2 mb-3">
                <strong>Requiere permiso notarial de salida.</strong>
              </div>
            )}

            {/* Mensaje: debe viajar con adulto (edad < 15) */}
            {mostrarViajarConAdulto && (
              <div className="alert alert-warning py-2 mb-3">
                Debe viajar con un adulto responsable según políticas de la aerolínea.
              </div>
            )}

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="row g-3">
              {/* Nombre */}
              <div className="col-12">
                <label className="form-label">Nombre del niño/a</label>
                <input
                  className="form-control bg-white text-dark border-secondary"
                  value={form.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  placeholder="Nombre del pasajero Junior"
                />
              </div>

              {/* Edad y Distancia */}
              <div className="col-6">
                <label className="form-label">Edad (0–17)</label>
                <input
                  type="number"
                  className="form-control bg-white text-dark border-secondary"
                  value={form.edad}
                  onChange={(e) =>
                    handleChange('edad', e.target.value === '' ? '' : Number(e.target.value))
                  }
                  min={0}
                  max={17}
                  onKeyDown={(e) => {
                    // Bloquear si el valor resultante superaría 17
                    const current = String(form.edad)
                    const next = current === '' ? e.key : current + e.key
                    if (!isNaN(Number(e.key)) && Number(next) > 17) e.preventDefault()
                  }}
                />
              </div>
              <div className="col-6">
                <label className="form-label">Distancia (km)</label>
                <input
                  type="number"
                  className="form-control bg-white text-dark border-secondary"
                  value={form.distancia}
                  onChange={(e) =>
                    handleChange('distancia', e.target.value === '' ? '' : Number(e.target.value))
                  }
                  min={20}
                />
              </div>

              {/* Clase y Temporada — deshabilitados para bebé */}
              <div className="col-6">
                <label className="form-label">Clase</label>
                <select
                  className="form-select bg-white text-dark border-secondary"
                  value={form.clase}
                  disabled={categoriaPreview === 'bebe'}
                  onChange={(e) => handleChange('clase', e.target.value as Clase)}
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
                  disabled={categoriaPreview === 'bebe'}
                  onChange={(e) => handleChange('temporada', e.target.value as Temporada)}
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>

              {/* Tipo de compra */}
              <div className="col-6">
                <label className="form-label">Tipo de compra</label>
                <select
                  className="form-select bg-white text-dark border-secondary"
                  value={form.tipoCompra}
                  disabled={categoriaPreview === 'bebe'}
                  onChange={(e) => handleChange('tipoCompra', e.target.value as TipoCompra)}
                >
                  <option value="anticipada">Anticipada</option>
                  <option value="mismo-dia">Mismo día</option>
                </select>
              </div>

              {/* Va con adulto */}
              <div className="col-6 d-flex align-items-end pb-1">
                <div className="form-check mb-1">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="jr-adulto"
                    checked={form.vaConAdulto}
                    disabled={categoriaPreview === 'bebe' || (edadPreview !== null && edadPreview < 15)}
                    onChange={(e) => {
                      handleChange('vaConAdulto', e.target.checked)
                      if (!e.target.checked) handleChange('nombreAdulto', '')
                    }}
                  />
                  <label className="form-check-label" htmlFor="jr-adulto">
                    Va con adulto
                    {edadPreview !== null && edadPreview < 15 && (
                      <span className="badge bg-danger ms-2 small">obligatorio</span>
                    )}
                  </label>
                </div>
              </div>

              {/* Nombre del adulto */}
              {form.vaConAdulto && (
                <div className="col-12">
                  <label className="form-label">Nombre del adulto acompañante</label>
                  <input
                    className="form-control bg-white text-dark border-secondary"
                    placeholder="Nombre completo del adulto"
                    value={form.nombreAdulto}
                    onChange={(e) => handleChange('nombreAdulto', e.target.value)}
                  />
                </div>
              )}

              {/* Certificado / autorización */}
              <div className="col-12">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="jr-cert"
                    checked={form.llevaCertificado}
                    onChange={(e) => handleChange('llevaCertificado', e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="jr-cert">
                    Lleva certificado / autorización firmada
                    {categoriaPreview === 'nino' && (
                      <span className="badge bg-info text-dark ms-2 small">-5% extra</span>
                    )}
                    {categoriaPreview === 'menor-solo' && (
                      <span className="badge bg-warning text-dark ms-2 small">obligatorio</span>
                    )}
                  </label>
                </div>
                <div className="text-muted small mt-1">
                  {categoriaPreview === 'bebe' && 'Opcional: documento médico del bebé.'}
                  {categoriaPreview === 'nino' &&
                    'Opcional: da un -5% adicional sobre la tarifa base.'}
                  {categoriaPreview === 'menor-solo' &&
                    'Requerido: autorización firmada para viajar sin adulto.'}
                  {!categoriaPreview && 'Ingresa la edad para ver las condiciones.'}
                </div>
              </div>
            </div>

            <div className="d-flex gap-3 mt-4">
              <button className="btn btn-warning text-dark fw-semibold" onClick={calcular}>
                Calcular
              </button>
              <button className="btn btn-outline-secondary" onClick={reset}>
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Panel derecho ──────────────────────────────────────────────────── */}
      <div className="col-lg-6">
        {/* Detalle del cálculo */}
        <div className="card bg-white border border-success border-opacity-50 shadow-sm mb-3">
          <div className="card-body">
            <h5 className="card-title mb-3">Detalle del cálculo</h5>
            {totalActual === null ? (
              <p className="text-secondary">Realiza un cálculo para ver el detalle.</p>
            ) : (
              <div className="vstack gap-2">
                {detalleActual.map((linea, idx) => (
                  <div key={idx} className="small text-dark">
                    {linea}
                  </div>
                ))}
                <hr className="border-secondary" />
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-semibold">Total Junior</span>
                  <span className="fs-4 fw-bold text-warning">${totalActual.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabla de boletos registrados */}
        <div className="card bg-white border border-info border-opacity-50 shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="card-title mb-0">Boletos Junior ({ventasJunior.length})</h5>
              {ventasJunior.length > 0 && (
                <span className="badge bg-warning text-dark">
                  Total: ${totalJunior.toFixed(2)}
                </span>
              )}
            </div>
            {ventasJunior.length === 0 ? (
              <p className="text-secondary mb-0">Aún no hay boletos Junior registrados.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped table-sm align-middle">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Edad</th>
                      <th>Categoría</th>
                      <th>Cert.</th>
                      <th>Acomp.</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventasJunior.map((v) => (
                      <tr key={v.id}>
                        <td>{v.nombre}</td>
                        <td>{v.edad}</td>
                        <td>
                          {v.categoria === 'bebe' && (
                            <span className="badge bg-success">Bebé</span>
                          )}
                          {v.categoria === 'nino' && (
                            <span className="badge bg-info text-dark">Niño/a</span>
                          )}
                          {v.categoria === 'menor-solo' && (
                            <span className="badge bg-warning text-dark">Solo</span>
                          )}
                        </td>
                        <td>
                          {v.llevaCertificado ? (
                            <span className="badge bg-success">Sí</span>
                          ) : (
                            <span className="badge bg-secondary">No</span>
                          )}
                        </td>
                        <td>
                          {v.vaConAdulto ? (
                            <span className="badge bg-primary">{v.nombreAdulto || 'Sí'}</span>
                          ) : (
                            <span className="badge bg-warning text-dark">Solo</span>
                          )}
                        </td>
                        <td className="fw-bold">
                          {v.total === 0 ? (
                            <span className="text-success">Gratis</span>
                          ) : (
                            `$${v.total.toFixed(2)}`
                          )}
                        </td>
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
        <StatsJunior
          totalVendido={totalVendido}
          promedio={promedio}
          bebes={bebes}
          ninos={ninos}
          menoresSolos={menoresSolos}
          conCertificado={conCertificado}
          claseMasUsada={claseMasUsada}
          boletoMasCaro={boletoMasCaro}
        />
      </div>
    </div>
  )
}

function StatsJunior(props: {
  totalVendido: number
  promedio: number
  bebes: number
  ninos: number
  menoresSolos: number
  conCertificado: number
  claseMasUsada: string
  boletoMasCaro: string
}) {
  const items = [
    { label: 'Total vendido', value: `$${props.totalVendido.toFixed(2)}` },
    { label: 'Promedio por pasajero', value: `$${props.promedio.toFixed(2)}` },
    { label: 'Bebés (viaje gratis)', value: props.bebes },
    { label: 'Niños/as acompañados', value: props.ninos },
    { label: 'Menores solos', value: props.menoresSolos },
    { label: 'Con certificado', value: props.conCertificado },
    { label: 'Clase más utilizada', value: props.claseMasUsada },
    { label: 'Boleto más caro', value: props.boletoMasCaro },
  ]

  return (
    <div className="card bg-white border border-secondary shadow-sm">
      <div className="card-body">
        <h5 className="card-title mb-3">Reporte Junior</h5>
        <div className="row g-3">
          {items.map((item) => (
            <div className="col-md-3" key={item.label}>
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
