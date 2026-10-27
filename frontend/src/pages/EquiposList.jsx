import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api/client';
import HistorialModal from './HistorialModal';
import Pagination from '../components/Pagination';
import SelectOrCustomInput from '../components/SelectOrCustomInput';
import ModalFirmaActa from '../components/ModalFirmaActa';
import {
  MonitorIcon,
  UsersIcon,
  PackageIcon,
  ClockIcon,
  RotateCcwIcon,
  PrinterIcon,
  TabletIcon,
  HeadphonesIcon,
  ZapIcon,
  ArchiveIcon,
  HistoryIcon,
  SearchIcon,
  PlusIcon,
  EyeIcon,
  ArrowLeftRightIcon,
  EditIcon,
  TrashIcon,
  FileTextIcon,
  LaptopIcon,
  MapPinIcon,
  XIcon,
  CheckIcon,
  DownloadIcon,
} from '../components/Icons';

const DEFAULT_TIPOS_EQUIPO = [
  'Laptop',
  'Escritorio',
  'Todo en Uno (All-in-One)',
  'Servidor',
  'Impresora',
  'Monitor',
  'UPS',
  'Tableta',
  'Cámara',
  'Huellero',
  'Periférico',
  'Switch / Router',
  'Teléfono IP',
];

// Tipos de equipo exclusivos y contextuales según el módulo activo
const TIPOS_POR_MODULO = {
  // Equipos en Préstamo (Dotación indefinida de cómputo para puestos de trabajo)
  equipos_prestamos: [
    'Laptop',
    'Escritorio',
    'Todo en Uno (All-in-One)',
    'Monitor',
    'Tableta',
  ],
  // Préstamos temporales por días (equipos de cómputo que se llevan funcionarios)
  prestamos: [
    'Laptop',
    'Escritorio',
    'Todo en Uno (All-in-One)',
    'Monitor',
    'Tableta',
  ],
  // Devoluciones a custodia
  devoluciones: [
    'Laptop',
    'Escritorio',
    'Todo en Uno (All-in-One)',
    'Monitor',
    'Tableta',
  ],
  // Impresoras y escáneres
  impresoras: [
    'Impresora',
    'Impresora Multifuncional',
    'Impresora Térmica / POS',
    'Escáner',
    'Plotter',
  ],
  // UPS y protección eléctrica
  ups: [
    'UPS',
    'UPS Interactiva',
    'UPS Online',
    'Regulador de Voltaje',
    'Inversor',
    'Banco de Baterías',
  ],
  // Periféricos y accesorios
  perifericos: [
    'Huellero',
    'Huellero / Biométrico',
    'Cámara Web',
    'Lector de Código de Barras',
    'Teclado',
    'Mouse',
    'Diadema / Headset',
    'Base Refrigerante',
    'Periférico',
  ],
  // Elementos Tecnológicos, Red y Accesorios
  elementos: [
    'Tableta',
    'Cámaras',
    'Cámara Web',
    'Router',
    'Modem',
    'Lector de Código de Barras',
    'Biométricos',
    'Multipuertos',
    'SIM',
    'Scanner',
    'Disco Externo',
    'Antena',
    'Servidor',
    'Switch',
    'Teléfono IP',
    'Access Point',
    'Firewall',
  ],
  // Equipos en Alquiler
  alquiler: [
    'Laptop',
    'Escritorio',
    'Todo en Uno (All-in-One)',
    'Servidor',
    'Impresora',
    'Monitor',
  ],
  bajas: DEFAULT_TIPOS_EQUIPO,
  todos: DEFAULT_TIPOS_EQUIPO,
};

// Marcas especializadas por familia de hardware
const MARCAS_POR_FAMILIA = {
  computo: [
    'HP',
    'Lenovo',
    'Dell',
    'Asus',
    'Acer',
    'Apple',
    'Toshiba',
    'Compumax',
    'MSI',
    'Huawei',
    'Samsung',
  ],
  servidor: [
    'HPE / HP',
    'Dell',
    'IBM',
    'Lenovo',
    'Cisco',
    'Supermicro',
    'Oracle / Sun',
  ],
  impresora: [
    'HP',
    'Epson',
    'Canon',
    'Kyocera',
    'Zebra',
    'Brother',
    'Ricoh',
    'Lexmark',
    'Samsung',
    'Bixolon',
    'Xerox',
    'Honeywell',
    'SAT',
  ],
  ups: [
    'APC',
    'CDP',
    'Tripp Lite',
    'Forza',
    'Schneider Electric',
    'Powest',
    'Unitec',
    'Titan',
    'Vertiv',
    'Eaton',
    'Kaise',
  ],
  monitor: [
    'Samsung',
    'LG',
    'Dell',
    'HP',
    'Lenovo',
    'Philips',
    'Asus',
    'ViewSonic',
    'AOC',
    'BenQ',
    'Acer',
    'Xiaomi',
  ],
  biometrico: [
    'Futronic',
    'ZKTeco',
    'Digital Persona',
    'SecuGen',
    'Suprema',
    'Morpho',
    'Anviz',
    'Nitgen',
  ],
  periferico: [
    'Logitech',
    'Genius',
    'Microsoft',
    'Genius',
    'Mega',
    'Kodak',
    'Brother',
    'Adata',
    'Starlink',
    'Redragon',
    'Corsair',
    'Jabra',
    'Poly / Plantronics',
    'HyperX',
    'VSG',
    'Hikvision',
    'Dahua',
  ],
  redes: [
    'Mercusys',
    'Cisco',
    'Mikrotik',
    'TP-Link',
    'Ubiquiti',
    'Fortinet',
    'Aruba',
    'Grandstream',
    'Yealink',
    'Huawei',
    'D-Link',
    'Sophos',
    'WOM',
    'Movistar',
  ],
  tableta: [
    'Genius',
    'Samsung',
    'Apple',
    'Lenovo',
    'Xiaomi',
    'Huawei',
    'Zebra',
    'Amazon',
  ],
};

const DEFAULT_MARCAS = [
  'HP',
  'Lenovo',
  'Dell',
  'Asus',
  'Acer',
  'Apple',
  'Toshiba',
  'Samsung',
  'LG',
  'Epson',
  'Canon',
  'Kyocera',
  'Zebra',
  'APC',
  'CDP',
  'Tripp Lite',
  'Futronic',
  'ZKTeco',
  'Digital Persona',
  'Logitech',
  'Genius',
  'Cisco',
  'Mikrotik',
  'TP-Link',
  'Hikvision',
  'Dahua',
];

// Obtiene la lista de marcas según el tipo de equipo seleccionado
const getMarcasPorTipo = (tipo) => {
  if (!tipo) return DEFAULT_MARCAS;
  const t = tipo.toLowerCase().trim();

  if (t.includes('impresor') || t.includes('multifuncion') || t.includes('escan') || t.includes('escán') || t.includes('plotter')) {
    return MARCAS_POR_FAMILIA.impresora;
  }
  if (t.includes('ups') || t.includes('regulador') || t.includes('inversor') || t.includes('bater')) {
    return MARCAS_POR_FAMILIA.ups;
  }
  if (t.includes('huell') || t.includes('biometr') || t.includes('biométr') || t.includes('lector')) {
    return MARCAS_POR_FAMILIA.biometrico;
  }
  if (t.includes('monitor') || t.includes('pantalla')) {
    return MARCAS_POR_FAMILIA.monitor;
  }
  if (t.includes('servidor') || t.includes('server')) {
    return MARCAS_POR_FAMILIA.servidor;
  }
  if (t.includes('switch') || t.includes('router') || t.includes('red') || t.includes('telefon') || t.includes('teléfon') || t.includes('access') || t.includes('firewall')) {
    return MARCAS_POR_FAMILIA.redes;
  }
  if (t.includes('teclad') || t.includes('mouse') || t.includes('camara') || t.includes('cámara') || t.includes('diadem') || t.includes('headset') || t.includes('periferic') || t.includes('periféric')) {
    return MARCAS_POR_FAMILIA.periferico;
  }
  if (t.includes('tablet') || t.includes('celular') || t.includes('movil') || t.includes('móvil')) {
    return MARCAS_POR_FAMILIA.tableta;
  }
  if (t.includes('laptop') || t.includes('portat') || t.includes('portát') || t.includes('escritor') || t.includes('todo en uno') || t.includes('all-in-one') || t.includes('pc')) {
    return MARCAS_POR_FAMILIA.computo;
  }

  return DEFAULT_MARCAS;
};

const DEFAULT_SEDES = [
  'Américas',
  'Sede 105',
  'Sede 106',
  '68',
  'Sede 68',
  'Cota',
  'FOMAG',
  'Positiva',
  'San Rafael',
  'Brigadas',
  'Soledad',
  'FFMM',
  'Avenida Chile',
  'Bavaria',
  'Aeronáutica Civil',
  'Avon',
  'Custodia TI',
];

const DEFAULT_AREAS = [
  'Tecnología / TI',
  'Contabilidad',
  'Administración',
  'Recursos Humanos',
  'Operaciones',
  'Comercial / Ventas',
  'Gerencia',
  'Recepción',
  'Laboratorio',
  'Almacén',
  'Custodia TI',
  'Auditoría',
  'Call Center',
  'Facturación',
  'Compras',
  'Jurídica',
];

const DEFAULT_RAMS = [
  '4 GB',
  '6 GB',
  '8 GB',
  '12 GB',
  '16 GB',
  '20 GB',
  '24 GB',
  '32 GB',
  '48 GB',
  '64 GB',
  '96 GB',
  '128 GB',
];

const DEFAULT_DISCOS = [
  '120 GB SSD',
  '128 GB SSD',
  '240 GB SSD',
  '256 GB SSD',
  '480 GB SSD',
  '500 GB HDD',
  '512 GB SSD NVMe',
  '1 TB HDD',
  '1 TB SSD NVMe',
  '2 TB HDD',
  '2 TB SSD',
  '4 TB HDD',
  '6 TB HDD',
];

const DEFAULT_SISTEMAS_OPERATIVOS = [
  'Windows 11 Pro 64-bit',
  'Windows 11 Home',
  'Windows 10 Pro 64-bit',
  'Windows 10 Home',
  'Windows Server 2022',
  'Windows Server 2019',
  'Windows Server 2016',
  'Ubuntu Linux Desktop',
  'Ubuntu Server',
  'Debian GNU/Linux',
  'Red Hat Enterprise Linux',
  'macOS Sequoia / Sonoma',
  'Android',
  'Sin Sistema Operativo',
];

const INITIAL_FORM = {
  placa: '',
  nombre_equipo: '',
  tipo: 'Laptop',
  marca: '',
  modelo: '',
  serial: '',
  procesador: '',
  ram: '',
  almacenamiento: '',
  sistema_operativo: '',
  estado: 'FUNCIONAL',
  sede: '',
  area: '',
  cedula_responsable: '',
  responsable_nombre: '',
  fecha_mantenimiento: '',
  observaciones: '',
  accesorios: '',
  categoria: 'EQUIPOS_PRESTAMOS',
  modalidad: 'PROPIO',
  fecha_operacion: '',
  solicitante: '',
  recibido_por: '',
  ip: '',
  color: '',
  potencia: '',
  baterias: '',
  peso: '',
  proteccion: '',
  voltaje_entrada: '',
  voltaje_salida: '',
  disponibilidad: 'OK',
  board: '',
};

