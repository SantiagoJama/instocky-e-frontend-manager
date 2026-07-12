export type BusinessTypeOption = {
  business_type: string
  description: string
}

export const businessTypes: BusinessTypeOption[] = [
  {
    business_type: 'MULTIREPUESTOS',
    description: 'Dedicada a la venta de repuestos; moto, carro entre otros',
  },
  {
    business_type: 'TIENDA_MINORISTA',
    description: 'Tienda dedicada a la venta de productos directamente al consumidor.',
  },
  {
    business_type: 'MAYORISTA',
    description: 'Negocio dedicado a la venta de productos en grandes cantidades.',
  },
  {
    business_type: 'TIENDA_DE_ABARROTES',
    description: 'Tienda que vende alimentos, bebidas y productos basicos de consumo.',
  },
  {
    business_type: 'SUPERMERCADO',
    description: 'Establecimiento comercial que ofrece alimentos y productos para el hogar.',
  },
  {
    business_type: 'FARMACIA',
    description: 'Negocio dedicado a la venta de medicamentos y productos de cuidado personal.',
  },
  {
    business_type: 'FERRETERIA',
    description: 'Tienda que vende herramientas, materiales y productos para construccion o reparacion.',
  },
  {
    business_type: 'TIENDA_DE_ROPA',
    description: 'Negocio dedicado a la venta de prendas de vestir.',
  },
  {
    business_type: 'ZAPATERIA',
    description: 'Negocio dedicado a la venta de zapatos y otros tipos de calzado.',
  },
  {
    business_type: 'TIENDA_DE_ELECTRONICA',
    description: 'Tienda dedicada a la venta de equipos electronicos y accesorios.',
  },
  {
    business_type: 'MUEBLERIA',
    description: 'Negocio dedicado a la venta de muebles para el hogar u oficina.',
  },
  {
    business_type: 'RESTAURANTE',
    description: 'Establecimiento dedicado a la preparacion y venta de alimentos.',
  },
  {
    business_type: 'COMIDA_RAPIDA',
    description: 'Negocio dedicado a la preparacion y venta rapida de alimentos.',
  },
  {
    business_type: 'CAFETERIA',
    description: 'Establecimiento que vende cafe, bebidas, postres y alimentos ligeros.',
  },
  {
    business_type: 'PANADERIA',
    description: 'Negocio dedicado a la elaboracion y venta de pan y productos de pasteleria.',
  },
  {
    business_type: 'BAR',
    description: 'Establecimiento dedicado a la venta de bebidas y alimentos.',
  },
  {
    business_type: 'HOTEL',
    description: 'Establecimiento que ofrece servicios de alojamiento.',
  },
  {
    business_type: 'HOSTAL',
    description: 'Establecimiento que ofrece alojamiento generalmente de menor escala que un hotel.',
  },
  {
    business_type: 'SALON_DE_BELLEZA',
    description: 'Negocio que ofrece servicios de belleza y cuidado personal.',
  },
  {
    business_type: 'BARBERIA',
    description: 'Negocio especializado en cortes de cabello y cuidado personal masculino.',
  },
  {
    business_type: 'SPA',
    description: 'Establecimiento que ofrece tratamientos de relajacion, bienestar y cuidado personal.',
  },
  {
    business_type: 'GIMNASIO',
    description: 'Establecimiento que ofrece equipos y servicios para realizar actividad fisica.',
  },
  {
    business_type: 'CLINICA',
    description: 'Establecimiento privado que ofrece servicios de atencion medica.',
  },
  {
    business_type: 'CLINICA_DENTAL',
    description: 'Establecimiento especializado en servicios odontologicos.',
  },
  {
    business_type: 'HOSPITAL',
    description: 'Institucion que ofrece servicios medicos y hospitalarios.',
  },
  {
    business_type: 'VETERINARIA',
    description: 'Negocio especializado en la atencion medica y cuidado de animales.',
  },
  {
    business_type: 'INSTITUCION_EDUCATIVA',
    description: 'Organizacion dedicada a brindar servicios de educacion o capacitacion.',
  },
  {
    business_type: 'UNIVERSIDAD',
    description: 'Institucion dedicada a la educacion superior.',
  },
  {
    business_type: 'GUARDERIA',
    description: 'Establecimiento dedicado al cuidado y atencion de ninos.',
  },
  {
    business_type: 'TRANSPORTE',
    description: 'Empresa dedicada al traslado de personas o mercancias.',
  },
  {
    business_type: 'LOGISTICA',
    description: 'Empresa dedicada a la planificacion, almacenamiento y distribucion de productos.',
  },
  {
    business_type: 'MENSAJERIA',
    description: 'Negocio dedicado al envio y entrega de documentos o paquetes.',
  },
  {
    business_type: 'CONSTRUCCION',
    description: 'Empresa dedicada a la construccion, remodelacion o mantenimiento de obras.',
  },
  {
    business_type: 'INMOBILIARIA',
    description: 'Empresa dedicada a la compra, venta, alquiler o administracion de propiedades.',
  },
  {
    business_type: 'CONTABILIDAD',
    description: 'Negocio que ofrece servicios contables, tributarios y financieros.',
  },
  {
    business_type: 'ESTUDIO_JURIDICO',
    description: 'Negocio que ofrece asesoria y representacion legal.',
  },
  {
    business_type: 'CONSULTORIA',
    description: 'Empresa que ofrece asesoria especializada a personas u organizaciones.',
  },
  {
    business_type: 'EMPRESA_DE_SOFTWARE',
    description: 'Empresa dedicada al desarrollo y mantenimiento de sistemas informaticos.',
  },
  {
    business_type: 'SERVICIOS_INFORMATICOS',
    description: 'Negocio que ofrece soporte tecnico, redes, mantenimiento y otros servicios tecnologicos.',
  },
  {
    business_type: 'TELECOMUNICACIONES',
    description: 'Empresa dedicada a ofrecer servicios de telefonia, internet o comunicacion.',
  },
  {
    business_type: 'MANUFACTURA',
    description: 'Empresa dedicada a la fabricacion o transformacion de productos.',
  },
  {
    business_type: 'AGRICULTURA',
    description: 'Negocio dedicado al cultivo y produccion de productos agricolas.',
  },
  {
    business_type: 'GANADERIA',
    description: 'Negocio dedicado a la crianza y comercializacion de animales.',
  },
  {
    business_type: 'PESCA',
    description: 'Negocio dedicado a la captura, produccion o comercializacion de productos pesqueros.',
  },
  {
    business_type: 'TURISMO',
    description: 'Empresa dedicada a ofrecer actividades y servicios turisticos.',
  },
  {
    business_type: 'SEGUROS',
    description: 'Empresa dedicada a ofrecer seguros para personas, bienes o empresas.',
  },
  {
    business_type: 'SERVICIOS_FINANCIEROS',
    description: 'Negocio que ofrece productos o servicios relacionados con finanzas.',
  },
  {
    business_type: 'BANCO',
    description: 'Institucion financiera que ofrece productos bancarios y servicios financieros.',
  },
  {
    business_type: 'COOPERATIVA_DE_AHORRO_Y_CREDITO',
    description: 'Institucion financiera cooperativa que ofrece servicios de ahorro y credito.',
  },
  {
    business_type: 'ORGANIZACION_SIN_FINES_DE_LUCRO',
    description: 'Organizacion dedicada a fines sociales, comunitarios o beneficos.',
  },
  {
    business_type: 'INSTITUCION_PUBLICA',
    description: 'Entidad perteneciente al Estado o al sector publico.',
  },
  {
    business_type: 'ORGANIZACION_RELIGIOSA',
    description: 'Organizacion dedicada a actividades religiosas o comunitarias.',
  },
  {
    business_type: 'SERVICIOS_PROFESIONALES',
    description: 'Negocio que ofrece servicios especializados prestados por profesionales.',
  },
  {
    business_type: 'OTRO',
    description: 'Tipo de negocio que no se encuentra dentro de las categorias disponibles.',
  },
]