export default function EquiposList({ moduloActivo = 'todos', onSelectModulo, onNavigate }) {
  const [equipos, setEquipos] = useState([]);
  const [conteos, setConteos] = useState({});
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [sedeFiltro, setSedeFiltro] = useState('');
  const [ordenPlaca, setOrdenPlaca] = useState(''); // '' | 'asc' | 'desc'
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(50);

  // Modales
  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [equipoEditando, setEquipoEditando] = useState(null);
  const [modalBajaOpen, setModalBajaOpen] = useState(false);
  const [equipoBaja, setEquipoBaja] = useState(null);
  const [motivoBaja, setMotivoBaja] = useState('');
  const [modalPrestamoOpen, setModalPrestamoOpen] = useState(false);
  const [equipoPrestamo, setEquipoPrestamo] = useState(null);
  const [formPrestamo, setFormPrestamo] = useState({ responsable_nombre: '', cedula_responsable: '', sede: '', observaciones: '' });
  const [historialEquipo, setHistorialEquipo] = useState(null);
  const [descargandoHJ, setDescargandoHJ] = useState(null);
  const [descargandoActa, setDescargandoActa] = useState(null);

  // Estados para Modal de Firma y Descarga de Acta de Entrega
  const [modalFirmaActaOpen, setModalFirmaActaOpen] = useState(false);
  const [equipoParaActa, setEquipoParaActa] = useState(null);

  // Estados para Ventana Emergente de Hoja de Vida
  const [modalHojaVidaOpen, setModalHojaVidaOpen] = useState(false);
  const [equipoHojaVida, setEquipoHojaVida] = useState(null);
  const [formHojaVida, setFormHojaVida] = useState({});
  const [accionesHojaVida, setAccionesHojaVida] = useState([]);
  const [cargandoHojaVida, setCargandoHojaVida] = useState(false);
  const [guardandoHojaVida, setGuardandoHojaVida] = useState(false);
  const [nuevaAccion, setNuevaAccion] = useState({
    accion_realizada: 'MANTENIMIENTO PREVENTIVO',
    accion_personalizada: '',
    fecha: new Date().toISOString().slice(0, 10),
    procedimiento_realizado: '',
  });
  const [guardandoAccion, setGuardandoAccion] = useState(false);
  const [mensajeHojaVida, setMensajeHojaVida] = useState('');
  const [errorHojaVida, setErrorHojaVida] = useState('');
  const [tabHojaVida, setTabHojaVida] = useState('datos');

  // Estados para Préstamo desde Custodia (Módulo Préstamos Temporales)
  const [modalPrestarCustodiaOpen, setModalPrestarCustodiaOpen] = useState(false);
  const [equiposCustodiaDisponibles, setEquiposCustodiaDisponibles] = useState([]);
  const [equipoCustodiaSeleccionado, setEquipoCustodiaSeleccionado] = useState(null);

  // Estados para Devolución desde Préstamos (Módulo Devoluciones)
  const [modalDevolucionPrestamoOpen, setModalDevolucionPrestamoOpen] = useState(false);
  const [equiposPrestadosDisponibles, setEquiposPrestadosDisponibles] = useState([]);
  const [equipoPrestadoSeleccionado, setEquipoPrestadoSeleccionado] = useState(null);
  const [formDevolucionModal, setFormDevolucionModal] = useState({ quien_recibe: 'Custodia TI', sede: '', observaciones: '' });
  const [formData, setFormData] = useState(INITIAL_FORM);

  // Listas desplegables dinámicas combinadas con la base de datos y contextuales por módulo
  const dynamicTipos = useMemo(() => {
    const baseTipos = TIPOS_POR_MODULO[moduloActivo] || DEFAULT_TIPOS_EQUIPO;
    const set = new Set(baseTipos);

    // Si estamos editando un equipo, garantizar que su tipo actual esté en la lista
    if (equipoEditando?.tipo) {
      set.add(equipoEditando.tipo);
    }
    if (formData.tipo) {
      set.add(formData.tipo);
    }

    // Agregar tipos registrados en la base de datos para este módulo
    equipos.forEach((eq) => {
      if (eq.tipo && eq.tipo.trim()) {
        if (moduloActivo === 'todos' || moduloActivo === 'bajas') {
          set.add(eq.tipo.trim());
        } else if (moduloActivo === 'impresoras' && eq.categoria === 'IMPRESORAS') {
          set.add(eq.tipo.trim());
        } else if (moduloActivo === 'ups' && eq.categoria === 'UPS') {
          set.add(eq.tipo.trim());
        } else if (moduloActivo === 'perifericos' && eq.categoria === 'PERIFERICOS') {
          set.add(eq.tipo.trim());
        } else if (moduloActivo === 'elementos' && eq.categoria === 'ELEMENTOS') {
          set.add(eq.tipo.trim());
        } else if (moduloActivo === 'alquiler' && eq.categoria === 'ALQUILER') {
          set.add(eq.tipo.trim());
        } else if (['equipos_prestamos', 'prestamos', 'devoluciones'].includes(moduloActivo)) {
          if (eq.categoria === 'EQUIPOS_PRESTAMOS' || eq.categoria === 'PRESTAMOS') {
            const t = eq.tipo.toLowerCase();
            // Evitar que tipos que no son de cómputo/dotación aparezcan en préstamos
            if (!t.includes('ups') && !t.includes('impresora') && !t.includes('regulador')) {
              set.add(eq.tipo.trim());
            }
          }
        }
      }
    });

    return Array.from(set).filter(Boolean);
  }, [moduloActivo, equipos, equipoEditando, formData.tipo]);

  const dynamicMarcas = useMemo(() => {
    // 1. Obtener marcas específicas de la familia del tipo de equipo actual
    const baseMarcas = getMarcasPorTipo(formData.tipo);
    const set = new Set(baseMarcas);

    // 2. Conservar la marca actual si ya está asignada
    if (formData.marca && formData.marca.trim()) {
      set.add(formData.marca.trim());
    }

    // 3. Agregar marcas existentes en la BD para este tipo específico
    if (formData.tipo) {
      const tipoLower = formData.tipo.toLowerCase().trim();
      equipos.forEach((eq) => {
        if (eq.marca && eq.marca.trim() && eq.tipo) {
          const eqTipoLower = eq.tipo.toLowerCase().trim();
          if (eqTipoLower === tipoLower || eqTipoLower.includes(tipoLower) || tipoLower.includes(eqTipoLower)) {
            set.add(eq.marca.trim());
          }
        }
      });
    }

    return Array.from(set).filter(Boolean);
  }, [formData.tipo, formData.marca, equipos]);

  const dynamicSedes = useMemo(() => {
    const set = new Set(DEFAULT_SEDES);
    equipos.forEach((eq) => {
      if (eq.sede && eq.sede.trim() && eq.sede.trim().toLowerCase() !== 'sede principal') {
        set.add(eq.sede.trim());
      }
    });
    set.delete('Sede Principal');
    set.delete('SEDE PRINCIPAL');
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [equipos]);

  const dynamicAreas = useMemo(() => {
    const set = new Set(DEFAULT_AREAS);
    equipos.forEach((eq) => { if (eq.area && eq.area.trim()) set.add(eq.area.trim()); });
    return Array.from(set);
  }, [equipos]);

  const dynamicRams = useMemo(() => {
    const set = new Set(DEFAULT_RAMS);
    equipos.forEach((eq) => { if (eq.ram && eq.ram.trim()) set.add(eq.ram.trim()); });
    return Array.from(set);
  }, [equipos]);

  const dynamicDiscos = useMemo(() => {
    const set = new Set(DEFAULT_DISCOS);
    equipos.forEach((eq) => { if (eq.almacenamiento && eq.almacenamiento.trim()) set.add(eq.almacenamiento.trim()); });
    return Array.from(set);
  }, [equipos]);

  const dynamicSOs = useMemo(() => {
    const set = new Set(DEFAULT_SISTEMAS_OPERATIVOS);
    equipos.forEach((eq) => { if (eq.sistema_operativo && eq.sistema_operativo.trim()) set.add(eq.sistema_operativo.trim()); });
    return Array.from(set);
  }, [equipos]);

  const TABS_CONFIG = [
    { key: 'todos', label: 'Todos', icon: <MonitorIcon size={16} />, countKey: 'todos' },
    { key: 'equipos_prestamos', label: 'Equipos en Préstamo (Indefinido)', icon: <UsersIcon size={16} />, countKey: 'equipos_prestamos' },
    { key: 'alquiler', label: 'Alquiler', icon: <PackageIcon size={16} />, countKey: 'alquiler' },
    { key: 'prestamos', label: 'Préstamos Temporales (Por días)', icon: <ClockIcon size={16} />, countKey: 'prestamos' },
    { key: 'devoluciones', label: 'Devoluciones', icon: <RotateCcwIcon size={16} />, countKey: 'devoluciones' },
    { key: 'impresoras', label: 'Impresoras', icon: <PrinterIcon size={16} />, countKey: 'impresoras' },
    { key: 'elementos', label: 'Elementos', icon: <TabletIcon size={16} />, countKey: 'elementos' },
    { key: 'perifericos', label: 'Periféricos', icon: <HeadphonesIcon size={16} />, countKey: 'perifericos' },
    { key: 'ups', label: 'UPS', icon: <ZapIcon size={16} />, countKey: 'ups' },
    { key: 'bajas', label: 'Bajas', icon: <ArchiveIcon size={16} />, countKey: 'bajas' },
    { key: 'control_cambios', label: 'Control de Cambios', icon: <HistoryIcon size={16} />, countKey: null },
  ];

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [dataEquipos, dataConteos] = await Promise.all([
        api.getEquipos({
          busqueda,
          estado: estadoFiltro,
          tipo: tipoFiltro,
          sede: sedeFiltro,
          modulo: moduloActivo === 'todos' ? '' : moduloActivo,
          ordenPlaca,
        }),
        api.getConteos().catch(() => ({ conteos: {} })),
      ]);
      setEquipos(dataEquipos.equipos || []);
      setConteos(dataConteos.conteos || {});
      setPaginaActual(1);
    } catch (err) {
      alert('Error al cargar datos del inventario: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [moduloActivo, estadoFiltro, tipoFiltro, sedeFiltro, ordenPlaca]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    cargarDatos();
  };

  const toggleOrdenPlaca = () => {
    setOrdenPlaca((prev) => {
      if (prev === 'asc') return 'desc';
      if (prev === 'desc') return '';
      return 'asc';
    });
  };

  const handleTabClick = (tabKey) => {
    if (tabKey === 'control_cambios') {
      if (onNavigate) onNavigate('control-cambios');
      return;
    }
    setTipoFiltro('');
    if (onSelectModulo) {
      onSelectModulo(tabKey);
    }
  };

  // Ordenamiento natural (numérico y alfanumérico)
  const equiposOrdenados = useMemo(() => {
    if (!ordenPlaca) return equipos;
    return [...equipos].sort((a, b) => {
      const placaA = String(a.placa || '').trim();
      const placaB = String(b.placa || '').trim();
      const numA = parseInt(placaA, 10);
      const numB = parseInt(placaB, 10);
      const isNumA = !isNaN(numA) && String(numA) === placaA;
      const isNumB = !isNaN(numB) && String(numB) === placaB;

      if (isNumA && isNumB) {
        return ordenPlaca === 'asc' ? numA - numB : numB - numA;
      }
      return ordenPlaca === 'asc'
        ? placaA.localeCompare(placaB, undefined, { numeric: true, sensitivity: 'base' })
        : placaB.localeCompare(placaA, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [equipos, ordenPlaca]);

  // Paginación
  const totalPaginas = Math.ceil(equiposOrdenados.length / itemsPorPagina) || 1;
  const indexInicio = (paginaActual - 1) * itemsPorPagina;
  const equiposPaginados = equiposOrdenados.slice(indexInicio, indexInicio + itemsPorPagina);

  const renderSortableHeader = (label = 'Placa') => (
    <th
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
      onClick={toggleOrdenPlaca}
      title="Clic para ordenar por placa de menor a mayor o viceversa"
    >
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <span>{label}</span>
        <span style={{ fontSize: '11px', opacity: ordenPlaca ? 1 : 0.45, color: ordenPlaca ? '#38bdf8' : 'inherit' }}>
          {ordenPlaca === 'asc' ? '▲ (1-9)' : ordenPlaca === 'desc' ? '▼ (9-1)' : '⇅'}
        </span>
      </div>
    </th>
  );

  // Handlers de Formulario
  const handleOpenNuevo = () => {
    setEquipoEditando(null);
    let cat = 'EQUIPOS_PRESTAMOS';
    let mod = 'PROPIO';
    let tip = 'Laptop';
    let est = 'FUNCIONAL';

    if (moduloActivo === 'impresoras') {
      cat = 'IMPRESORAS';
      tip = 'Impresora';
    } else if (moduloActivo === 'ups') {
      cat = 'UPS';
      tip = 'UPS';
    } else if (moduloActivo === 'perifericos') {
      cat = 'PERIFERICOS';
      tip = 'Huellero';
    } else if (moduloActivo === 'elementos') {
      cat = 'ELEMENTOS';
      tip = 'Servidor';
    } else if (moduloActivo === 'alquiler') {
      cat = 'ALQUILER';
      mod = 'ALQUILER';
    } else if (moduloActivo === 'prestamos') {
      cat = 'PRESTAMOS';
      mod = 'PRESTAMO_TEMPORAL';
    } else if (moduloActivo === 'devoluciones') {
      cat = 'DEVOLUCIONES';
      mod = 'DEVOLUCION';
    } else if (moduloActivo === 'bajas') {
      cat = 'BAJAS';
      mod = 'BAJA';
      est = 'DE_BAJA';
    }

    setFormData({
      ...INITIAL_FORM,
      tipo: tip,
      categoria: cat,
      modalidad: mod,
      estado: est,
    });
    setModalFormOpen(true);
  };

  const handleOpenEditar = (eq) => {
    setEquipoEditando(eq);
    setFormData({
      placa: eq.placa || '',
      nombre_equipo: eq.nombre_equipo || '',
      tipo: eq.tipo || 'Laptop',
      marca: eq.marca || '',
      modelo: eq.modelo || '',
      serial: eq.serial || '',
      procesador: eq.procesador || '',
      ram: eq.ram || '',
      almacenamiento: eq.almacenamiento || '',
      sistema_operativo: eq.sistema_operativo || '',
      estado: eq.estado || 'FUNCIONAL',
      sede: eq.sede || '',
      area: eq.area || '',
      cedula_responsable: eq.cedula_responsable || '',
      responsable_nombre: eq.responsable_nombre || '',
      fecha_mantenimiento: eq.fecha_mantenimiento ? eq.fecha_mantenimiento.slice(0, 10) : '',
      observaciones: eq.observaciones || '',
      categoria: eq.categoria || 'EQUIPOS_PRESTAMOS',
      modalidad: eq.modalidad || 'PROPIO',
      fecha_operacion: eq.fecha_operacion ? eq.fecha_operacion.slice(0, 10) : '',
      solicitante: eq.solicitante || '',
      recibido_por: eq.recibido_por || '',
      ip: eq.ip || '',
      color: eq.color || '',
      potencia: eq.potencia || '',
      baterias: eq.baterias || '',
      peso: eq.peso || '',
      proteccion: eq.proteccion || '',
      voltaje_entrada: eq.voltaje_entrada || '',
      voltaje_salida: eq.voltaje_salida || '',
      disponibilidad: eq.disponibilidad || 'OK',
      board: eq.board || '',
    });
    setModalFormOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      if (equipoEditando) {
        await api.updateEquipo(equipoEditando.id, formData);
      } else {
        await api.createEquipo(formData);
      }
      setModalFormOpen(false);
      cargarDatos();
    } catch (err) {
      alert('Error al guardar equipo: ' + err.message);
    }
  };

  // Préstamos y Devoluciones
  const handleOpenPrestamo = (eq) => {
    setEquipoPrestamo(eq);
    setFormPrestamo({
      responsable_nombre: '',
      cedula_responsable: '',
      solicitante: '',
      sede: eq.sede || '',
      observaciones: '',
    });
    setModalPrestamoOpen(true);
  };

  const handleSubmitPrestamo = async (e) => {
    e.preventDefault();
    try {
      await api.registrarPrestamo(equipoPrestamo.id, formPrestamo);
      setModalPrestamoOpen(false);
      cargarDatos();
    } catch (err) {
      alert('Error al registrar préstamo: ' + err.message);
    }
  };

  const handleDevolucionDirecta = async (eq) => {
    const quien = prompt(`Registrar devolución de ${eq.placa} a Custodia TI. ¿Quién recibe?`, 'Almacén TI');
    if (!quien) return;
    try {
      await api.registrarDevolucion(eq.id, {
        quien_recibe: quien,
        observaciones: 'Devuelto a custodia TI',
      });
      cargarDatos();
    } catch (err) {
      alert('Error al registrar devolución: ' + err.message);
    }
  };

  // Dar de Baja
  const handleOpenBaja = (eq) => {
    setEquipoBaja(eq);
    setMotivoBaja('');
    setModalBajaOpen(true);
  };

  const handleSubmitBaja = async (e) => {
    e.preventDefault();
    if (!motivoBaja.trim()) {
      alert('Debes indicar un motivo para la baja');
      return;
    }
    try {
      await api.darDeBaja(equipoBaja.id, motivoBaja);
      setModalBajaOpen(false);
      cargarDatos();
    } catch (err) {
      alert('Error al dar de baja: ' + err.message);
    }
  };

  // Eliminar
  const handleDelete = async (eq) => {
    if (confirm(`¿Estás seguro de eliminar el equipo con placa ${eq.placa}? Esta acción no se puede deshacer.`)) {
      try {
        await api.deleteEquipo(eq.id);
        cargarDatos();
      } catch (err) {
        alert('Error al eliminar equipo: ' + err.message);
      }
    }
  };

  // Descargar Hoja de Vida oficial (.xlsx)
  const handleDescargarHojaVida = async (eq) => {
    try {
      setDescargandoHJ(eq.id);
      await api.descargarHojaDeVida(eq.id, eq.placa);
    } catch (err) {
      console.error('Error al descargar hoja de vida:', err);
      alert('No se pudo generar/descargar la Hoja de Vida: ' + err.message);
    } finally {
      setDescargandoHJ(null);
    }
  };

  // Descargar Acta de Entrega oficial (.docx)
  const handleDescargarActaEntrega = (eq) => {
    if (!eq) return;
    setEquipoParaActa(eq);
    setModalFirmaActaOpen(true);
  };

  // Abrir ventana emergente de Hoja de Vida
  const handleAbrirHojaVida = async (eq) => {
    setEquipoHojaVida(eq);
    setFormHojaVida({
      responsable_nombre: eq.responsable_nombre || '',
      cedula_responsable: eq.cedula_responsable || '',
      cargo: eq.cargo || '',
      sede: eq.sede || '',
      area: eq.area || '',
      codigo_interno: eq.codigo_interno || '',
      placa: eq.placa || '',
      tipo: eq.tipo || 'Laptop',
      marca: eq.marca || '',
      modelo: eq.modelo || '',
      serial: eq.serial || '',
      color: eq.color || '',
      board: eq.board || '',
      procesador: eq.procesador || '',
      ram: eq.ram || '',
      almacenamiento: eq.almacenamiento || '',
      sistema_operativo: eq.sistema_operativo || 'Windows 11 Pro',
      software_instalado: eq.software_instalado || '',
      accesorios: eq.accesorios || '',
      ip: eq.ip || 'DHCP',
      observaciones: eq.observaciones || '',
      estado: eq.estado || 'FUNCIONAL',
    });
    setNuevaAccion({
      accion_realizada: 'MANTENIMIENTO PREVENTIVO',
      accion_personalizada: '',
      fecha: new Date().toISOString().slice(0, 10),
      procedimiento_realizado: '',
    });
    setTabHojaVida('datos');
    setMensajeHojaVida('');
    setErrorHojaVida('');
    setModalHojaVidaOpen(true);
    setCargandoHojaVida(true);

    try {
      const res = await api.getHojaVidaDatos(eq.id);
      if (res && res.equipo) {
        setEquipoHojaVida(res.equipo);
        setFormHojaVida({
          responsable_nombre: res.equipo.responsable_nombre || '',
          cedula_responsable: res.equipo.cedula_responsable || '',
          cargo: res.equipo.cargo || res.equipo.usuario_cargo || '',
          sede: res.equipo.sede || '',
          area: res.equipo.area || '',
          codigo_interno: res.equipo.codigo_interno || '',
          placa: res.equipo.placa || '',
          tipo: res.equipo.tipo || 'Laptop',
          marca: res.equipo.marca || '',
          modelo: res.equipo.modelo || '',
          serial: res.equipo.serial || '',
          color: res.equipo.color || '',
          board: res.equipo.board || '',
          procesador: res.equipo.procesador || '',
          ram: res.equipo.ram || '',
          almacenamiento: res.equipo.almacenamiento || '',
          sistema_operativo: res.equipo.sistema_operativo || 'Windows 11 Pro',
          software_instalado: res.equipo.software_instalado || '',
          accesorios: res.equipo.accesorios || '',
          ip: res.equipo.ip || 'DHCP',
          observaciones: res.equipo.observaciones || '',
          estado: res.equipo.estado || 'FUNCIONAL',
        });
      }
      setAccionesHojaVida(res.acciones || []);
    } catch (err) {
      console.error('Error al cargar hoja de vida:', err);
      setErrorHojaVida('Error al cargar datos de la Hoja de Vida: ' + err.message);
    } finally {
      setCargandoHojaVida(false);
    }
  };

  // Guardar cambios de datos del equipo desde la Hoja de Vida
  const handleGuardarHojaVida = async (e) => {
    if (e) e.preventDefault();
    if (!equipoHojaVida) return;
    setGuardandoHojaVida(true);
    setErrorHojaVida('');
    setMensajeHojaVida('');

    try {
      const res = await api.updateHojaVida(equipoHojaVida.id, formHojaVida);
      setEquipoHojaVida(res.equipo);
      setMensajeHojaVida('Hoja de Vida guardada exitosamente');
      cargarDatos();
      setTimeout(() => setMensajeHojaVida(''), 4000);
    } catch (err) {
      console.error('Error al guardar hoja de vida:', err);
      setErrorHojaVida('Error al guardar cambios: ' + err.message);
    } finally {
      setGuardandoHojaVida(false);
    }
  };

  // Agregar nueva acción/mantenimiento a la Hoja de Vida
  const handleAgregarAccion = async (e) => {
    if (e) e.preventDefault();
    if (!equipoHojaVida) return;

    const tipoFinal =
      nuevaAccion.accion_realizada === 'OTRO'
        ? nuevaAccion.accion_personalizada.trim()
        : nuevaAccion.accion_realizada;

    if (!tipoFinal) {
      setErrorHojaVida('Por favor indica la acción realizada.');
      return;
    }
    if (!nuevaAccion.procedimiento_realizado.trim()) {
      setErrorHojaVida('Por favor describe el procedimiento realizado.');
      return;
    }

    setGuardandoAccion(true);
    setErrorHojaVida('');
    setMensajeHojaVida('');

    try {
      const res = await api.agregarAccionHojaVida(equipoHojaVida.id, {
        accion_realizada: tipoFinal,
        fecha: nuevaAccion.fecha,
        procedimiento_realizado: nuevaAccion.procedimiento_realizado.trim(),
      });
      setAccionesHojaVida((prev) => [...prev, res.accion]);
      setNuevaAccion({
        accion_realizada: 'MANTENIMIENTO PREVENTIVO',
        accion_personalizada: '',
        fecha: new Date().toISOString().slice(0, 10),
        procedimiento_realizado: '',
      });
      setMensajeHojaVida('¡Intervención registrada con éxito en la Hoja de Vida!');
      setTimeout(() => setMensajeHojaVida(''), 4000);
    } catch (err) {
      console.error('Error al registrar acción:', err);
      setErrorHojaVida('Error al agregar acción: ' + err.message);
    } finally {
      setGuardandoAccion(false);
    }
  };

  // Eliminar una acción de la Hoja de Vida
  const handleEliminarAccion = async (accionId) => {
    if (!confirm('¿Estás seguro de eliminar este registro de acción de la Hoja de Vida?')) return;
    try {
      await api.eliminarAccionHojaVida(equipoHojaVida.id, accionId);
      setAccionesHojaVida((prev) => prev.filter((a) => a.id !== accionId));
    } catch (err) {
      alert('Error al eliminar acción: ' + err.message);
    }
  };

  // Prestar equipo que se encuentra en Custodia / Almacén (Módulo Préstamos Temporales)
  const handleOpenPrestarDesdeCustodia = async () => {
    try {
      const res = await api.getEquipos();
      const todos = res.equipos || [];
      const enCustodia = todos.filter(
        (e) =>
          e.estado !== 'DE_BAJA' &&
          e.categoria !== 'UPS' &&
          (e.tipo || '').toLowerCase() !== 'ups' &&
          !(e.tipo || '').toLowerCase().includes('regulador') &&
          (e.area === 'CUSTODIA' ||
            e.responsable_nombre === 'CUSTODIA' ||
            e.categoria === 'DEVOLUCIONES' ||
            !e.responsable_nombre ||
            e.responsable_nombre === 'En Almacén' ||
            (e.categoria !== 'PRESTAMOS' && e.modalidad !== 'PRESTAMO_TEMPORAL'))
      );
      setEquiposCustodiaDisponibles(enCustodia);
      setEquipoCustodiaSeleccionado(null);
      setFormPrestamo({
        responsable_nombre: '',
        cedula_responsable: '',
        solicitante: '',
        sede: '',
        observaciones: '',
      });
      setModalPrestarCustodiaOpen(true);
    } catch (err) {
      alert('Error al consultar equipos en custodia: ' + err.message);
    }
  };

  const handleSubmitPrestarCustodia = async (e) => {
    e.preventDefault();
    if (!equipoCustodiaSeleccionado) {
      alert('Por favor selecciona el equipo en custodia que se va a prestar');
      return;
    }
    try {
      await api.registrarPrestamo(equipoCustodiaSeleccionado.id, formPrestamo);
      setModalPrestarCustodiaOpen(false);
      cargarDatos();
    } catch (err) {
      alert('Error al registrar préstamo: ' + err.message);
    }
  };

  // Devolver equipo a Custodia (Módulo Devoluciones)
  const handleOpenDevolverDesdePrestamo = async () => {
    try {
      const res = await api.getEquipos();
      const todos = res.equipos || [];
      const enPrestamo = todos.filter(
        (e) =>
          e.estado !== 'DE_BAJA' &&
          (e.categoria === 'PRESTAMOS' ||
            e.modalidad === 'PRESTAMO_TEMPORAL' ||
            (e.responsable_nombre &&
              e.responsable_nombre !== 'CUSTODIA' &&
              e.responsable_nombre !== 'En Almacén'))
      );
      setEquiposPrestadosDisponibles(enPrestamo);
      setEquipoPrestadoSeleccionado(null);
      setFormDevolucionModal({
        quien_recibe: 'Custodia TI',
        sede: '',
        observaciones: 'Equipo devuelto a Custodia TI en condiciones operativas',
      });
      setModalDevolucionPrestamoOpen(true);
    } catch (err) {
      alert('Error al consultar equipos en préstamo: ' + err.message);
    }
  };

  const handleSubmitDevolucionPrestamo = async (e) => {
    e.preventDefault();
    if (!equipoPrestadoSeleccionado) {
      alert('Por favor selecciona el equipo prestado a devolver');
      return;
    }
    try {
      await api.registrarDevolucion(equipoPrestadoSeleccionado.id, formDevolucionModal);
      setModalDevolucionPrestamoOpen(false);
      cargarDatos();
    } catch (err) {
      alert('Error al registrar devolución: ' + err.message);
    }
  };

  const getStatusClass = (estado, area, cat) => {
    if (cat === 'BAJAS' || estado === 'DE_BAJA') return 'status-badge baja';
    if (area && area.toUpperCase().includes('PREST')) return 'status-badge revisar';
    if (area && area.toUpperCase().includes('CUSTOD')) return 'status-badge funcional';
    switch (estado) {
      case 'FUNCIONAL':
        return 'status-badge funcional';
      case 'REVISAR':
        return 'status-badge revisar';
      case 'DAÑADO':
        return 'status-badge danado';
      default:
        return 'status-badge funcional';
    }
  };

  const getTituloModal = () => {
    if (equipoEditando) return `Editar Activo — ${equipoEditando.placa}`;
    const titulos = {
      todos: 'Registrar Activo Tecnológico',
      equipos_prestamos: 'Registrar Equipo Asignado (Préstamo Indefinido)',
      alquiler: 'Registrar Equipo en Alquiler',
      prestamos: 'Registrar Préstamo Temporal',
      devoluciones: 'Registrar Devolución a Custodia',
      impresoras: 'Registrar Impresora / Multifuncional',
      ups: 'Registrar Sistema UPS',
      perifericos: 'Registrar Periférico / Accesorio',
      elementos: 'Registrar Elemento Tecnológico',
      bajas: 'Registrar Activo para Baja',
    };
    return titulos[moduloActivo] || 'Registrar Activo Tecnológico';
  };

  return (
    <div className="equipos-module-container">
      {/* 1. Barra Horizontal de Módulos (Réplica de Sistema Anterior) */}
      <div className="legacy-tabs-bar">
        {TABS_CONFIG.map((tab) => {
          const isActive = moduloActivo === tab.key;
          const count = tab.countKey && conteos[tab.countKey] !== undefined ? conteos[tab.countKey] : null;
          return (
            <button
              key={tab.key}
              className={`legacy-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.key)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-text">{tab.label}</span>
              {count !== null && <span className="tab-badge">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Banner Informativo de Módulo: Equipos en Préstamo (Indefinido) vs Préstamos (Temporales) */}
      {moduloActivo === 'equipos_prestamos' && (
        <div className="module-info-banner indefinite">
          <span className="module-info-icon"><UsersIcon size={24} color="#059669" /></span>
          <div>
            <div className="module-info-title">
              Equipos en Préstamo — Dotación Indefinida a Colaboradores
            </div>
            <div className="module-info-desc">
              Equipos de la empresa asignados de manera permanente/indefinida a los empleados como dotación laboral fija para sus puestos de trabajo y funciones diarias.
            </div>
          </div>
        </div>
      )}

      {moduloActivo === 'prestamos' && (
        <div className="module-info-banner temporary">
          <span className="module-info-icon"><ClockIcon size={24} color="#d97706" /></span>
          <div>
            <div className="module-info-title">
              Préstamos Temporales — Salidas por Días con Retorno Obligatorio
            </div>
            <div className="module-info-desc">
              Equipos prestados a funcionarios por unos pocos días para contingencias o comisiones. Tienen solicitante registrado y deben ser devueltos a Custodia/Almacén TI al finalizar el plazo.
            </div>
          </div>
        </div>
      )}

      {/* 2. Barra de Filtros y Búsqueda */}
      <div className="table-controls-card">
        <form onSubmit={handleSearchSubmit} className="search-box-wrap">
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por placa, modelo, serial, responsable, área o IP..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button type="submit" className="btn-search">
            <SearchIcon size={14} /> Buscar
          </button>
        </form>

        <div className="filters-row">
          <select
            className="select-filter"
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="FUNCIONAL">Funcional</option>
            <option value="REVISAR">En Revisión</option>
            <option value="DAÑADO">Dañado</option>
            <option value="DE_BAJA">De Baja</option>
          </select>

          <select
            className="select-filter"
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
          >
            <option value="">Todos los tipos</option>
            {dynamicTipos.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            className="select-filter"
            value={sedeFiltro}
            onChange={(e) => setSedeFiltro(e.target.value)}
          >
            <option value="">Todas las sedes</option>
            {dynamicSedes.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            className="select-filter"
            value={ordenPlaca}
            onChange={(e) => setOrdenPlaca(e.target.value)}
            title="Ordenar por número o identificador de placa"
            style={{ fontWeight: ordenPlaca ? '600' : 'normal', borderColor: ordenPlaca ? '#38bdf8' : undefined }}
          >
            <option value="">Orden: Por Defecto (Recientes)</option>
            <option value="asc">Placa: Menor a Mayor (▲ 1 → 9)</option>
            <option value="desc">Placa: Mayor a Menor (▼ 9 → 1)</option>
          </select>

          {moduloActivo === 'bajas' ? null : moduloActivo === 'prestamos' ? (
            <button className="btn-primary-action" onClick={handleOpenPrestarDesdeCustodia}>
              <PlusIcon size={14} /> Prestar Equipo de Custodia
            </button>
          ) : moduloActivo === 'devoluciones' ? (
            <button className="btn-primary-action" onClick={handleOpenDevolverDesdePrestamo}>
              <RotateCcwIcon size={14} /> Registrar Devolución de Préstamo
            </button>
          ) : (
            <button className="btn-primary-action" onClick={handleOpenNuevo}>
              <PlusIcon size={14} />{' '}
              {moduloActivo === 'impresoras'
                ? 'Nueva Impresora'
                : moduloActivo === 'ups'
                ? 'Nueva UPS'
                : moduloActivo === 'perifericos'
                ? 'Nuevo Periférico'
                : moduloActivo === 'elementos'
                ? 'Nuevo Elemento'
                : moduloActivo === 'alquiler'
                ? 'Registrar Alquiler'
                : 'Nuevo Activo'}
            </button>
          )}
        </div>
      </div>

      {/* 3. Tabla Dinámica de Datos Adaptada al Módulo */}
      <div className="custom-table-wrap">
        <table className="custom-table">
          <thead>
            {moduloActivo === 'impresoras' ? (
              <tr>
                {renderSortableHeader('Placa')}
                <th>Marca / Modelo</th>
                <th>IP de Red</th>
                <th>Color</th>
                <th>Serial</th>
                <th>Sede / Área</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            ) : moduloActivo === 'ups' ? (
              <tr>
                {renderSortableHeader('Placa')}
                <th>Marca / Modelo</th>
                <th>Serial</th>
                <th>Potencia</th>
                <th>Baterías</th>
                <th>Voltaje E/S</th>
                <th>Sede / Área</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            ) : moduloActivo === 'perifericos' ? (
              <tr>
                <th>Tipo</th>
                <th>Marca / Modelo</th>
                <th>Serial</th>
                <th>Ubicación</th>
                <th>Área</th>
                <th>Disponibilidad</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            ) : moduloActivo === 'bajas' ? (
              <tr>
                {renderSortableHeader('Placa')}
                <th>Tipo</th>
                <th>Marca / Modelo</th>
                <th>Serial</th>
                <th>Fecha de Baja</th>
                <th>Motivo de Baja / Daño Reportado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            ) : moduloActivo === 'alquiler' ? (
              <tr>
                {renderSortableHeader('Placa')}
                <th>Tipo</th>
                <th>Marca / Modelo</th>
                <th>Responsable</th>
                <th>Sede / Área</th>
                <th>Quién Solicita</th>
                <th>Fecha</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            ) : moduloActivo === 'devoluciones' ? (
              <tr>
                {renderSortableHeader('Placa')}
                <th>Tipo</th>
                <th>Marca / Modelo</th>
                <th>Responsable Anterior</th>
                <th>Sede / Área</th>
                <th>Quién Recibe (TI)</th>
                <th>Fecha Devolución</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            ) : moduloActivo === 'prestamos' ? (
              <tr>
                {renderSortableHeader('Placa')}
                <th>Tipo</th>
                <th>Marca / Modelo</th>
                <th>Responsable</th>
                <th>Sede / Área</th>
                <th>Quién Solicita</th>
                <th>Fecha Préstamo</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            ) : moduloActivo === 'elementos' ? (
              <tr>
                {renderSortableHeader('Identificador')}
                <th>Tipo</th>
                <th>Marca / Modelo</th>
                <th>Serial</th>
                <th>Sede / Área</th>
                <th>Quién Solicita</th>
                <th>Accesorios / Notas</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            ) : (
              /* Columnas Estándar (Todos / Equipos en Préstamos) */
              <tr>
                {renderSortableHeader('Placa')}
                <th>Tipo</th>
                <th>Marca / Modelo</th>
                <th>Serial</th>
                <th>Sede / Área</th>
                <th>Asignado a</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            )}
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>
                  Cargando inventario tecnológico...
                </td>
              </tr>
            ) : equiposPaginados.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No se encontraron equipos registrados en este módulo con los filtros aplicados.
                </td>
              </tr>
            ) : (
              equiposPaginados.map((eq) => (
                <tr key={eq.id}>
                  {moduloActivo === 'impresoras' ? (
                    <>
                      <td><span className="placa-badge">{eq.placa}</span></td>
                      <td><b>{eq.marca}</b> <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{eq.modelo}</span></td>
                      <td>
                        <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '11.5px', fontFamily: 'var(--font-mono)' }}>
                          {eq.ip || 'Sin IP'}
                        </span>
                      </td>
                      <td>{eq.color || '—'}</td>
                      <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{eq.serial || '—'}</span></td>
                      <td>{eq.sede || '—'} - <small>{eq.area || 'General'}</small></td>
                      <td><span className="status-badge funcional">{eq.estado || 'FUNCIONAL'}</span></td>
                    </>
                  ) : moduloActivo === 'ups' ? (
                    <>
                      <td><span className="placa-badge">{eq.placa}</span></td>
                      <td><b>{eq.marca}</b> <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{eq.modelo}</span></td>
                      <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{eq.serial || '—'}</span></td>
                      <td><b>{eq.potencia || '—'}</b></td>
                      <td>{eq.baterias || '—'}</td>
                      <td style={{ fontSize: '11px' }}>{eq.voltaje_entrada || '110V'} / {eq.voltaje_salida || '110V'}</td>
                      <td>{eq.sede || '—'} - <small>{eq.area || 'General'}</small></td>
                    </>
                  ) : moduloActivo === 'perifericos' ? (
                    <>
                      <td><b>{eq.tipo || 'HUELLERO'}</b></td>
                      <td><b>{eq.marca}</b> <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{eq.modelo}</span></td>
                      <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{eq.serial || eq.placa || '—'}</span></td>
                      <td>{eq.sede || '106'}</td>
                      <td>{eq.area || 'TI'}</td>
                      <td>
                        <span className={`status-badge ${eq.disponibilidad === 'OK' ? 'funcional' : 'revisar'}`}>
                          {eq.disponibilidad || 'OK'}
                        </span>
                      </td>
                    </>
                  ) : moduloActivo === 'bajas' ? (
                    <>
                      <td><span className="placa-badge">{eq.placa}</span></td>
                      <td><b>{eq.tipo}</b></td>
                      <td><b>{eq.marca}</b> {eq.modelo}</td>
                      <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{eq.serial || '—'}</span></td>
                      <td><small>{eq.fecha_operacion ? eq.fecha_operacion.slice(0, 10) : 'Registrada'}</small></td>
                      <td className="cell-wrap-text" style={{ fontSize: '12px', color: '#b91c1c' }}>
                        {eq.observaciones || 'Desincorporado por daño irreparable u obsolescencia'}
                      </td>
                    </>
                  ) : moduloActivo === 'alquiler' ? (
                    <>
                      <td><span className="placa-badge">{eq.placa}</span></td>
                      <td><b>{eq.tipo}</b></td>
                      <td><b>{eq.marca}</b> {eq.modelo}</td>
                      <td>
                        <div><b>{eq.responsable_nombre || 'BRIGADAS'}</b></div>
                        {eq.cedula_responsable && <small style={{ color: 'var(--text-muted)' }}>C.C. {eq.cedula_responsable}</small>}
                      </td>
                      <td>{eq.sede} - <small>{eq.area}</small></td>
                      <td><b>{eq.solicitante || '—'}</b></td>
                      <td><small>{eq.fecha_operacion ? eq.fecha_operacion.slice(0, 10) : '—'}</small></td>
                    </>
                  ) : moduloActivo === 'devoluciones' ? (
                    <>
                      <td><span className="placa-badge" onClick={() => handleAbrirHojaVida(eq)} style={{ cursor: 'pointer' }} title="Clic para abrir Hoja de Vida">{eq.placa}</span></td>
                      <td><b>{eq.tipo}</b></td>
                      <td><b>{eq.marca}</b> {eq.modelo}</td>
                      <td>
                        <div><b>{eq.responsable_nombre || 'Sin nombre'}</b></div>
                        {eq.cedula_responsable && <small style={{ color: 'var(--text-muted)' }}>C.C. {eq.cedula_responsable}</small>}
                      </td>
                      <td>{eq.sede} - <small>{eq.area}</small></td>
                      <td><b>{eq.recibido_por || 'Custodia TI'}</b></td>
                      <td><small>{eq.fecha_operacion ? eq.fecha_operacion.slice(0, 10) : '—'}</small></td>
                    </>
                  ) : moduloActivo === 'prestamos' ? (
                    <>
                      <td><span className="placa-badge" onClick={() => handleAbrirHojaVida(eq)} style={{ cursor: 'pointer' }} title="Clic para abrir Hoja de Vida">{eq.placa}</span></td>
                      <td><b>{eq.tipo}</b></td>
                      <td><b>{eq.marca}</b> {eq.modelo}</td>
                      <td>
                        <div><b>{eq.responsable_nombre || 'Sin nombre'}</b></div>
                        {eq.cedula_responsable && <small style={{ color: 'var(--text-muted)' }}>C.C. {eq.cedula_responsable}</small>}
                      </td>
                      <td>{eq.sede} - <small>{eq.area}</small></td>
                      <td><b>{eq.solicitante || '—'}</b></td>
                      <td><small>{eq.fecha_operacion ? eq.fecha_operacion.slice(0, 10) : '—'}</small></td>
                    </>
                  ) : moduloActivo === 'elementos' ? (
                    <>
                      <td><span className="placa-badge" onClick={() => handleAbrirHojaVida(eq)} style={{ cursor: 'pointer' }} title="Clic para abrir Hoja de Vida">{eq.placa}</span></td>
                      <td><b>{eq.tipo}</b></td>
                      <td><b>{eq.marca}</b> <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{eq.modelo}</span></td>
                      <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{eq.serial || '—'}</span></td>
                      <td>{eq.sede || '—'} - <small>{eq.area || 'General'}</small></td>
                      <td>
                        <div><b>{eq.solicitante || eq.responsable_nombre || 'Sin Solicitar'}</b></div>
                        {eq.fecha_operacion && <small style={{ color: 'var(--text-muted)' }}>{eq.fecha_operacion.slice(0, 10)}</small>}
                      </td>
                      <td className="cell-wrap-text" style={{ fontSize: '12px' }}>
                        {eq.observaciones || '—'}
                      </td>
                      <td>
                        <span className={getStatusClass(eq.estado, eq.area, eq.categoria)}>
                          {eq.estado}
                        </span>
                      </td>
                    </>
                  ) : (
                    /* Celdas Estándar */
                    <>
                      <td><span className="placa-badge" onClick={() => handleAbrirHojaVida(eq)} style={{ cursor: 'pointer' }} title="Clic para abrir Hoja de Vida">{eq.placa}</span></td>
                      <td>{eq.tipo}</td>
                      <td><b>{eq.marca}</b> <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{eq.modelo}</span></td>
                      <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{eq.serial || '—'}</span></td>
                      <td>{eq.sede || '—'} - <small>{eq.area || 'General'}</small></td>
                      <td>
                        <div><b>{eq.responsable_nombre || 'En Almacén'}</b></div>
                        {eq.cedula_responsable && <small style={{ color: 'var(--text-muted)' }}>C.C. {eq.cedula_responsable}</small>}
                      </td>
                      <td>
                        <span className={getStatusClass(eq.estado, eq.area, eq.categoria)}>
                          {eq.estado}
                        </span>
                      </td>
                    </>
                  )}

                  <td style={{ textAlign: 'center', width: '160px', minWidth: '160px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'inline-flex', gap: '5px', alignItems: 'center', justifyContent: 'center' }}>
                      <button
                        className="btn-icon"
                        title="Ver Historial y Trazabilidad"
                        onClick={() => setHistorialEquipo(eq)}
                      >
                        <EyeIcon size={14} />
                      </button>

                      <button
                        className="btn-icon"
                        title="📄 Hoja de Vida (Ver, Editar y Descargar)"
                        onClick={() => handleAbrirHojaVida(eq)}
                        style={{ color: '#059669' }}
                      >
                        <FileTextIcon size={14} />
                      </button>

                      <button
                        className="btn-icon"
                        title="📝 Descargar Acta de Entrega con Firmas (.docx)"
                        onClick={() => handleDescargarActaEntrega(eq)}
                        style={{ color: '#0284c7' }}
                      >
                        <DownloadIcon size={14} />
                      </button>

                      {eq.estado !== 'DE_BAJA' && moduloActivo !== 'bajas' && (
                        <>
                          <button
                            className="btn-icon"
                            title="Prestar equipo"
                            onClick={() => handleOpenPrestamo(eq)}
                          >
                            <ArrowLeftRightIcon size={14} />
                          </button>
                          {eq.responsable_nombre && eq.responsable_nombre !== 'CUSTODIA' && (
                            <button
                              className="btn-icon"
                              title="Devolver a custodia"
                              onClick={() => handleDevolucionDirecta(eq)}
                            >
                              <RotateCcwIcon size={14} />
                            </button>
                          )}
                        </>
                      )}

                      <button
                        className="btn-icon"
                        title="Editar equipo"
                        onClick={() => handleOpenEditar(eq)}
                      >
                        <EditIcon size={14} />
                      </button>

                      {eq.estado !== 'DE_BAJA' && moduloActivo !== 'bajas' && (
                        <button
                          className="btn-icon warn"
                          title="Dar de baja"
                          onClick={() => handleOpenBaja(eq)}
                        >
                          <ArchiveIcon size={14} />
                        </button>
                      )}

                      <button
                        className="btn-icon danger"
                        title="Eliminar equipo"
                        onClick={() => handleDelete(eq)}
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Paginador Moderno */}
      <Pagination
        paginaActual={paginaActual}
        totalItems={equipos.length}
        itemsPorPagina={itemsPorPagina}
        onCambiarPagina={(pag) => setPaginaActual(pag)}
        onCambiarItemsPorPagina={(tamano) => setItemsPorPagina(tamano)}
        opcionesItemsPorPagina={[10, 25, 50, 100]}
      />

      {/* Modal Historial de Trazabilidad */}
      {historialEquipo && (
        <HistorialModal
          equipo={historialEquipo}
          onClose={() => setHistorialEquipo(null)}
        />
      )}

      {/* Modal Formulario Adaptativo (Crear / Editar) */}
      {modalFormOpen && (
        <div className="modal-backdrop" onClick={() => setModalFormOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <div className="modal-header-info">
                <div className="modal-header-badge">
                  <LaptopIcon size={20} color="#38bdf8" />
                </div>
                <div>
                  <h3 className="modal-title">{getTituloModal()}</h3>
                  <p className="modal-subtitle">
                    {equipoEditando
                      ? 'Actualiza las especificaciones técnicas o la asignación del activo'
                      : 'Diligencia los datos del equipo para integrarlo al inventario institucional'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setModalFormOpen(false)}
                aria-label="Cerrar modal"
              >
                <XIcon size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm}>
              <div className="modal-body">
                <div className="form-2col">
                  {/* 1. Identificación Básica */}
                <div className="form-section-header">
                  <MonitorIcon size={15} color="#38bdf8" />
                  <span>Identificación del Activo</span>
                </div>
                <div className="form-field-group">
                  <label>Placa / Identificador *</label>
                  <input
                    value={formData.placa}
                    onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
                    placeholder="Ej. HP-042 o dejar vacío para auto-asignar"
                  />
                </div>

                <SelectOrCustomInput
                  label="Tipo de Equipo"
                  required
                  value={formData.tipo}
                  onChange={(val) => {
                    setFormData((prev) => {
                      const marcasDelNuevoTipo = getMarcasPorTipo(val);
                      const marcaEsValida = marcasDelNuevoTipo.some(
                        (m) => m.toLowerCase().trim() === (prev.marca || '').toLowerCase().trim()
                      );
                      return {
                        ...prev,
                        tipo: val,
                        marca: marcaEsValida ? prev.marca : '',
                      };
                    });
                  }}
                  options={dynamicTipos}
                  placeholder="Seleccionar tipo..."
                  customPlaceholder="Ej. Laptop, Servidor, Escáner..."
                />

                <SelectOrCustomInput
                  label="Marca"
                  required
                  value={formData.marca}
                  onChange={(val) => setFormData({ ...formData, marca: val })}
                  options={dynamicMarcas}
                  placeholder={formData.tipo ? `Seleccionar marca de ${formData.tipo}...` : 'Seleccionar marca...'}
                  customPlaceholder="Ej. HP, Lenovo, Dell, Asus..."
                />

                <div className="form-field-group">
                  <label>Modelo</label>
                  <input
                    value={formData.modelo}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                    placeholder="Ej. ThinkPad T14, G4170, FS88H"
                  />
                </div>

                <div className="form-field-group">
                  <label>Serial</label>
                  <input
                    value={formData.serial}
                    onChange={(e) => setFormData({ ...formData, serial: e.target.value })}
                    placeholder="Número de serie físico"
                  />
                </div>

                <div className="form-field-group">
                  <label>Estado</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  >
                    <option value="FUNCIONAL">Funcional</option>
                    <option value="REVISAR">A Revisar</option>
                    <option value="DAÑADO">Dañado</option>
                    <option value="DE_BAJA">De Baja</option>
                  </select>
                </div>

                {/* 2. Ubicación y Responsable Asignado */}
                <div className="form-section-header">
                  <MapPinIcon size={15} color="#38bdf8" />
                  <span>Ubicación y Responsable Asignado</span>
                </div>

                <SelectOrCustomInput
                  label="Sede / Ubicación"
                  value={formData.sede}
                  onChange={(val) => setFormData({ ...formData, sede: val })}
                  options={dynamicSedes}
                  placeholder="Seleccionar sede..."
                  customPlaceholder="Ej. Américas, 105, 106, Brigadas..."
                />

                <SelectOrCustomInput
                  label="Área"
                  value={formData.area}
                  onChange={(val) => setFormData({ ...formData, area: val })}
                  options={dynamicAreas}
                  placeholder="Seleccionar área..."
                  customPlaceholder="Ej. Contabilidad, Tecnología, Operaciones..."
                />

                <div className="form-field-group">
                  <label>Cédula Responsable</label>
                  <input
                    value={formData.cedula_responsable}
                    onChange={(e) => setFormData({ ...formData, cedula_responsable: e.target.value })}
                    placeholder="Ej. 1001234567"
                  />
                </div>

                <div className="form-field-group">
                  <label>Nombre Responsable</label>
                  <input
                    value={formData.responsable_nombre}
                    onChange={(e) => setFormData({ ...formData, responsable_nombre: e.target.value })}
                    placeholder="Ej. Juan Pérez"
                  />
                </div>

                {/* Campos Especializados para Impresoras */}
                {moduloActivo === 'impresoras' && (
                  <>
                    <div className="form-field-group">
                      <label>IP de Red LAN</label>
                      <input
                        value={formData.ip}
                        onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                        placeholder="Ej. 192.168.11.50"
                      />
                    </div>
                    <div className="form-field-group">
                      <label>Color</label>
                      <input
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        placeholder="Negra, Blanca..."
                      />
                    </div>
                  </>
                )}

                {/* Campos Especializados para UPS */}
                {moduloActivo === 'ups' && (
                  <>
                    <div className="form-field-group">
                      <label>Potencia (VA/W)</label>
                      <input
                        value={formData.potencia}
                        onChange={(e) => setFormData({ ...formData, potencia: e.target.value })}
                        placeholder="Ej. 2000VA/1800W"
                      />
                    </div>
                    <div className="form-field-group">
                      <label>Baterías</label>
                      <input
                        value={formData.baterias}
                        onChange={(e) => setFormData({ ...formData, baterias: e.target.value })}
                        placeholder="Ej. 4 de 12VDC/9 Ah"
                      />
                    </div>
                    <div className="form-field-group">
                      <label>Voltaje Entrada</label>
                      <input
                        value={formData.voltaje_entrada}
                        onChange={(e) => setFormData({ ...formData, voltaje_entrada: e.target.value })}
                        placeholder="110VAC-127VAC"
                      />
                    </div>
                    <div className="form-field-group">
                      <label>Voltaje Salida</label>
                      <input
                        value={formData.voltaje_salida}
                        onChange={(e) => setFormData({ ...formData, voltaje_salida: e.target.value })}
                        placeholder="110VAC-127VAC"
                      />
                    </div>
                  </>
                )}

                {/* Campos Especializados para Periféricos */}
                {moduloActivo === 'perifericos' && (
                  <div className="form-field-group">
                    <label>Disponibilidad</label>
                    <select
                      value={formData.disponibilidad}
                      onChange={(e) => setFormData({ ...formData, disponibilidad: e.target.value })}
                    >
                      <option value="OK">OK (Disponible)</option>
                      <option value="ASIGNADO">ASIGNADO</option>
                    </select>
                  </div>
                )}

                {/* Campos para Préstamos / Alquiler / Devoluciones / Elementos */}
                {['prestamos', 'alquiler', 'devoluciones', 'elementos'].includes(moduloActivo) && (
                  <>
                    {moduloActivo !== 'elementos' && (
                      <>
                        <div className="form-field-group">
                          <label>Cédula Responsable</label>
                          <input
                            value={formData.cedula_responsable}
                            onChange={(e) => setFormData({ ...formData, cedula_responsable: e.target.value })}
                            placeholder="C.C. Colaborador"
                          />
                        </div>
                        <div className="form-field-group">
                          <label>Nombre Responsable</label>
                          <input
                            value={formData.responsable_nombre}
                            onChange={(e) => setFormData({ ...formData, responsable_nombre: e.target.value })}
                            placeholder="Nombre y apellido"
                          />
                        </div>
                      </>
                    )}
                    <div className="form-field-group">
                      <label>{moduloActivo === 'devoluciones' ? 'Quién Recibe (TI)' : 'Quién Solicita'}</label>
                      <input
                        value={moduloActivo === 'devoluciones' ? formData.recibido_por : formData.solicitante}
                        onChange={(e) =>
                          moduloActivo === 'devoluciones'
                            ? setFormData({ ...formData, recibido_por: e.target.value })
                            : setFormData({ ...formData, solicitante: e.target.value })
                        }
                        placeholder="Funcionario solicitante o receptor"
                      />
                    </div>
                    <div className="form-field-group">
                      <label>Fecha de Operación</label>
                      <input
                        type="date"
                        value={formData.fecha_operacion}
                        onChange={(e) => setFormData({ ...formData, fecha_operacion: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {/* 3. Especificaciones Técnicas Estándar para PCs, Laptops y Activos de Cómputo */}
                {(['todos', 'equipos_prestamos', 'alquiler', 'prestamos'].includes(moduloActivo) || equipoEditando) && (
                  <>
                    <div className="form-section-header">
                      <LaptopIcon size={15} color="#38bdf8" />
                      <span>Especificaciones Técnicas</span>
                    </div>

                    <div className="form-field-group">
                      <label>Procesador</label>
                      <input
                        value={formData.procesador}
                        onChange={(e) => setFormData({ ...formData, procesador: e.target.value })}
                        placeholder="Ej. Intel Core i5-1135G7"
                      />
                    </div>

                    <SelectOrCustomInput
                      label="Memoria RAM"
                      value={formData.ram}
                      onChange={(val) => setFormData({ ...formData, ram: val })}
                      options={dynamicRams}
                      placeholder="Seleccionar RAM..."
                      customPlaceholder="Ej. 16 GB, 32 GB DDR5..."
                    />

                    <SelectOrCustomInput
                      label="Disco / Almacenamiento"
                      value={formData.almacenamiento}
                      onChange={(val) => setFormData({ ...formData, almacenamiento: val })}
                      options={dynamicDiscos}
                      placeholder="Seleccionar disco..."
                      customPlaceholder="Ej. 512 GB SSD, 1 TB SSD NVMe..."
                    />

                    <SelectOrCustomInput
                      label="Sistema Operativo"
                      value={formData.sistema_operativo}
                      onChange={(val) => setFormData({ ...formData, sistema_operativo: val })}
                      options={dynamicSOs}
                      placeholder="Seleccionar Sistema Operativo..."
                      customPlaceholder="Ej. Windows 11 Pro, Ubuntu 24.04..."
                    />
                  </>
                )}

                {/* 4. Observaciones y Accesorios */}
                <div className="form-section-header">
                  <FileTextIcon size={15} color="#38bdf8" />
                  <span>Observaciones y Accesorios</span>
                </div>

                <div className="form-field-group full-width" style={{ marginBottom: '10px' }}>
                  <label>Accesorios Entregados (Opcional, para Acta de Entrega)</label>
                  <input
                    type="text"
                    value={formData.accesorios || ''}
                    onChange={(e) => setFormData({ ...formData, accesorios: e.target.value })}
                    placeholder="Ej. Cargador original, Mouse, Maletín (dejar vacío si no aplica)..."
                  />
                </div>

                <div className="form-field-group full-width">
                  <label>
                    {moduloActivo === 'bajas' ? 'Motivo Detallado de Baja / Daño Reportado *' : 'Observaciones Generales'}
                  </label>
                  <textarea
                    rows="3"
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    placeholder={moduloActivo === 'bajas' ? 'Describir la falla irreparable...' : 'Observaciones generales del equipo...'}
                  />
                </div>
              </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={() => setModalFormOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-modal-submit">
                  {equipoEditando ? 'Guardar Cambios' : 'Registrar Activo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Préstamo */}
      {modalPrestamoOpen && (
        <div className="modal-backdrop" onClick={() => setModalPrestamoOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Préstamo Temporal: {equipoPrestamo?.placa}</h3>
              <button className="btn-icon" onClick={() => setModalPrestamoOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitPrestamo}>
              <div className="modal-body">
                <div className="form-2col" style={{ gridTemplateColumns: '1fr' }}>
                  <div style={{ background: 'var(--warn-light)', border: '1px solid var(--warn)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: 'var(--text-main)', lineHeight: 1.4 }}>
                    ⏳ <b>Préstamo Temporal (Por Días):</b> Este equipo se registrará como préstamo temporal por unos días y requerirá retorno a Custodia/Almacén TI. (Las asignaciones indefinidas para puestos de trabajo se gestionan como <i>Equipos en Préstamo</i>).
                  </div>
                  <div className="form-field-group">
                    <label>Nombre del Responsable * (Quién se lleva el equipo)</label>
                    <input
                      required
                      value={formPrestamo.responsable_nombre}
                      onChange={(e) => setFormPrestamo({ ...formPrestamo, responsable_nombre: e.target.value })}
                      placeholder="Nombre y Apellido del funcionario"
                    />
                  </div>
                  <div className="form-field-group">
                    <label>Cédula de Identidad *</label>
                    <input
                      required
                      value={formPrestamo.cedula_responsable}
                      onChange={(e) => setFormPrestamo({ ...formPrestamo, cedula_responsable: e.target.value })}
                      placeholder="Ej. 1001234567"
                    />
                  </div>
                  <div className="form-field-group">
                    <label>Quién Solicita (Funcionario / Área / Jefe)</label>
                    <input
                      value={formPrestamo.solicitante}
                      onChange={(e) => setFormPrestamo({ ...formPrestamo, solicitante: e.target.value })}
                      placeholder="Ej. Coordinación Administrativa / Dra. Marcela"
                    />
                  </div>
                  <SelectOrCustomInput
                    label="Sede de Entrega"
                    value={formPrestamo.sede}
                    onChange={(val) => setFormPrestamo({ ...formPrestamo, sede: val })}
                    options={dynamicSedes}
                    placeholder="Seleccionar sede..."
                    customPlaceholder="Ej. Américas, 106, Brigadas..."
                  />

                  <div className="form-field-group">
                    <label>Observaciones y Tiempo Estimado de Préstamo</label>
                    <textarea
                      rows="3"
                      value={formPrestamo.observaciones}
                      onChange={(e) => setFormPrestamo({ ...formPrestamo, observaciones: e.target.value })}
                      placeholder="Días de préstamo estimados, motivo de la comisión o contingencia, accesorios entregados..."
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalPrestamoOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirmar Préstamo Temporal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Préstamo Escogiendo de Custodia (Módulo Préstamos Temporales) */}
      {modalPrestarCustodiaOpen && (
        <div className="modal-backdrop" onClick={() => setModalPrestarCustodiaOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                📦 Asignar Préstamo Temporal desde Custodia / Almacén
              </h3>
              <button className="btn-icon" onClick={() => setModalPrestarCustodiaOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitPrestarCustodia}>
              <div className="modal-body">
                <div className="form-2col" style={{ gridTemplateColumns: '1fr' }}>
                  <div style={{ background: 'rgba(2, 132, 199, 0.1)', border: '1px solid #0284c7', borderRadius: '10px', padding: '12px 14px', fontSize: '12.5px', color: 'var(--text-main)', lineHeight: 1.45 }}>
                    💡 <b>Selección de Activo:</b> Escoge un equipo disponible en Custodia / Almacén TI para asignarlo en calidad de préstamo temporal por unos días.
                  </div>

                  <div className="form-field-group">
                    <label>Seleccionar Equipo Disponible en Custodia *</label>
                    <select
                      required
                      value={equipoCustodiaSeleccionado?.id || ''}
                      onChange={(e) => {
                        const eq = equiposCustodiaDisponibles.find((x) => String(x.id) === e.target.value);
                        setEquipoCustodiaSeleccionado(eq || null);
                        if (eq?.sede) {
                          setFormPrestamo((prev) => ({ ...prev, sede: eq.sede, area: eq.area || '' }));
                        }
                      }}
                    >
                      <option value="">-- Seleccionar equipo ({equiposCustodiaDisponibles.length} disponibles) --</option>
                      {equiposCustodiaDisponibles.map((eq) => (
                        <option key={eq.id} value={eq.id}>
                          [{eq.placa}] {eq.marca} {eq.modelo || ''} - {eq.tipo} (Sede: {eq.sede || 'Sin sede'} | Serial: {eq.serial || 'S/N'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {equipoCustodiaSeleccionado && (
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 16px', fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div><b>Placa:</b> <span className="placa-badge">{equipoCustodiaSeleccionado.placa}</span> — <b>{equipoCustodiaSeleccionado.marca}</b> {equipoCustodiaSeleccionado.modelo}</div>
                      <div style={{ color: 'var(--text-muted)' }}><b>Tipo:</b> {equipoCustodiaSeleccionado.tipo} | <b>Serial:</b> {equipoCustodiaSeleccionado.serial || 'S/N'} | <b>Sede:</b> {equipoCustodiaSeleccionado.sede || 'Almacén Central'}</div>
                    </div>
                  )}

                  <div className="form-field-group">
                    <label>Nombre del Responsable * (Quién se lleva el equipo)</label>
                    <input
                      required
                      value={formPrestamo.responsable_nombre}
                      onChange={(e) => setFormPrestamo({ ...formPrestamo, responsable_nombre: e.target.value })}
                      placeholder="Nombre y Apellido del funcionario"
                    />
                  </div>

                  <div className="form-field-group">
                    <label>Cédula del Responsable *</label>
                    <input
                      required
                      value={formPrestamo.cedula_responsable}
                      onChange={(e) => setFormPrestamo({ ...formPrestamo, cedula_responsable: e.target.value })}
                      placeholder="Ej. 1001234567"
                    />
                  </div>

                  <div className="form-field-group">
                    <label>Quién Solicita (Jefe / Área / Solicitante)</label>
                    <input
                      value={formPrestamo.solicitante}
                      onChange={(e) => setFormPrestamo({ ...formPrestamo, solicitante: e.target.value })}
                      placeholder="Ej. Coordinación Administrativa"
                    />
                  </div>

                  <SelectOrCustomInput
                    label="Sede de Destino"
                    value={formPrestamo.sede}
                    onChange={(val) => setFormPrestamo({ ...formPrestamo, sede: val })}
                    options={dynamicSedes}
                    placeholder="Seleccionar sede..."
                    customPlaceholder="Ej. Américas, 105, 106..."
                  />

                  <div className="form-field-group">
                    <label>Observaciones y Tiempo Estimado de Préstamo</label>
                    <textarea
                      rows="3"
                      value={formPrestamo.observaciones}
                      onChange={(e) => setFormPrestamo({ ...formPrestamo, observaciones: e.target.value })}
                      placeholder="Días de préstamo estimados, motivo de la comisión o contingencia, accesorios entregados..."
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalPrestarCustodiaOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={!equipoCustodiaSeleccionado}>
                  Confirmar Préstamo Temporal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Devolver Equipo a Custodia (Módulo Devoluciones) */}
      {modalDevolucionPrestamoOpen && (
        <div className="modal-backdrop" onClick={() => setModalDevolucionPrestamoOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                🔄 Registrar Devolución de Equipo a Custodia TI
              </h3>
              <button className="btn-icon" onClick={() => setModalDevolucionPrestamoOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitDevolucionPrestamo}>
              <div className="modal-body">
                <div className="form-2col" style={{ gridTemplateColumns: '1fr' }}>
                  <div style={{ background: 'rgba(5, 150, 105, 0.1)', border: '1px solid #059669', borderRadius: '10px', padding: '12px 14px', fontSize: '12.5px', color: 'var(--text-main)', lineHeight: 1.45 }}>
                    📋 <b>Recepción de Préstamo:</b> Selecciona el equipo que se encontraba prestado para reintegrarlo al inventario disponible de Custodia / Almacén TI.
                  </div>

                  <div className="form-field-group">
                    <label>Seleccionar Equipo Prestado a Devolver *</label>
                    <select
                      required
                      value={equipoPrestadoSeleccionado?.id || ''}
                      onChange={(e) => {
                        const eq = equiposPrestadosDisponibles.find((x) => String(x.id) === e.target.value);
                        setEquipoPrestadoSeleccionado(eq || null);
                        if (eq?.sede) {
                          setFormDevolucionModal((prev) => ({ ...prev, sede: eq.sede }));
                        }
                      }}
                    >
                      <option value="">-- Seleccionar equipo ({equiposPrestadosDisponibles.length} en préstamo) --</option>
                      {equiposPrestadosDisponibles.map((eq) => (
                        <option key={eq.id} value={eq.id}>
                          [{eq.placa}] {eq.marca} {eq.modelo || ''} - Actualmente con: {eq.responsable_nombre || 'Sin nombre'} (Sede: {eq.sede || '—'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {equipoPrestadoSeleccionado && (
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 16px', fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div><b>Placa:</b> <span className="placa-badge">{equipoPrestadoSeleccionado.placa}</span> — <b>{equipoPrestadoSeleccionado.marca}</b> {equipoPrestadoSeleccionado.modelo}</div>
                      <div style={{ color: 'var(--text-muted)' }}>
                        <b>Prestado a:</b> {equipoPrestadoSeleccionado.responsable_nombre || 'Funcionario'} {equipoPrestadoSeleccionado.cedula_responsable ? `(C.C. ${equipoPrestadoSeleccionado.cedula_responsable})` : ''} | <b>Sede:</b> {equipoPrestadoSeleccionado.sede || '—'}
                      </div>
                    </div>
                  )}

                  <div className="form-field-group">
                    <label>Quién Recibe en Custodia / TI *</label>
                    <input
                      required
                      value={formDevolucionModal.quien_recibe}
                      onChange={(e) => setFormDevolucionModal({ ...formDevolucionModal, quien_recibe: e.target.value })}
                      placeholder="Nombre de funcionario TI que recibe"
                    />
                  </div>

                  <SelectOrCustomInput
                    label="Sede / Almacén de Ingreso"
                    value={formDevolucionModal.sede}
                    onChange={(val) => setFormDevolucionModal({ ...formDevolucionModal, sede: val })}
                    options={dynamicSedes}
                    placeholder="Seleccionar sede de custodia..."
                    customPlaceholder="Ej. Américas, Sede 106..."
                  />

                  <div className="form-field-group">
                    <label>Observaciones de Devolución</label>
                    <textarea
                      rows="3"
                      value={formDevolucionModal.observaciones}
                      onChange={(e) => setFormDevolucionModal({ ...formDevolucionModal, observaciones: e.target.value })}
                      placeholder="Estado físico al devolver, accesorios entregados, novedades técnicas..."
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalDevolucionPrestamoOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={!equipoPrestadoSeleccionado}>
                  Confirmar Retorno a Custodia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dar de Baja */}
      {modalBajaOpen && (
        <div className="modal-backdrop" onClick={() => setModalBajaOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#b91c1c' }}>
                ⚠️ Confirmar Baja Definitiva: {equipoBaja?.placa}
              </h3>
              <button className="btn-icon" onClick={() => setModalBajaOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitBaja}>
              <div className="modal-body">
                <div style={{ padding: '4px 0 16px 0', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Esta acción desincorporará el activo del inventario operativo marcándolo con estado <b>DE_BAJA</b> y registrando un evento de auditoría formal.
                </div>
                <div className="form-field-group">
                  <label>Motivo Técnico de la Baja *</label>
                  <textarea
                    required
                    rows="4"
                    value={motivoBaja}
                    onChange={(e) => setMotivoBaja(e.target.value)}
                    placeholder="Explica la causa técnica (ej. cortocircuito en placa, rotura irreparable de pantalla, obsolescencia tecnológica)..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalBajaOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-danger">
                  Dar de Baja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ventana Emergente de Hoja de Vida */}
      {modalHojaVidaOpen && equipoHojaVida && (
        <div className="modal-backdrop" onClick={() => setModalHojaVidaOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '880px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Cabecera del Modal */}
            <div className="modal-header" style={{ alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(5, 150, 105, 0.12)', padding: '10px', borderRadius: 'var(--radius)', color: '#059669', display: 'flex' }}>
                  <FileTextIcon size={24} />
                </div>
                <div>
                  <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span>Hoja de Vida: {equipoHojaVida.placa || 'Sin Placa'}</span>
                    <span className="badge badge-funcional" style={{ fontSize: '11px' }}>
                      {equipoHojaVida.marca} {equipoHojaVida.modelo}
                    </span>
                    <span className={getStatusClass(equipoHojaVida.estado, equipoHojaVida.area, equipoHojaVida.categoria)} style={{ fontSize: '11px' }}>
                      {equipoHojaVida.estado}
                    </span>
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Sede: <b>{equipoHojaVida.sede || 'Sin Sede'}</b> · Área: <b>{equipoHojaVida.area || 'Sin Área'}</b> · Serial: <b>{equipoHojaVida.serial || '—'}</b>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleDescargarActaEntrega(equipoHojaVida)}
                  disabled={descargandoActa === equipoHojaVida.id}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', padding: '6px 12px' }}
                  title="Descargar Acta de Entrega oficial en formato Word (.docx)"
                >
                  <FileTextIcon size={14} /> {descargandoActa === equipoHojaVida.id ? 'Generando...' : 'Descargar Acta (Word)'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleDescargarHojaVida(equipoHojaVida)}
                  disabled={descargandoHJ === equipoHojaVida.id}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', padding: '6px 12px' }}
                  title="Descargar Hoja de Vida oficial FRMA-01 en Excel (.xlsx)"
                >
                  <DownloadIcon size={14} /> {descargandoHJ === equipoHojaVida.id ? 'Generando...' : 'Descargar Excel'}
                </button>
                <button className="btn-icon" onClick={() => setModalHojaVidaOpen(false)} title="Cerrar ventana">
                  ✕
                </button>
              </div>
            </div>

            {/* Pestañas de Navegación del Modal */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-app)', padding: '0 16px' }}>
              <button
                type="button"
                onClick={() => setTabHojaVida('datos')}
                style={{
                  padding: '10px 16px',
                  fontWeight: 600,
                  fontSize: '13px',
                  border: 'none',
                  background: 'none',
                  borderBottom: tabHojaVida === 'datos' ? '2px solid var(--primary)' : '2px solid transparent',
                  color: tabHojaVida === 'datos' ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <EditIcon size={14} /> Ficha Técnica & Asignación
              </button>
              <button
                type="button"
                onClick={() => setTabHojaVida('acciones')}
                style={{
                  padding: '10px 16px',
                  fontWeight: 600,
                  fontSize: '13px',
                  border: 'none',
                  background: 'none',
                  borderBottom: tabHojaVida === 'acciones' ? '2px solid var(--primary)' : '2px solid transparent',
                  color: tabHojaVida === 'acciones' ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <ClockIcon size={14} /> Acciones y Mantenimientos ({accionesHojaVida.length})
              </button>
            </div>

            {/* Mensajes de Notificación */}
            {mensajeHojaVida && (
              <div style={{ margin: '12px 18px 0 18px', padding: '10px 14px', background: 'rgba(16, 185, 129, 0.12)', color: '#065f46', borderRadius: 'var(--radius)', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckIcon size={15} color="#059669" /> {mensajeHojaVida}
              </div>
            )}
            {errorHojaVida && (
              <div style={{ margin: '12px 18px 0 18px', padding: '10px 14px', background: 'rgba(239, 68, 68, 0.12)', color: '#991b1b', borderRadius: 'var(--radius)', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⚠️</span> {errorHojaVida}
              </div>
            )}

            {/* Cuerpo del Modal (Scrollable) */}
            <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '18px' }}>
              {cargandoHojaVida ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  Cargando datos de la Hoja de Vida...
                </div>
              ) : tabHojaVida === 'datos' ? (
                /* TAB 1: Edición de Datos Técnicos y Asignación */
                <form onSubmit={handleGuardarHojaVida}>
                  {/* Bloque 1: Asignación y Ubicación */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                      1. Asignación, Responsable y Ubicación
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                      <div className="form-field-group">
                        <label>Responsable Actual</label>
                        <input
                          type="text"
                          value={formHojaVida.responsable_nombre || ''}
                          onChange={(e) => setFormHojaVida({ ...formHojaVida, responsable_nombre: e.target.value })}
                          placeholder="Nombre del funcionario"
                        />
                      </div>
                      <div className="form-field-group">
                        <label>Cédula Responsable</label>
                        <input
                          type="text"
                          value={formHojaVida.cedula_responsable || ''}
                          onChange={(e) => setFormHojaVida({ ...formHojaVida, cedula_responsable: e.target.value })}
                          placeholder="Número de C.C."
                        />
                      </div>
                      <div className="form-field-group">
                        <label>Cargo del Funcionario</label>
                        <input
                          type="text"
                          value={formHojaVida.cargo || ''}
                          onChange={(e) => setFormHojaVida({ ...formHojaVida, cargo: e.target.value })}
                          placeholder="Ej: Analista, Coordinador, Asesor"
                        />
                      </div>
                      <div className="form-field-group">
                        <label>Sede</label>
                        <input
                          type="text"
                          list="lista-sedes-hj"
                          value={formHojaVida.sede || ''}
                          onChange={(e) => setFormHojaVida({ ...formHojaVida, sede: e.target.value })}
                          placeholder="Sede de operación"
                        />
                        <datalist id="lista-sedes-hj">
                          {Array.from(dynamicSedes).map((s) => (
                            <option key={s} value={s} />
                          ))}
                        </datalist>
                      </div>
                      <div className="form-field-group">
                        <label>Área / Departamento</label>
                        <input
                          type="text"
                          value={formHojaVida.area || ''}
                          onChange={(e) => setFormHojaVida({ ...formHojaVida, area: e.target.value })}
                          placeholder="Área o dependencia"
                        />
                      </div>
                      <div className="form-field-group">
                        <label>Código Interno</label>
                        <input
                          type="text"
                          value={formHojaVida.codigo_interno || ''}
                          onChange={(e) => setFormHojaVida({ ...formHojaVida, codigo_interno: e.target.value })}
                          placeholder="Código de inventario interno"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bloque 2: Ficha Técnica de Hardware */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                      2. Especificaciones Técnicas del Equipo
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                      <div className="form-field-group">
                        <label>Placa del Activo</label>
                        <input
                          type="text"
                          value={formHojaVida.placa || ''}
                          onChange={(e) => setFormHojaVida({ ...formHojaVida, placa: e.target.value })}
                          placeholder="Número de Placa"
                        />
                      </div>
                      <div className="form-field-group">
                        <label>Tipo de Equipo</label>
                        <select
                          value={formHojaVida.tipo || 'Laptop'}
                          onChange={(e) => setFormHojaVida({ ...formHojaVida, tipo: e.target.value })}
                        >
                          {DEFAULT_TIPOS_EQUIPO.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-field-group">
                        <label>Marca</label>
                        <input
                          type="text"
                          value={formHojaVida.marca || ''}
                          onChange={(e) => setFormHojaVida({ ...formHojaVida, marca: e.target.value })}
                        />
                      </div>
                      <div className="form-field-group">
                        <label>Modelo</label>
                        <input
                          type="text"
                          value={formHojaVida.modelo || ''}
                          onChange={(e) => setFormHojaVida({ ...formHojaVida, modelo: e.target.value })}
                        />
                      </div>
                      <div className="form-field-group">
                        <label>Serial</label>
                        <input
                          type="text"
                          value={formHojaVida.serial || ''}
                          onChange={(e) => setFormHojaVida({ ...formHojaVida, serial: e.target.value })}
                        />
                      </div>
                      <div className="form-field-group">
                        <label>Color del Activo</label>
                        <input
                          type="text"
                          value={formHojaVida.color || ''}
                          onChange={(e) => setFormHojaVida({ ...formHojaVida, color: e.target.value })}
                          placeholder="Ej: Negro, Gris espacial, Plateado"
                        />
                      </div>
                      <div className="form-field-group">
                        <label>Board / Tarjeta Madre</label>
                        <input
                          type="text"
                          value={formHojaVida.board || ''}
                          onChange={(e) => setFormHojaVida({ ...formHojaVida, board: e.target.value })}
                          placeholder="Modelo de motherboard"
                        />
                      </div>
                      <div className="form-field-group">
                        <label>Procesador</label>
                        <input
                          type="text"
                          value={formHojaVida.procesador || ''}
                          onChange={(e) => setFormHojaVida({ ...formHojaVida, procesador: e.target.value })}
                          placeholder="Ej: Core i5-1135G7 @ 2.40GHz"
                        />
                      </div>
                      <div className="form-field-group">
                        <label>Memoria RAM</label>
                        <input
                          type="text"
                          value={formHojaVida.ram || ''}
                          onChange={(e) => setFormHojaVida({ ...formHojaVida, ram: e.target.value })}
                          placeholder="Ej: 8 GB DDR4, 16 GB"
                        />
                      </div>
                      <div className="form-field-group">
                        <label>Disco / Almacenamiento</label>
                        <input
                          type="text"
                          value={formHojaVida.almacenamiento || ''}
                          onChange={(e) => setFormHojaVida({ ...formHojaVida, almacenamiento: e.target.value })}
                          placeholder="Ej: 512 GB SSD NVMe"
                        />
                      </div>
                      <div className="form-field-group">
                        <label>Sistema Operativo</label>
                        <input
                          type="text"
                          value={formHojaVida.sistema_operativo || ''}
                          onChange={(e) => setFormHojaVida({ ...formHojaVida, sistema_operativo: e.target.value })}
                          placeholder="Ej: Windows 11 Pro 64-bit"
                        />
                      </div>
                      <div className="form-field-group">
                        <label>Dirección IP / Red</label>
                        <input
                          type="text"
                          value={formHojaVida.ip || ''}
                          onChange={(e) => setFormHojaVida({ ...formHojaVida, ip: e.target.value })}
                          placeholder="DHCP o IP fija"
                        />
                      </div>
                      <div className="form-field-group">
                        <label>Estado Operativo</label>
                        <select
                          value={formHojaVida.estado || 'FUNCIONAL'}
                          onChange={(e) => setFormHojaVida({ ...formHojaVida, estado: e.target.value })}
                        >
                          <option value="FUNCIONAL">FUNCIONAL</option>
                          <option value="REVISAR">REVISAR</option>
                          <option value="DAÑADO">DAÑADO</option>
                          <option value="DE_BAJA">DE_BAJA</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-field-group" style={{ marginTop: '12px' }}>
                      <label>Software Instalado / Licencias (Listado que saldrá en la columna SOFTWARE del Excel)</label>
                      <textarea
                        rows="3"
                        value={formHojaVida.software_instalado || ''}
                        onChange={(e) => setFormHojaVida({ ...formHojaVida, software_instalado: e.target.value })}
                        placeholder="Ejemplo:
Microsoft Office 2021 LTSC
Adobe Acrobat Reader DC
Google Chrome / Mozilla Firefox
Antivirus ESET Endpoint Security
VPN FortiClient"
                      />
                    </div>
                  </div>

                  {/* Bloque 3: Accesorios y Observaciones */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                      3. Accesorios y Observaciones Generales
                    </div>
                    <div className="form-field-group" style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Accesorios Entregados (para Acta de Entrega)</label>
                      <input
                        type="text"
                        className="select-filter"
                        style={{ width: '100%' }}
                        value={formHojaVida.accesorios || ''}
                        onChange={(e) => setFormHojaVida({ ...formHojaVida, accesorios: e.target.value })}
                        placeholder="Ej. Cargador original, Mouse, Maletín (dejar vacío si no aplica)..."
                      />
                    </div>
                    <div className="form-field-group">
                      <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Observaciones Generales</label>
                      <textarea
                        rows="2"
                        value={formHojaVida.observaciones || ''}
                        onChange={(e) => setFormHojaVida({ ...formHojaVida, observaciones: e.target.value })}
                        placeholder="Observaciones de estado físico o condición general del equipo..."
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={guardandoHojaVida}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <CheckIcon size={14} /> {guardandoHojaVida ? 'Guardando...' : 'Guardar Cambios de la Hoja de Vida'}
                    </button>
                  </div>
                </form>
              ) : (
                /* TAB 2: Historial de Acciones y Mantenimientos */
                <div>
                  {/* Formulario para Registrar Nueva Acción */}
                  <div className="card" style={{ padding: '16px', marginBottom: '20px', background: 'var(--bg-app)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <PlusIcon size={16} color="var(--primary)" />
                      <span>Registrar Acción, Mantenimiento o Actualización</span>
                    </div>

                    <form onSubmit={handleAgregarAccion}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                        <div className="form-field-group">
                          <label>Acción Realizada *</label>
                          <select
                            value={nuevaAccion.accion_realizada}
                            onChange={(e) => setNuevaAccion({ ...nuevaAccion, accion_realizada: e.target.value })}
                          >
                            <option value="MANTENIMIENTO PREVENTIVO">MANTENIMIENTO PREVENTIVO</option>
                            <option value="MANTENIMIENTO CORRECTIVO">MANTENIMIENTO CORRECTIVO</option>
                            <option value="ACTUALIZACIÓN DE HARDWARE">ACTUALIZACIÓN DE HARDWARE</option>
                            <option value="ACTUALIZACIÓN DE SOFTWARE">ACTUALIZACIÓN DE SOFTWARE</option>
                            <option value="FORMATEO / REINSTALACIÓN">FORMATEO / REINSTALACIÓN</option>
                            <option value="CAMBIO DE CUSTODIA / ASIGNACIÓN">CAMBIO DE CUSTODIA / ASIGNACIÓN</option>
                            <option value="REVISIÓN TÉCNICA / DIAGNÓSTICO">REVISIÓN TÉCNICA / DIAGNÓSTICO</option>
                            <option value="ELABORACIÓN">ELABORACIÓN</option>
                            <option value="OTRO">OTRO (Personalizado)</option>
                          </select>
                        </div>

                        {nuevaAccion.accion_realizada === 'OTRO' && (
                          <div className="form-field-group">
                            <label>Escribe el Tipo de Acción *</label>
                            <input
                              type="text"
                              required
                              value={nuevaAccion.accion_personalizada}
                              onChange={(e) => setNuevaAccion({ ...nuevaAccion, accion_personalizada: e.target.value })}
                              placeholder="Ej: Cambio de batería"
                            />
                          </div>
                        )}

                        <div className="form-field-group">
                          <label>Fecha de la Intervención *</label>
                          <input
                            type="date"
                            required
                            value={nuevaAccion.fecha}
                            onChange={(e) => setNuevaAccion({ ...nuevaAccion, fecha: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="form-field-group" style={{ marginBottom: '14px' }}>
                        <label>Procedimiento Realizado (Detalle de lo que se le hizo al equipo) *</label>
                        <textarea
                          required
                          rows="3"
                          value={nuevaAccion.procedimiento_realizado}
                          onChange={(e) => setNuevaAccion({ ...nuevaAccion, procedimiento_realizado: e.target.value })}
                          placeholder="Ejemplo: Se realiza limpieza interna de ventiladores, cambio de pasta térmica, actualización de drivers y escaneo antivirus..."
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={guardandoAccion}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <PlusIcon size={14} /> {guardandoAccion ? 'Registrando...' : 'Agregar Intervención'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Tabla de Intervenciones Registradas */}
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '10px' }}>
                    Historial de Intervenciones Registradas ({accionesHojaVida.length})
                  </div>

                  {accionesHojaVida.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-app)', borderRadius: 'var(--radius)', border: '1px dashed var(--border)', color: 'var(--text-muted)', fontSize: '13px' }}>
                      No hay intervenciones o mantenimientos registrados aún para este equipo.
                      <div style={{ fontSize: '11.5px', marginTop: '4px' }}>
                        Al descargar la Hoja de Vida en Excel, se incluirá automáticamente la fila inicial de <b>ELABORACIÓN</b>.
                      </div>
                    </div>
                  ) : (
                    <div className="table-responsive" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                      <table className="table" style={{ margin: 0 }}>
                        <thead>
                          <tr>
                            <th style={{ width: '220px' }}>Acción Realizada</th>
                            <th style={{ width: '110px' }}>Fecha</th>
                            <th>Procedimiento Realizado</th>
                            <th style={{ width: '130px' }}>Registrado Por</th>
                            <th style={{ width: '50px', textAlign: 'center' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {accionesHojaVida.map((acc) => (
                            <tr key={acc.id}>
                              <td>
                                <span className="badge badge-funcional" style={{ fontSize: '11px', fontWeight: 600 }}>
                                  {acc.accion_realizada}
                                </span>
                              </td>
                              <td style={{ fontSize: '12px' }}>
                                {acc.fecha ? String(acc.fecha).slice(0, 10) : '—'}
                              </td>
                              <td style={{ fontSize: '12.5px', lineHeight: 1.4 }}>
                                {acc.procedimiento_realizado}
                              </td>
                              <td style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                                {acc.realizado_por || 'Técnico'}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <button
                                  type="button"
                                  className="btn-icon danger"
                                  onClick={() => handleEliminarAccion(acc.id)}
                                  title="Eliminar registro de acción"
                                >
                                  <TrashIcon size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pie del Modal */}
            <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => handleDescargarActaEntrega(equipoHojaVida)}
                  disabled={descargandoActa === equipoHojaVida.id}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  title="Descargar Acta de Entrega oficial en formato Word (.docx)"
                >
                  <FileTextIcon size={14} /> {descargandoActa === equipoHojaVida.id ? 'Descargando...' : 'Descargar Acta (.docx)'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => handleDescargarHojaVida(equipoHojaVida)}
                  disabled={descargandoHJ === equipoHojaVida.id}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  title="Descargar Hoja de Vida oficial en Excel (.xlsx)"
                >
                  <DownloadIcon size={14} /> {descargandoHJ === equipoHojaVida.id ? 'Descargando...' : 'Descargar Hoja de Vida (.xlsx)'}
                </button>
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModalHojaVidaOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Firma y Descarga de Acta de Entrega */}
      <ModalFirmaActa
        isOpen={modalFirmaActaOpen}
        onClose={() => {
          setModalFirmaActaOpen(false);
          setEquipoParaActa(null);
        }}
        equipo={equipoParaActa}
      />
    </div>
  );
}
