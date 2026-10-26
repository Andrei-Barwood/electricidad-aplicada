// patch_clean_levels.js
const fs = require('fs');

const LEVEL_UPDATES = {
  "dormitorio-912": {
    headline: "Dormitorio · Interruptor 9/12",
    parts: "Un interruptor 9/12 y una lámpara.",
    objective: "Alimentación al Mando: Canaliza la Fase (roja) desde la barra L del TDA hacia el borne común (L) del interruptor 9/12. Retorno de Fase: Conecta el conductor de retorno desde el borne de salida (1) del 9/12 al contacto central del portalámparas. Distribución de Neutro: Lleva el Neutro (blanco o azul) desde la barra N del TDA directamente al casquillo exterior del portalámparas. Verificación de Seguridad: Cierra el automático termomagnético en el TDA y acciona el interruptor 9/12 para encender la lámpara, verificando que la fase quede cortada al abrirlo.",
    success: "La lámpara enciende al cerrar el 9/12 y la fase queda interrumpida de forma segura al abrirlo."
  },
  "dos-luces": {
    headline: "Pasillo · Dos luces en paralelo (9/12)",
    parts: "Un interruptor 9/12 y dos lámparas en paralelo.",
    objective: "Alimentación de Entrada: Conecta la Fase desde la barra L del TDA al borne de entrada del interruptor 9/12. Retorno en Paralelo: Canaliza el retorno desde la salida del 9/12 y derívalo en paralelo hacia los contactos centrales de ambas lámparas (L1 y L2). Distribución de Neutro: Lleva el Neutro desde la barra N del TDA en derivación hacia los casquillos exteriores de las dos lámparas. Verificación: Acciona el interruptor 9/12 para energizar simultáneamente ambas luminarias a 220 V.",
    success: "Ambas lámparas encienden y apagan juntas desde el interruptor 9/12."
  },
  "enchufe-10": {
    headline: "Living · Enchufe 10 A con tierra de protección PE",
    parts: "Un enchufe 10 A con terminal de tierra PE.",
    objective: "Alimentación Permanente: Canaliza la Fase (roja) desde la barra L del TDA hacia el borne L del enchufe para suministrar 220 V continuos. Retorno de Neutro: Conecta el conductor Neutro (blanco o azul) desde la barra N del TDA directamente al borne N del tomacorriente. Puesta a Tierra PE (Normativa RIC N°10): Conecta el conductor de protección verde desde la barra PE del TDA hacia el borne central PE del enchufe. Verificación de Seguridad: Comprueba que el tomacorriente cuente con 220 V entre L y N y protección a tierra PE sin fugas diferenciales.",
    success: "El enchufe 10 A quedó energizado y protegido con puesta a tierra PE según RIC N°10."
  },
  "dos-enchufes": {
    headline: "Muro · Dos enchufes 10 A en paralelo con tierra PE",
    parts: "Dos enchufes 10 A en paralelo con terminales de tierra PE.",
    objective: "Alimentación en Paralelo: Canaliza Fase y Neutro desde las barras L y N del TDA a los bornes L y N del primer enchufe, derivándolos en paralelo hacia el segundo. Tierra PE Compartida (Normativa RIC N°10): Conecta el cable verde desde la barra PE del TDA al borne PE del primer enchufe y puentéalo al borne PE del segundo enchufe. Conexión Reglamentaria: Todo tomacorriente de la instalación debe contar con conductor de protección ininterrumpido. Verificación: Comprueba que ambos enchufes entreguen 220 V continuos y enlace equipotencial a tierra.",
    success: "Ambos enchufes comparten fase, neutro y tierra de protección en paralelo bajo norma RIC N°10."
  },
  "timbre": {
    headline: "Acceso · Pulsador y timbre",
    parts: "Un pulsador de campana y un timbre.",
    objective: "Alimentación al Pulsador: Canaliza la Fase desde la barra L del TDA al borne de entrada del pulsador de acceso. Retorno de Campana: Lleva el conductor de retorno desde la salida del pulsador hacia la bobina del timbre. Cierre con Neutro: Conecta el conductor Neutro desde la barra N del TDA directamente al borne de retorno del timbre. Verificación: Presiona el pulsador momentáneamente; el timbre debe sonar y desenergizarse inmediatamente al soltarlo.",
    success: "El timbre suena únicamente mientras se mantiene presionado el pulsador."
  },
  "pieza": {
    headline: "Dormitorio · Circuito mixto de alumbrado 9/12 y enchufe con tierra PE",
    parts: "Un interruptor 9/12, una lámpara y un enchufe 10 A con tierra PE.",
    objective: "Circuito de Alumbrado 9/12: Alimenta el interruptor 9/12 con Fase, conecta su retorno al centro del portalámparas y cierra con Neutro al casquillo. Circuito de Enchufe 10 A: Conecta Fase y Neutro continuos desde las barras del TDA a los bornes L y N del tomacorriente. Puesta a Tierra PE (Normativa RIC N°10): Conecta el conductor verde desde la barra PE del TDA al borne PE del enchufe. Verificación: La lámpara debe encender solo con el interruptor y el enchufe debe mantener 220 V con tierra permanente.",
    success: "Circuito mixto completado: alumbrado conmutable y enchufe protegido con tierra PE reglamentaria."
  },
  "basico-serie2": {
    headline: "Pasillo · Dos lámparas comandadas por interruptor 9/12",
    parts: "Un interruptor 9/12 y dos lámparas en paralelo.",
    objective: "Alimentación de Entrada: Conecta la Fase desde la barra L del TDA al borne común de entrada del interruptor 9/12. Retorno en Paralelo: Canaliza el conductor de retorno desde la salida del 9/12 hacia los contactos centrales de las lámparas L1 y L2 en derivación paralela. Distribución de Neutro: Conecta el Neutro desde la barra N del TDA a los casquillos exteriores de ambas lámparas. Verificación: Cierra el 9/12 para verificar que ambas lámparas encienden simultáneamente con 220 V de alimentación.",
    success: "Ambas lámparas encienden al cerrar el 9/12 y se apagan juntas al abrirlo."
  },
  "basico-paralelo3": {
    headline: "Comedor · Tres lámparas en paralelo con interruptor 9/12",
    parts: "Un interruptor 9/12 y tres lámparas en paralelo.",
    objective: "Alimentación al Mando: Conecta la Fase desde la barra L del TDA al borne de entrada del interruptor 9/12. Retorno Múltiple: Conecta el conductor de retorno desde la salida del 9/12 y derívalo en paralelo a los contactos centrales de las tres lámparas (L1, L2 y L3). Neutro Compartido: Tiende el conductor Neutro desde la barra N del TDA hacia los casquillos exteriores de las tres lámparas. Verificación: Cierra el 9/12 para comprobar que las tres luminarias del comedor se encienden al mismo tiempo con brillo uniforme.",
    success: "Las tres lámparas del comedor encienden simultáneamente desde el interruptor 9/12."
  },
  "basico-timbre-doble": {
    headline: "Acceso Doble · Dos pulsadores y un timbre (Función OR)",
    parts: "Dos pulsadores y un timbre.",
    objective: "Alimentación en Paralelo: Conecta la Fase desde la barra L del TDA a los bornes de entrada de ambos pulsadores (P1 y P2). Retorno de Mando: Une las salidas de ambos pulsadores formando una función lógica OR y canaliza el retorno al borne de la campanilla. Retorno de Neutro: Conecta el Neutro desde la barra N del TDA directamente al borne de retorno del timbre. Verificación: Presiona individualmente P1 y luego P2 para confirmar que el timbre suena con cualquiera de los dos accesos.",
    success: "Cualquiera de los dos pulsadores hace sonar el timbre de forma independiente."
  },
  "basico-timbres-paralelos": {
    headline: "Acceso · Un pulsador y dos timbres en paralelo",
    parts: "Un pulsador y dos timbres en paralelo.",
    objective: "Alimentación al Pulsador: Conecta la Fase desde la barra L del TDA al borne de entrada del pulsador. Retorno en Paralelo: Canaliza el retorno desde la salida del pulsador hacia los bornes de entrada de ambos timbres (T1 y T2). Retorno de Neutro: Tiende el Neutro desde la barra N del TDA en derivación a los bornes de retorno de ambos timbres. Verificación: Presiona el pulsador para confirmar que ambas campanillas suenan al mismo tiempo en diferentes zonas.",
    success: "El pulsador activa simultáneamente ambos timbres en paralelo."
  },
  "basico-enchufe-cuad": {
    headline: "Distribución · Cuatro enchufes 10 A en paralelo con tierra PE",
    parts: "Cuatro enchufes 10 A con terminales de tierra PE.",
    objective: "Alimentación en Paralelo: Conecta Fase y Neutro desde las barras del TDA en derivación paralela hacia los bornes L y N de los cuatro tomacorrientes (s1, s2, s3 y s4). Tierra de Protección PE (Normativa RIC N°10): Canaliza el cable verde desde la barra PE del TDA interconectando los bornes PE de los cuatro enchufes. Seguridad Normativa: Toda base de enchufe debe estar protegida contra contactos indirectos mediante el conductor PE y disyuntor diferencial. Verificación: Comprueba que los cuatro enchufes entreguen 220 V con equipotencialidad a tierra.",
    success: "Los cuatro enchufes operan en paralelo con tierra de protección conforme a norma RIC N°10."
  },
  "basico-diag-912": {
    headline: "Diagnóstico · Control de fase en interruptor 9/12",
    parts: "Un interruptor 9/12 y una lámpara.",
    objective: "Diagnóstico de Seguridad: La fase nunca debe conectarse directo al portalámparas porque mantendría el artefacto con tensión peligrosa aun apagado. Alimentación al Mando: Canaliza la Fase desde la barra L del TDA al borne común (L) del interruptor 9/12 para interrumpir el conductor vivo. Retorno a la Carga: Conecta el retorno desde la salida del 9/12 al contacto central de la lámpara. Neutro al Casquillo: Lleva el Neutro desde la barra N del TDA directo al casquillo exterior. Verificación: Acciona el 9/12 y comprueba que la lámpara apaga completamente sin tensión residual en el portalámparas.",
    success: "El interruptor corta la fase adecuadamente y la lámpara opera bajo norma de seguridad."
  },
  "basico-diag-corto": {
    headline: "Diagnóstico · Cortocircuito en enchufe",
    parts: "Un enchufe 10 A con terminal de tierra PE.",
    objective: "Identificación de Falla: Un cable erróneo conecta la Fase directamente al Neutro o a la Tierra PE, disparando la protección termomagnética o diferencial. Despeje de Falla: Utiliza la herramienta Borrador para retirar la conexión en cortocircuito. Conexionado Reglamentario: Conecta Fase a L, Neutro a N y conductor verde desde la barra PE del TDA a PE según RIC N°10. Verificación: Restablece las protecciones del TDA para confirmar que el enchufe queda energizado sin disparo de sobrecorriente.",
    success: "Cortocircuito despejado exitosamente y enchufe correctamente protegido con tierra PE."
  },
  "basico-extractor": {
    headline: "Baño · Extractor de aire comandado por 9/12",
    parts: "Un interruptor 9/12 y un extractor de aire.",
    objective: "Alimentación al Interruptor: Conecta la Fase desde la barra L del TDA al borne común de entrada del interruptor 9/12. Retorno de Ventilación: Canaliza el conductor de retorno desde la salida del 9/12 hacia el borne de fase del extractor de aire. Conexión de Neutro: Lleva el Neutro desde la barra N del TDA directamente al borne neutro del extractor. Verificación: Cierra el interruptor 9/12 para activar el motor del extractor de ventilación, garantizando corte de fase en reposo.",
    success: "El extractor de aire enciende al cerrar el 9/12 y queda desenergizado al abrirlo."
  },
  "basico-exterior": {
    headline: "Patio · Luminaria exterior con interruptor 9/12",
    parts: "Un interruptor 9/12 y una luminaria exterior.",
    objective: "Alimentación al Mando: Canaliza la Fase desde la barra L del TDA al borne de entrada del interruptor 9/12. Retorno de Iluminación: Conecta el retorno desde la salida del 9/12 hacia el contacto central del portalámparas exterior. Distribución de Neutro: Conecta el Neutro desde la barra N del TDA al casquillo exterior de la lámpara. Verificación: Cierra el interruptor 9/12 para energizar la luminaria del patio con corte seguro de fase en la maniobra.",
    success: "La luminaria exterior ilumina con seguridad normativa al accionar el interruptor 9/12."
  },
  "basico-pasillo-corto": {
    headline: "Pasillo Corto · Dos lámparas comandadas por 9/12",
    parts: "Un interruptor 9/12 y dos lámparas en paralelo.",
    objective: "Alimentación de Entrada: Conecta la Fase desde la barra L del TDA al borne común de entrada del interruptor 9/12. Retorno en Derivación: Lleva el conductor de retorno desde la salida del interruptor hacia los contactos centrales de ambas lámparas. Distribución de Neutro: Conecta el Neutro desde la barra N del TDA a los casquillos exteriores de ambas luminarias. Verificación: Cierra el interruptor para verificar la iluminación uniforme en todo el pasillo.",
    success: "Ambas luminarias del pasillo encienden simultáneamente desde el interruptor 9/12."
  },
  "dormitorio-915": {
    headline: "Dormitorio · Doble efecto 9/15",
    parts: "Un interruptor doble 9/15 y dos lámparas.",
    objective: "Alimentación Común: Canaliza la Fase desde la barra L del TDA hacia el borne común de entrada del interruptor doble 9/15. Retorno Efecto 1: Conecta la salida de la Tecla 1 al contacto central de la primera lámpara (L1). Retorno Efecto 2: Conecta la salida de la Tecla 2 al contacto central de la segunda lámpara (L2). Distribución de Neutro: Lleva el Neutro desde la barra N del TDA hacia los casquillos exteriores de ambas lámparas. Verificación: Acciona cada tecla de manera independiente para comprobar el control fraccionado del alumbrado.",
    success: "Cada tecla del 9/15 comanda su respectiva lámpara con total independencia."
  },
  "living-932": {
    headline: "Living · Triple efecto 9/32",
    parts: "Un interruptor triple 9/32 y tres lámparas.",
    objective: "Alimentación Común: Conecta la Fase desde la barra L del TDA al borne común de entrada de las tres teclas del interruptor 9/32. Retornos Individuales: Conecta la salida de la Tecla 1 a L1, la Tecla 2 a L2 y la Tecla 3 a L3 hacia sus contactos centrales. Distribución de Neutro: Tiende el Neutro desde la barra N del TDA en derivación hacia los casquillos exteriores de las tres lámparas. Verificación: Acciona las tres teclas para verificar el encendido individual y combinado de las luminarias.",
    success: "Las tres lámparas del living se controlan independientemente desde las tres teclas del interruptor 9/32."
  },
  "bano-bipolar": {
    headline: "Baño · Iluminación con interruptor bipolar",
    parts: "Un interruptor bipolar (corte omnipolar) y una lámpara.",
    objective: "Corte Omnipolar de Seguridad: En recintos húmedos, el corte bipolar interrumpe simultáneamente Fase y Neutro para máxima protección. Alimentación al Bipolar: Conecta la Fase al borne Fi y el Neutro al borne Ni del interruptor bipolar desde las barras del TDA. Salida hacia la Carga: Conecta la Fase protegida desde Fo al contacto central de la lámpara y el Neutro protegido desde No a su casquillo. Verificación: Acciona el interruptor bipolar para comprobar que ambos polos se conectan y desconectan al unísono.",
    success: "La lámpara enciende al cerrar el interruptor bipolar y ambos polos quedan aislados al abrirlo."
  },
  "lavadora": {
    headline: "Lavadero · Enchufe de fuerza 16 A con corte bipolar y tierra PE",
    parts: "Un interruptor bipolar y un enchufe 16 A con terminal de tierra PE.",
    objective: "Alimentación al Corte Bipolar: Conecta Fase y Neutro desde el TDA a las entradas Fi y Ni del interruptor bipolar. Salida hacia Enchufe de Fuerza: Conecta las salidas Fo y No del bipolar a los bornes L y N del enchufe de 16 A. Puesta a Tierra Ininterrumpida (RIC N°10): Conecta el conductor verde directo desde la barra PE del TDA al borne PE del enchufe sin pasar por el interruptor. Verificación: Acciona el bipolar para comprobar la desenergización total del tomacorriente manteniendo el enlace a tierra permanente.",
    success: "El enchufe 16 A cuenta con corte bipolar omnipolar y conexión continua de tierra PE según norma RIC."
  },
  "dos-pulsadores": {
    headline: "Acceso · Dos pulsadores en paralelo y un timbre",
    parts: "Dos pulsadores en paralelo y un timbre.",
    objective: "Alimentación en Paralelo: Conecta la Fase desde la barra L del TDA hacia el borne de entrada de ambos pulsadores (b1 y b2). Retorno de Mando: Une las salidas de ambos pulsadores y canaliza el conductor de retorno hacia la campanilla. Distribución de Neutro: Conecta el Neutro desde la barra N del TDA directamente al borne de retorno del timbre. Verificación: Presiona b1 y luego b2; cualquiera de los dos pulsadores debe accionar el timbre de forma independiente.",
    success: "Cualquiera de los dos pulsadores hace sonar el timbre y el circuito se interrumpe al soltarlos."
  },
  "dos-timbres": {
    headline: "Casa · Un pulsador y dos timbres en paralelo",
    parts: "Un pulsador y dos timbres en paralelo.",
    objective: "Alimentación al Pulsador: Conecta la Fase desde la barra L del TDA al borne de entrada del pulsador de acceso. Retorno en Paralelo: Canaliza el conductor de retorno desde la salida del pulsador hacia los bornes de entrada de ambos timbres (Campanilla 1 y Campanilla 2). Neutro Compartido: Tiende el Neutro desde la barra N del TDA a los bornes de retorno de las dos campanillas. Verificación: Presiona el pulsador para confirmar que ambas campanillas suenan al unísono en diferentes áreas de la vivienda.",
    success: "El pulsador activa simultáneamente ambas campanillas en paralelo."
  },
  "luz-enchufes": {
    headline: "Estar · Alumbrado 9/12 y dos enchufes con tierra PE",
    parts: "Un interruptor 9/12, una lámpara y dos enchufes 10 A con tierra PE.",
    objective: "Alumbrado 9/12: Alimenta el 9/12 con Fase, canaliza su retorno a la lámpara y cierra con Neutro al casquillo. Enchufes en Paralelo: Alimenta los bornes L y N de ambos tomacorrientes continuo desde las barras del TDA. Puesta a Tierra PE (Normativa RIC N°10): Conecta el conductor verde desde la barra PE del TDA hacia los bornes PE de ambos enchufes. Verificación: Comprueba el encendido de la lámpara mediante el 9/12 y la presencia permanente de 220 V con tierra en los dos enchufes.",
    success: "Alumbrado 9/12 y tomas de enchufe con tierra PE operando conforme a norma RIC N°10."
  },
  "luces-enchufe": {
    headline: "Living · Dos lámparas en paralelo y un enchufe con tierra PE",
    parts: "Un interruptor 9/12, dos lámparas y un enchufe 10 A con tierra PE.",
    objective: "Alumbrado en Paralelo: Alimenta el 9/12 con Fase, conecta su retorno en paralelo a los centros de ambas lámparas y cierra con Neutro a los casquillos. Enchufe Independiente: Alimenta los bornes L y N del enchufe directo desde las barras de fase y neutro del TDA. Puesta a Tierra PE (Normativa RIC N°10): Conecta el cable verde desde la barra PE del TDA hacia el borne de protección PE del enchufe. Verificación: Acciona el interruptor para encender las dos luces juntas mientras el enchufe permanece energizado y protegido.",
    success: "Las dos lámparas encienden juntas con el 9/12 y el enchufe mantiene 220 V con tierra PE reglamentaria."
  },
  "medio-915-tres": {
    headline: "Living · Doble efecto 9/15 con tres lámparas",
    parts: "Un interruptor 9/15 y tres lámparas.",
    objective: "Alimentación al 9/15: Conecta la Fase desde la barra L del TDA al borne común de entrada de ambas teclas del interruptor 9/15. Retorno Efecto 1: Canaliza el retorno desde la tecla 1 hacia el contacto central de la lámpara L1. Retorno Efecto 2 en Paralelo: Lleva el retorno desde la tecla 2 y derívalo en paralelo hacia los contactos centrales de las lámparas L2 y L3. Distribución de Neutro: Conecta el Neutro desde la barra N del TDA a los casquillos exteriores de las tres lámparas. Verificación: Comprueba que la tecla 1 controla L1 y la tecla 2 enciende L2 y L3 simultáneamente.",
    success: "Control doble efecto 9/15 operativo: tecla 1 enciende L1 y tecla 2 comanda L2 y L3."
  },
  "medio-915-ext": {
    headline: "Baño · Luz y extractor con interruptor 9/15",
    parts: "Un interruptor 9/15, una lámpara y un extractor de aire.",
    objective: "Alimentación al 9/15: Canaliza la Fase desde la barra L del TDA al borne común de entrada del interruptor 9/15. Retorno de Alumbrado: Conecta el retorno de la tecla 1 al contacto central del portalámparas. Retorno de Ventilación: Conecta el retorno de la tecla 2 al borne de fase del extractor de aire. Distribución de Neutro: Lleva el Neutro desde la barra N del TDA en derivación a la lámpara y al extractor. Verificación: Acciona cada tecla por separado para operar la iluminación y la extracción de aire independientemente.",
    success: "La tecla 1 controla la iluminación y la tecla 2 activa la extracción de aire por separado."
  },
  "medio-932-parcial": {
    headline: "Sala · Interruptor 9/32 con tecla de reserva",
    parts: "Un interruptor triple 9/32 y dos lámparas (tecla 2 de reserva).",
    objective: "Alimentación al 9/32: Conecta la Fase desde la barra L del TDA al borne común de entrada de las tres teclas del interruptor 9/32. Retorno Efecto 1: Conecta la salida de la tecla 1 al contacto central de la lámpara L1. Reserva Técnica: La tecla 2 se deja sin conexión como reserva técnica para una futura ampliación, sin carga residual. Retorno Efecto 3: Conecta la salida de la tecla 3 al contacto central de la lámpara L2. Distribución de Neutro: Conecta el Neutro desde la barra N del TDA a los casquillos exteriores de L1 y L2. Verificación: Acciona las teclas 1 y 3 para confirmar el encendido independiente de cada lámpara.",
    success: "L1 y L2 se comandan de forma independiente con las teclas 1 y 3; la tecla 2 queda disponible para ampliación."
  },
  "medio-logia": {
    headline: "Logia · Enchufes de lavandería con tierra PE",
    parts: "Un interruptor 9/12, una lámpara y dos enchufes 16 A con tierra PE.",
    objective: "Alumbrado de Logia: Alimenta el interruptor 9/12 con Fase, canaliza su retorno a la lámpara l1 y cierra con Neutro. Fuerza de Lavandería: Alimenta en paralelo los bornes L y N de ambos enchufes (Lavadora y Secadora) desde las barras del TDA. Puesta a Tierra Obligatoria (RIC N°10): Conecta el conductor verde desde la barra PE del TDA hacia los bornes PE de ambos enchufes para prevenir electrocución en zonas húmedas. Verificación: Comprueba el funcionamiento de la luz y la entrega constante de 220 V con enlace a tierra en los dos enchufes.",
    success: "Circuito de logia completado: iluminación funcional y tomas de fuerza protegidas bajo norma RIC N°10."
  },
  "medio-cocina": {
    headline: "Cocina · Enchufes de mesón y electrodomésticos con tierra PE",
    parts: "Un interruptor 9/12, una lámpara y tres enchufes con tierra PE.",
    objective: "Alumbrado de Cocina: Alimenta el 9/12 desde la barra L del TDA, conecta su retorno a la lámpara l1 y cierra con Neutro al casquillo. Enchufes de Mesón en Paralelo: Canaliza Fase y Neutro continuos en paralelo hacia los tres enchufes (s1, s2 y s3). Puesta a Tierra PE (Normativa RIC N°10): Conecta el conductor verde desde la barra PE del TDA hacia los bornes PE de los tres enchufes sin excepción. Verificación: La lámpara opera con el interruptor y los tres enchufes de mesón disponen de 220 V y enlace equipotencial a tierra.",
    success: "Cocina cableada según RIC N°10: alumbrado independiente y tomas de mesón con tierra de protección PE."
  },
  "medio-diag-915": {
    headline: "Diagnóstico · Conexión cruzada en interruptor 9/15",
    parts: "Un interruptor doble 9/15 y dos lámparas.",
    objective: "Diagnóstico de Circuitos Dobles: En un interruptor 9/15, las teclas no deben interferir entre sí; cada una debe gobernar su propia carga. Alimentación Común: Lleva la Fase desde la barra L del TDA a los bornes comunes de entrada de las teclas 1 y 2. Retornos Separados: Conecta la salida 1 directo a L1 y la salida 2 directo a L2 sin puentear las salidas. Neutro a Portalámparas: Canaliza el Neutro desde la barra N del TDA a los casquillos exteriores de L1 y L2. Verificación: Enciende y apaga cada tecla confirmando que no existe dependencia cruzada entre las luminarias.",
    success: "Cada tecla del 9/15 gobierna su respectiva lámpara con total independencia."
  },
  "medio-932-ext": {
    headline: "Jardín · Triple efecto 9/32 en tres zonas",
    parts: "Un interruptor triple 9/32 y tres reflectores.",
    objective: "Alimentación al 9/32: Conecta la Fase desde la barra L del TDA al borne común de entrada de las tres teclas del interruptor 9/32. Retorno Zona 1: Canaliza la salida de la tecla 1 hacia el contacto central del foco F1. Retorno Zona 2: Canaliza la salida de la tecla 2 hacia el contacto central del foco F2. Retorno Zona 3: Canaliza la salida de la tecla 3 hacia el contacto central del foco F3. Neutro en Derivación: Tiende el Neutro desde la barra N del TDA en derivación a los casquillos de los tres focos. Verificación: Enciende cada una de las tres teclas para corroborar el control fraccionado por zonas.",
    success: "Las tres zonas de iluminación exterior se controlan individualmente mediante las tres teclas del 9/32."
  },
  "medio-dos-915": {
    headline: "Habitaciones · Dos interruptores 9/15 (Cuatro circuitos)",
    parts: "Dos interruptores 9/15 y cuatro lámparas.",
    objective: "Alimentación a Módulos: Canaliza la Fase desde la barra L del TDA hacia los bornes comunes de ambos interruptores 9/15 (A y B). Retornos Módulo A: Conecta la salida 1 de 9/15 A a la lámpara A1 y la salida 2 a la lámpara A2. Retornos Módulo B: Conecta la salida 1 de 9/15 B a la lámpara B1 y la salida 2 a la lámpara B2. Neutro General: Distribuye el Neutro desde la barra N del TDA hacia los casquillos exteriores de las cuatro lámparas. Verificación: Comprueba el funcionamiento independiente de los cuatro efectos de alumbrado.",
    success: "Los dos interruptores 9/15 comandan sus cuatro efectos de iluminación con total independencia."
  },
  "medio-falso-cont": {
    headline: "Diagnóstico · Continuidad de neutro en 9/15",
    parts: "Un interruptor 9/15 y dos lámparas.",
    objective: "Diagnóstico de Neutro: Si el conductor neutro no llega a un portalámparas, la lámpara no encenderá aunque reciba fase a través del retorno. Alimentación 9/15: Conecta la Fase desde la barra L del TDA al común del 9/15 y sus retornos a L1 y L2. Continuidad de Neutro: Asegura que el conductor Neutro desde la barra N del TDA alcance los casquillos de ambas lámparas (L1 y L2). Verificación: Acciona ambas teclas del interruptor para verificar que ambas lámparas encienden a pleno brillo.",
    success: "Neutro restablecido correctamente: ambas lámparas del 9/15 encienden con normalidad."
  },
  "medio-mixto-bano": {
    headline: "Baño · Circuito mixto con 9/15 y enchufe con tierra PE",
    parts: "Un interruptor 9/15, dos lámparas y un enchufe con tierra PE.",
    objective: "Alumbrado 9/15: Alimenta el común del 9/15 con Fase, conecta el retorno 1 a la luz principal l1, el retorno 2 al foco auxiliar l2 y cierra con Neutro. Enchufe en Zona Húmeda: Alimenta L y N del enchufe de afeitadora desde las barras del TDA. Puesta a Tierra PE (Normativa RIC N°10): Conecta el conductor verde desde la barra PE del TDA al borne PE del tomacorriente para evitar riesgos de electrocución. Verificación: Comprueba el control independiente de las dos luces y la energización segura del tomacorriente.",
    success: "Baño completado bajo norma RIC N°10: doble efecto 9/15 y tomacorriente protegido con tierra PE."
  },
  "medio-sensor": {
    headline: "Exterior · Iluminación con interruptor sensor",
    parts: "Un interruptor de control (sensor) y un proyector exterior.",
    objective: "Alimentación de Control: Canaliza la Fase desde la barra L del TDA al borne de entrada del sensor/interruptor. Retorno de Carga: Conecta el conductor de retorno desde la salida del mando hacia el contacto central del foco exterior. Conexión de Neutro: Lleva el Neutro desde la barra N del TDA directamente al casquillo exterior del proyector. Verificación: Acciona el mando para energizar el foco y verificar la correcta conmutación del circuito exterior.",
    success: "El proyector exterior enciende y apaga mediante el mando con corte seguro de fase."
  },
  "medio-garaje": {
    headline: "Garaje · Iluminación 9/12 y enchufes para herramientas",
    parts: "Un interruptor 9/12, una lámpara y dos enchufes con tierra PE.",
    objective: "Alumbrado 9/12: Alimenta el interruptor 9/12 con Fase, conecta su retorno a la lámpara l1 y cierra con Neutro al casquillo. Enchufes de Fuerza para Taller: Conecta Fase y Neutro en paralelo hacia los tomacorrientes s1 y s2 desde las barras del TDA. Puesta a Tierra PE (Normativa RIC N°10): Canaliza el cable verde desde la barra PE del TDA hacia los bornes PE de ambos enchufes para la puesta a tierra de herramientas. Verificación: Comprueba el encendido de la luminaria y la entrega de 220 V con tierra permanente en las tomas.",
    success: "Garaje operativo conforme a RIC N°10 con iluminación y enchufes protegidos con tierra PE."
  },
  "medio-escalera-simple": {
    headline: "Escalera Simple · Conmutación 9/24 entre dos pisos",
    parts: "Dos conmutadores 9/24 y una lámpara.",
    objective: "Alimentación Primer Piso: Conecta la Fase desde la barra L del TDA al borne común (C) del conmutador 9/24 sw1. Puentes Viajeros entre Pisos: Tiende dos conductores viajeros entre los bornes laterales (L1 y L2) de sw1 y los bornes laterales de sw2 en el segundo piso. Retorno al Centro de Carga: Conecta el conductor de retorno desde el común de sw2 hacia el contacto central de la lámpara. Cierre con Neutro: Conecta el Neutro desde la barra N del TDA al casquillo exterior de la lámpara. Verificación: Conmuta cualquiera de los dos interruptores para confirmar el control de la luz desde ambos pisos.",
    success: "La lámpara de escala conmuta de manera independiente desde cualquiera de los dos pisos."
  },
  "medio-repaso": {
    headline: "Repaso General · Combinación de 9/12 y 9/15",
    parts: "Un interruptor 9/12, un interruptor doble 9/15 y tres lámparas.",
    objective: "Alimentación a Mandos: Lleva la Fase desde la barra L del TDA al común del interruptor 9/12 y a los comunes del interruptor 9/15. Retorno 9/12: Conecta la salida del 9/12 hacia el contacto central de la lámpara L1. Retornos 9/15: Conecta la salida 1 del 9/15 a L2 y la salida 2 del 9/15 a L3. Distribución de Neutro: Conecta el Neutro desde la barra N del TDA a los casquillos exteriores de las tres lámparas. Verificación: Comprueba que el 9/12 gobierna L1 de forma exclusiva y el 9/15 controla L2 y L3 en doble efecto.",
    success: "Circuito mixto de alumbrado validado: 9/12 controla L1 y 9/15 comanda L2 y L3 de forma independiente."
  },
  "escalera-924": {
    headline: "Escalera · Circuito de conmutación 9/24",
    parts: "Dos conmutadores 9/24 y una lámpara.",
    objective: "Alimentación Primer 9/24: Conecta la Fase desde la barra L del TDA al borne común (C) del primer conmutador 9/24. Puentes Viajeros: Tiende dos conductores viajeros entre los bornes laterales (A y B) del primer 9/24 y los bornes laterales (A y B) del segundo 9/24. Retorno a la Carga: Conecta el conductor de retorno desde el borne común (C) del segundo 9/24 hacia el contacto central de la lámpara. Neutro al Portalámparas: Canaliza el Neutro desde la barra N del TDA directamente al casquillo de la lámpara. Verificación: Alterna las palancas de ambos conmutadores para confirmar el encendido y apagado de la lámpara desde ambos extremos de la escalera.",
    success: "La lámpara de escala conmuta de manera alternada desde cualquiera de los dos conmutadores 9/24."
  },
  "pasillo-924": {
    headline: "Pasillo · Conmutada 9/24 con dos lámparas en paralelo",
    parts: "Dos conmutadores 9/24 y dos lámparas en paralelo.",
    objective: "Alimentación de Entrada: Conecta la Fase desde la barra L del TDA al borne común del primer conmutador 9/24. Puentes Viajeros: Tiende los dos conductores viajeros entre los bornes laterales de ambos conmutadores 9/24. Retorno en Paralelo: Canaliza el conductor de retorno desde el común del segundo 9/24 hacia los contactos centrales de ambas lámparas. Distribución de Neutro: Conecta el Neutro desde la barra N del TDA a los casquillos exteriores de ambas luminarias. Verificación: Alterna cualquiera de los dos interruptores para probar el paso de tensión y la conmutación simultánea de las dos luces.",
    success: "Las dos luces del pasillo conmutan simultáneamente desde cualquiera de los dos extremos."
  },
  "tres-accesos": {
    headline: "Tres Accesos · Conmutación con 9/24 e interruptor de cruce",
    parts: "Dos conmutadores 9/24, un interruptor de cruce y una lámpara.",
    objective: "Alimentación de Entrada: Conecta la Fase desde la barra L del TDA al borne común del primer conmutador 9/24. Primer Tramo de Viajeros: Conecta los bornes laterales del primer 9/24 hacia los bornes de entrada del interruptor de cruce. Segundo Tramo de Viajeros: Conecta los bornes de salida del interruptor de cruce hacia los bornes laterales del segundo 9/24. Retorno y Neutro: Conecta el retorno desde el común del segundo 9/24 al centro de la lámpara y cierra con Neutro desde el TDA al casquillo. Verificación: Acciona cualquiera de los tres interruptores (los dos 9/24 o el cruce) para verificar que la lámpara cambia de estado.",
    success: "El cruce suma el tercer punto de control y cualquiera de los tres mandos conmuta la luz."
  },
  "pasillo-enchufe": {
    headline: "Pasillo · Conmutada 9/24 y enchufe con tierra PE",
    parts: "Dos conmutadores 9/24, una lámpara y un enchufe 10 A con tierra PE.",
    objective: "Circuito de Conmutación 9/24: Alimenta el común del primer 9/24, une los puentes viajeros entre ambos conmutadores, conecta el retorno desde el segundo 9/24 a la lámpara y cierra con Neutro. Enchufe Independiente: Alimenta los bornes L y N del tomacorriente directo desde las barras de fase y neutro del TDA. Puesta a Tierra PE (Normativa RIC N°10): Conecta el conductor verde desde la barra PE del TDA hacia el borne PE del enchufe. Verificación: Comprueba que la luz conmuta desde ambos conmutadores y el enchufe mantiene 220 V permanentes con enlace a tierra.",
    success: "Conmutada 9/24 operativa y enchufe protegido con tierra PE reglamentaria."
  },
  "dos-dormitorios": {
    headline: "Dos Habitaciones · Circuitos 9/12 independientes",
    parts: "Dos interruptores 9/12 y dos lámparas.",
    objective: "Alimentación en Paralelo: Canaliza la Fase desde la barra L del TDA hacia los bornes de entrada de ambos interruptores 9/12 (sw1 y sw2). Retornos de Alumbrado: Conecta la salida de sw1 a la lámpara L1 y la salida de sw2 a la lámpara L2. Retorno de Neutro: Lleva el Neutro desde la barra N del TDA en derivación a los casquillos exteriores de L1 y L2. Verificación: Comprueba que cada interruptor 9/12 enciende y apaga exclusivamente la lámpara de su respectiva habitación.",
    success: "Cada habitación cuenta con control de alumbrado 9/12 totalmente independiente."
  },
  "principal": {
    headline: "Dormitorio Principal · Conmutada 9/24 y enchufe con tierra PE",
    parts: "Un interruptor 9/15, dos lámparas y un enchufe con tierra PE.",
    objective: "Alumbrado de Dormitorio: Conecta la Fase desde la barra L del TDA al común del interruptor 9/15, canaliza sus retornos hacia los contactos centrales de las lámparas L1 y L2 y cierra con Neutro a los casquillos. Enchufe de Cabecera: Conecta Fase y Neutro desde el TDA al tomacorriente para suministro continuo de 220 V. Puesta a Tierra PE (Normativa RIC N°10): Conecta el cable verde desde la barra PE del TDA al borne PE del enchufe. Verificación: Comprueba el funcionamiento de las luminarias y la presencia de 220 V con tierra reglamentaria en el tomacorriente.",
    success: "Alumbrado y enchufe de cabecera con tierra PE operando conforme a norma RIC N°10."
  },
  "avanzado-924-corto": {
    headline: "Escalera Compacta · Conmutación 9/24",
    parts: "Dos conmutadores 9/24 y una lámpara.",
    objective: "Alimentación al Primer 9/24: Lleva la Fase desde la barra L del TDA al común del primer conmutador 9/24 (s1). Puentes Viajeros: Conecta los bornes laterales de s1 con los bornes laterales del segundo conmutador (s2). Retorno a Luminaria: Conecta el común de s2 al contacto central de la lámpara. Distribución de Neutro: Tiende el Neutro desde la barra N del TDA al casquillo exterior de la lámpara. Verificación: Conmuta alternativamente ambos interruptores para verificar el funcionamiento de la escala en dos vías.",
    success: "Conmutación 9/24 en dos vías completada con éxito."
  },
  "avanzado-924-largo": {
    headline: "Pasillo Extenso · Conmutada 9/24 con tres luminarias",
    parts: "Dos conmutadores 9/24 y tres lámparas en paralelo.",
    objective: "Alimentación al Primer 9/24: Conecta la Fase desde la barra L del TDA al común del primer conmutador 9/24 (s1). Puentes Viajeros: Tiende los dos conductores viajeros entre los bornes laterales de ambos conmutadores 9/24 (s1 y s2). Retorno Múltiple en Paralelo: Lleva el conductor de retorno desde el común de s2 y conéctalo en derivación a los contactos centrales de las tres lámparas (L1, L2 y L3). Neutro Compartido: Distribuye el Neutro desde la barra N del TDA a los casquillos de las tres luminarias. Verificación: Acciona cualquiera de los dos conmutadores para comprobar que las tres luces encienden y apagan juntas.",
    success: "Las tres luminarias del pasillo conmutan simultáneamente desde los dos extremos mediante el circuito 9/24."
  },
  "avanzado-diag-924": {
    headline: "Diagnóstico · Error de cableado en conmutada 9/24",
    parts: "Dos conmutadores 9/24 y una lámpara.",
    objective: "Diagnóstico de Puentes Viajeros: En una conmutada 9/24, si la Fase o el Neutro se conectan por error a un borne lateral en vez del común, el sistema producirá un cortocircuito al alternar las posiciones. Cableado Reglamentario: Conecta la Fase únicamente al común del primer 9/24 (s1). Puentes Viajeros: Conecta los puentes viajeros exclusivamente entre los bornes laterales de s1 y s2. Retorno y Neutro: Conecta el común de s2 a la lámpara y cierra el circuito con el Neutro del TDA al casquillo. Verificación: Alterna las cuatro combinaciones de los dos conmutadores sin provocar disparos térmicos.",
    success: "La conmutada 9/24 opera en todas sus combinaciones sin cortocircuito."
  },
  "avanzado-mixto-placa": {
    headline: "Placa Modular Mixta · Conmutador 9/24 e Interruptor 9/12",
    parts: "Dos conmutadores 9/24, un interruptor 9/12 y dos lámparas.",
    objective: "Alimentación a Placa: Conecta la Fase desde la barra L del TDA al común del primer 9/24 (s1) y puentéala a la entrada del interruptor 9/12 (sw) en la misma caja. Conmutada 9/24 (L1): Tiende los dos puentes viajeros hacia el segundo 9/24 (s2) y conecta el común de este a la lámpara L1. Efecto 9/12 (L2): Conecta la salida de sw al contacto central de la lámpara L2. Distribución de Neutro: Conecta el Neutro desde la barra N del TDA a los casquillos de ambas lámparas. Verificación: Comprueba que L1 conmuta desde ambos 9/24 y L2 opera de forma independiente con el 9/12.",
    success: "El conmutador 9/24 y el interruptor 9/12 operan en la misma placa sin interferirse mutuamente."
  },
  "avanzado-tres-accesos-2": {
    headline: "Pasillo Distribuidor · Tres accesos con dos lámparas",
    parts: "Dos conmutadores 9/24, un interruptor de cruce y dos lámparas en paralelo.",
    objective: "Alimentación de Entrada: Conecta la Fase desde la barra L del TDA al común del primer conmutador 9/24 (s1). Enlace de Cruce: Conecta los bornes laterales de s1 a la entrada del cruce c y las salidas de c a los bornes laterales del segundo 9/24 (s2). Retorno en Paralelo: Lleva el retorno desde el común de s2 derivándolo a los contactos centrales de ambas lámparas (L1 y L2). Neutro Compartido: Tiende el Neutro desde la barra N del TDA a los casquillos exteriores de L1 y L2. Verificación: Acciona los dos 9/24 y el interruptor de cruce; cualquiera de los tres mandos debe cambiar el estado de ambas lámparas.",
    success: "Ambas lámparas conmutan perfectamente desde los tres puntos de mando."
  },
  "avanzado-cuatro-accesos": {
    headline: "Salón Amplio · Conmutación desde cuatro accesos",
    parts: "Dos conmutadores 9/24, dos interruptores de cruce y una lámpara.",
    objective: "Alimentación: Lleva la Fase desde la barra L del TDA al común del primer conmutador 9/24 (s1). Cadena de Cruces: Conecta las salidas laterales de s1 a las entradas del primer cruce (c1); conecta las salidas de c1 a las entradas del segundo cruce (c2); conecta las salidas de c2 a los bornes laterales de s2. Retorno de Carga: Conecta el común del segundo 9/24 (s2) al contacto central de la lámpara. Cierre de Neutro: Conecta el Neutro desde la barra N del TDA al casquillo exterior. Verificación: Acciona cada uno de los cuatro interruptores en forma sucesiva; todos deben conmutar la luz de manera independiente.",
    success: "La lámpara del salón conmuta correctamente desde cualquiera de los cuatro interruptores."
  },
  "avanzado-cinco-accesos": {
    headline: "Hotel / Galería · Conmutación desde cinco accesos",
    parts: "Dos conmutadores 9/24, tres interruptores de cruce y una lámpara.",
    objective: "Alimentación de Entrada: Conecta la Fase desde la barra L del TDA al común del conmutador 9/24 inicial (s1). Cascada de Tres Cruces: Tiende los puentes viajeros en cascada a través de los tres cruces intermedios (c1 ➔ c2 ➔ c3) y remata en los laterales del 9/24 final (s2). Retorno al Consumo: Conecta el común de s2 al contacto central de la luminaria. Cierre con Neutro: Conecta el Neutro desde la barra N del TDA al casquillo de la luminaria. Verificación: Comprueba la alternancia de encendido y apagado accionando cualquiera de los cinco puntos de mando.",
    success: "Circuito de cinco accesos operativo: los dos 9/24 y los tres cruces comandan la luminaria a la perfección."
  },
  "avanzado-pasillo-enchufes": {
    headline: "Pasillo · Conmutada 9/24 y tres enchufes con tierra PE",
    parts: "Dos conmutadores 9/24, una lámpara y tres enchufes 10 A con tierra PE.",
    objective: "Circuito de Alumbrado 9/24: Alimenta el común de s1 desde la barra L del TDA, tiende los puentes viajeros hacia s2, conecta su común al contacto central de la lámpara y cierra con Neutro al casquillo. Circuito de Enchufes en Paralelo: Alimenta en paralelo los bornes L y N de las tres tomas (e1, e2 y e3) desde las barras del TDA. Tierra de Protección PE Obligatoria (RIC N°10): Canaliza el conductor verde desde la barra PE del TDA hacia los bornes PE de los tres enchufes. Verificación: Comprueba que la luz conmuta desde ambos extremos y los tres enchufes entregan 220 V continuos con puesta a tierra reglamentaria.",
    success: "Alumbrado conmutable 9/24 y tres enchufes con tierra PE funcionando conforme a norma."
  },
  "avanzado-ext-cruce": {
    headline: "Jardín · Conmutada de tres accesos con dos reflectores",
    parts: "Dos conmutadores 9/24, un interruptor de cruce y dos reflectores.",
    objective: "Alimentación de Entrada: Conecta la Fase desde la barra L del TDA al común del primer conmutador 9/24 (s1). Cruce Intermedio: Canaliza los puentes viajeros pasando por el interruptor de cruce c1 hacia los bornes laterales del segundo 9/24 (s2). Retorno en Paralelo: Conecta el retorno desde el común de s2 a los contactos centrales de ambos reflectores (L1 y L2). Distribución de Neutro: Lleva el Neutro desde la barra N del TDA a los casquillos de ambos reflectores. Verificación: Acciona indistintamente los dos 9/24 o el cruce c1 para comprobar la conmutación simultánea de ambos reflectores.",
    success: "Los dos reflectores de jardín conmutan al unísono desde los tres accesos."
  },
  "avanzado-diag-924-falso": {
    headline: "Diagnóstico · Diferencia funcional entre 9/24 y 9/15",
    parts: "Dos conmutadores 9/24 y una lámpara.",
    objective: "Diagnóstico Teórico-Práctico: Un interruptor 9/15 (doble efecto) nunca puede reemplazar a un 9/24 de escala porque no dispone de contacto inversor (conmutación). Cableado Correcto de Escala 9/24: Conecta la Fase al común del primer 9/24 (s1), une los dos laterales viajeros a s2 y extrae el retorno exclusivo desde el común de s2 hacia la lámpara. Cierre de Neutro: Conecta el Neutro desde la barra N del TDA al casquillo de la lámpara. Verificación: Comprueba que alternar cualquiera de las palancas cambia el estado de la lámpara sin dejar puntos muertos ni combinaciones ciegas.",
    success: "Conmutación 9/24 debidamente identificada y operando de forma continua."
  },
  "avanzado-924-cruzado": {
    headline: "Escalera · Puentes viajeros cruzados en conmutada 9/24",
    parts: "Dos conmutadores 9/24 y una lámpara.",
    objective: "Comprensión de Puentes Viajeros: En un circuito 9/24, cruzar los dos conductores viajeros (borne A1 con B2 y B1 con A2) no altera el funcionamiento eléctrico del sistema, pues ambos son conductores alternativos de fase. Alimentación: Conecta la Fase desde la barra L del TDA al común del primer 9/24 (s1). Puentes Cruzados: Cruza los dos conductores viajeros entre los bornes laterales de s1 y s2. Retorno y Neutro: Conecta el común de s2 al centro de la lámpara y cierra el Neutro al casquillo. Verificación: Alterna los interruptores para confirmar que el cruce de viajeros mantiene la conmutación perfecta.",
    success: "La conmutada 9/24 opera con total normalidad a pesar del cruce de viajeros."
  },
  "avanzado-tres-pisos": {
    headline: "Edificio de Tres Pisos · Doble circuito de escala 9/24",
    parts: "Cuatro conmutadores 9/24 y dos lámparas (Escalera 1 y Escalera 2).",
    objective: "Alimentación de Escalas: Canaliza la Fase desde la barra L del TDA a los bornes comunes de los conmutadores de entrada de cada tramo (s1a y s2a). Tramo Piso 1 a 2: Conecta los puentes viajeros entre s1a y s1b, llevando el retorno a la lámpara Escalera 1. Tramo Piso 2 a 3: Conecta los puentes viajeros entre s2a y s2b, llevando el retorno a la lámpara Escalera 2. Neutro Común: Distribuye el Neutro desde la barra N del TDA a los casquillos de ambas lámparas de escalera. Verificación: Comprueba que cada tramo de escalera conmuta de forma independiente desde sus respectivos descansos.",
    success: "Ambos tramos de escalera conmutan de forma independiente entre sus respectivos descansos."
  },
  "avanzado-galpon": {
    headline: "Galpón Industrial · Conmutada 9/24 y foco exterior 9/12",
    parts: "Dos conmutadores 9/24, un interruptor 9/12 y tres lámparas.",
    objective: "Alimentación General: Canaliza la Fase desde la barra L del TDA al común del primer 9/24 (s1) y a la entrada del 9/12 (sw). Alumbrado Nave Central (9/24): Une los puentes viajeros entre s1 y s2 y conecta el común de s2 en paralelo a las lámparas G1 y G2. Alumbrado Exterior (9/12): Conecta la salida de sw al foco exterior Ext. Neutro Compartido: Tiende el Neutro desde la barra N del TDA hacia los casquillos de las tres luminarias. Verificación: Comprueba que la nave central conmuta desde ambos accesos y el foco exterior opera con su propio interruptor.",
    success: "La nave central conmuta desde los accesos y el foco exterior opera de forma independiente."
  },
  "avanzado-diag-cruce": {
    headline: "Diagnóstico · Identificación de bornes en interruptor de cruce",
    parts: "Dos conmutadores 9/24, un interruptor de cruce y una lámpara.",
    objective: "Diagnóstico de Cruzamiento: El interruptor de cruce posee dos bornes de entrada y dos de salida; conectar entrada y salida en corto anula la conmutación. Alimentación Inicial: Conecta la Fase al común del primer 9/24 (s1). Enlace de Viajeros y Cruce: Conecta los dos viajeros de salida a la entrada del cruce (c1) y desde su salida tiende los viajeros a s2. Retorno y Neutro: Conecta el común de s2 a la lámpara y el casquillo al Neutro del TDA. Verificación: Comprueba que los tres mandos alternan la luz sin provocar posiciones falsas ni disparos.",
    success: "El interruptor de cruce conmuta correctamente y completa la conmutación de tres accesos."
  },
  "cocina": {
    headline: "Cocina · Alumbrado 9/12 y enchufe de fuerza con tierra PE",
    parts: "Un interruptor 9/12, una lámpara, un interruptor bipolar y un enchufe 16 A con tierra PE.",
    objective: "Alumbrado 9/12: Conecta la Fase desde la barra L del TDA al 9/12, su retorno a la lámpara y cierra con Neutro al casquillo. Enchufe de Fuerza y Tierra PE: Alimenta el enchufe desde las barras de fase y neutro (o a través del bipolar), y conecta obligatoriamente el conductor verde de protección desde la barra PE del TDA al borne PE del enchufe. Normativa RIC N°02 y N°10: Al completar el cableado con puesta a tierra reglamentaria, se generará el Cuadro de Cargas dividiendo C-1 Alumbrado (10 A) y C-2 Enchufes (16 A). Verificación: Comprueba el funcionamiento de la luz y la presencia de 220 V con tierra segura en el enchufe.",
    success: "Alumbrado y enchufe de fuerza operativos con protección diferencial y tierra PE reglamentaria."
  },
  "marquesina": {
    headline: "Marquesina · Pulsador con timbre y alumbrado 9/12",
    parts: "Un pulsador, un timbre, un interruptor 9/12 y una lámpara.",
    objective: "Alimentación a Mandos: Lleva la Fase desde la barra L del TDA a la entrada del pulsador de acceso (btn) y a la entrada del interruptor 9/12 (sw). Circuito de Timbre: Conecta la salida de btn al borne de entrada del timbre (bell) y cierra su retorno al Neutro del TDA. Circuito de Alumbrado: Conecta la salida de sw al contacto central de la lámpara Marquesina y cierra al Neutro del TDA. Verificación: Presiona el pulsador para verificar el timbre y acciona el 9/12 para encender la marquesina de forma independiente.",
    success: "El timbre suena al presionar el pulsador y la luminaria de marquesina opera con el interruptor 9/12."
  },
  "living-completo": {
    headline: "Living Completo · Doble efecto 9/15 y dos enchufes con tierra PE",
    parts: "Un interruptor doble 9/15, dos lámparas y dos enchufes con tierra PE.",
    objective: "Alumbrado 9/15: Alimenta el común del 9/15 con Fase, conecta la salida 1 a L1, la salida 2 a L2 y cierra con Neutro a los casquillos. Enchufes en Paralelo: Alimenta en derivación paralela los bornes L y N de ambos tomacorrientes (s1 y s2) desde las barras del TDA. Puesta a Tierra PE (Normativa RIC N°10): Canaliza el cable verde desde la barra PE del TDA hacia los bornes PE de ambos enchufes. Verificación: Comprueba que el 9/15 controla ambas luces de manera independiente y las tomas entregan 220 V continuos con tierra de protección.",
    success: "Instalación de living completada con doble efecto 9/15 y enchufes protegidos con tierra PE según norma RIC."
  },
  "departamento": {
    headline: "Departamento · Conmutada 9/24 en pasillo y 9/12 en baño",
    parts: "Dos conmutadores 9/24, un interruptor 9/12 y dos lámparas.",
    objective: "Alimentación General: Canaliza la Fase desde la barra L del TDA al común del primer conmutador 9/24 (p1) del pasillo y a la entrada del 9/12 (sw) del baño. Conmutada Pasillo (9/24): Tiende los conductores viajeros entre p1 y p2 y conecta el común de p2 a la lámpara de pasillo (hall). Baño (9/12): Conecta el retorno de la salida de sw a la lámpara del baño (bath). Distribución de Neutro: Conecta el Neutro desde la barra N del TDA a los casquillos exteriores de ambas lámparas. Verificación: Comprueba que la luz del pasillo conmuta desde los dos accesos y la luz del baño enciende con su propio interruptor.",
    success: "El pasillo conmuta desde ambos extremos y el baño se controla independientemente mediante su 9/12."
  },
  "taller-tda-2": {
    headline: "Tablero TDA · Distribución de alumbrado (10 A) y fuerza (16 A)",
    parts: "Dos automáticos termomagnéticos (b1 y b2), un 9/12, una lámpara y un enchufe con tierra PE.",
    objective: "Alimentación a Protecciones: Conecta la Fase desde la barra L del TDA a las entradas de ambos automáticos de circuito (b1 Alumbrado y b2 Enchufes). Circuito 1 Alumbrado (b1): Desde la salida de b1 alimenta el interruptor 9/12 sw, conecta su retorno a la lámpara l1 y cierra al Neutro del TDA. Circuito 2 Fuerza (b2): Desde la salida de b2 alimenta el borne L del enchufe s1 y conecta su borne N a la barra de Neutro. Puesta a Tierra PE (Normativa RIC N°10): Conecta el cable verde desde la barra PE del TDA directo al borne PE del enchufe. Verificación: Cierra ambos automáticos y verifica la independencia operativa de alumbrado y fuerza.",
    success: "Distribución de dos circuitos en tablero TDA validada con protecciones y tierra PE conforme a RIC N°02 y N°10."
  },
  "taller-tda-3": {
    headline: "Tablero TDA · Automático general con dos circuitos derivados",
    parts: "Un disyuntor general (bg), dos disyuntores de circuito (b1 y b2), un 9/12, una lámpara y un enchufe con tierra PE.",
    objective: "Protección General: Conecta la Fase desde la barra L del TDA a la entrada del automático general (bg). Distribución Secundaria: Conecta la salida de bg a las entradas de los disyuntores de circuito b1 (Alumbrado) y b2 (Fuerza). Circuito Alumbrado (b1): Alimenta el interruptor 9/12 desde b1, conecta el retorno a la lámpara l1 y cierra con Neutro. Circuito Fuerza (b2): Alimenta L y N del enchufe s1 desde b2 y la barra de Neutro. Puesta a Tierra PE (Normativa RIC N°10): Tiende el conductor verde desde la barra PE del TDA hacia el borne PE del enchufe. Verificación: Cierra bg, b1 y b2 para verificar la cascada de protecciones y la operatividad total.",
    success: "Tablero con protección general y circuitos derivados completamente validado bajo normativa SEC."
  },
  "taller-casa-peq": {
    headline: "Vivienda Pequeña · Distribución completa de alumbrado y fuerza",
    parts: "Dos disyuntores de circuito (b1 y b2), dos interruptores 9/12, dos lámparas y tres enchufes con tierra PE.",
    objective: "Alimentación por Circuitos: Conecta la Fase desde la barra L del TDA a las entradas de b1 (Alumbrado) y b2 (Fuerza). Circuito C-1 Alumbrado: Alimenta los interruptores s1 y s2 desde b1, conecta sus retornos a l1 y l2 y cierra al Neutro del TDA. Circuito C-2 Fuerza: Alimenta en paralelo los bornes L y N de los tres enchufes (e1, e2 y e3) desde la salida de b2 y la barra de Neutro. Puesta a Tierra PE Obligatoria (RIC N°10): Conecta el conductor verde desde la barra PE del TDA hacia los bornes PE de los tres enchufes. Verificación: Cierra ambos automáticos y comprueba el funcionamiento independiente de las dos zonas de alumbrado y las tres tomas de corriente.",
    success: "Instalación completa de vivienda validada conforme a pliegos técnicos RIC N°02 y N°10."
  },
  "taller-depto": {
    headline: "Departamento Completo · Tablero TDA con conmutada 9/24 y baño 9/15",
    parts: "Un disyuntor de circuito, dos conmutadores 9/24, un 9/15, dos lámparas y un extractor de aire.",
    objective: "Protección de Circuito: Conecta la Fase desde la barra L del TDA a la entrada del disyuntor general de circuito (bg) y distribuye su salida protegida hacia los mandos. Conmutada Pasillo (9/24): Alimenta el común del conmutador sw1, tiende los viajeros a sw2 y conecta su retorno a la lámpara de pasillo l1. Baño Mixto (9/15): Alimenta el común del 9/15 dbl; conecta la salida 1 a la luz del baño l2 y la salida 2 al extractor de aire ext. Distribución de Neutro: Conecta el Neutro desde la barra N del TDA a los tres artefactos. Verificación: Cierra el disyuntor bg y prueba la conmutación del pasillo y el control fraccionado del baño.",
    success: "Departamento operativo: disyuntor protege la instalación, pasillo conmuta y baño opera en doble efecto con extracción."
  },
  "taller-oficina": {
    headline: "Oficina Comercial · Triple efecto 9/32 y enchufes de trabajo con tierra PE",
    parts: "Dos automáticos de circuito (b1 y b2), un triple 9/32, tres luminarias y dos enchufes con tierra PE.",
    objective: "Distribución por Circuitos: Conecta la Fase desde la barra L del TDA a las entradas de b1 (Alumbrado) y b2 (Fuerza). Circuito C-1 Alumbrado Comercial: Alimenta el común del interruptor triple 9/32 desde b1, conecta las salidas 1, 2 y 3 a l1, l2 y l3, y cierra con Neutro al casquillo. Circuito C-2 Fuerza Puestos de Trabajo: Alimenta los bornes L y N de ambos enchufes (e1 y e2) desde b2 y la barra de Neutro. Puesta a Tierra PE (Normativa RIC N°10): Conecta el cable verde desde la barra PE del TDA hacia los bornes PE de ambos enchufes de oficina. Verificación: Cierra b1 y b2 comprobando el triple encendido por zonas y la alimentación continua con tierra en los escritorios.",
    success: "Oficina comercial operativa bajo norma RIC: triple efecto 9/32 y puestos de trabajo con tierra PE."
  },
  "taller-comercial": {
    headline: "Local Comercial · Vitrina, iluminación de salón y enchufe de caja con tierra PE",
    parts: "Un disyuntor general (bg), dos interruptores 9/12, dos lámparas y un enchufe con tierra PE.",
    objective: "Protección de Tablero: Conecta la Fase desde la barra L del TDA a la entrada del automático general bg y deriva su salida a los mandos y enchufes. Vitrina y Salón (9/12): Alimenta los interruptores sw1 y sw2, conecta sus retornos a la lámpara de vitrina l1 y salón l2, cerrando con Neutro. Enchufe de Punto de Venta (Caja): Alimenta L y N del enchufe caja con Neutro de la barra del TDA. Puesta a Tierra PE (Normativa RIC N°10): Conecta el conductor verde desde la barra PE del TDA al borne PE del enchufe de caja. Verificación: Cierra el automático general bg y verifica el control independiente de la vitrina, el salón y la caja registradora.",
    success: "Local comercial cableado con éxito: vitrina, salón y punto de venta con tierra PE reglamentaria."
  },
  "taller-restaurante": {
    headline: "Restaurante Comercial · Distribución por sectores con conmutada 9/24",
    parts: "Tres automáticos (bC Cocina, bD Salón, bB Baño), dos conmutadores 9/24, un 9/12, dos lámparas y un enchufe con tierra PE.",
    objective: "Distribución por Circuitos: Conecta la Fase desde la barra L del TDA a las entradas de los tres automáticos (bC Cocina, bD Salón, bB Baño). Circuito de Fuerza Cocina (bC): Alimenta el tomacorriente eq desde bC con su neutro y conecta el cable verde desde la barra PE del TDA a su borne PE conforme a RIC N°10. Circuito Alumbrado Salón (bD): Alimenta el común del conmutador c1 desde bD, une los viajeros con c2 y conecta el retorno a la lámpara ld. Circuito Baño (bB): Alimenta el interruptor 9/12 sw desde bB y conecta el retorno a la lámpara lb. Verificación: Cierra las tres protecciones y comprueba el funcionamiento independiente de cada área del restaurante.",
    success: "Restaurante comercial operativo con protecciones independientes de fuerza y alumbrado según normativa RIC."
  },
  "taller-diag-corto": {
    headline: "Diagnóstico · Cortocircuito en tablero TDA y enchufe con tierra PE",
    parts: "Un disyuntor de circuito (bg) y un enchufe con terminal de tierra PE.",
    objective: "Diagnóstico de Cortocircuito: Una conexión incorrecta en el tablero o en el artefacto une directamente la Fase con el Neutro, provocando el disparo del automático. Despeje de Falla: Utiliza la herramienta Borrador para eliminar el cortocircuito franco. Reconexión Conforme a Norma: Conecta la Fase desde la barra L del TDA a la entrada de bg; desde la salida de bg alimenta el borne L del enchufe. Puesta a Tierra PE (Normativa RIC N°10): Conecta el borne N al Neutro del TDA y el conductor verde desde la barra PE al borne PE del enchufe. Verificación: Cierra el automático bg para confirmar que el enchufe se energiza a 220 V con tierra segura sin disparar las protecciones.",
    success: "Cortocircuito despejado exitosamente y enchufe alimentado con protección termomagnética y tierra PE reglamentaria."
  },
  "taller-diag-retorno": {
    headline: "Diagnóstico · Retorno invertido en circuito de escala 9/24",
    parts: "Un disyuntor de circuito (bg), dos conmutadores 9/24 y una lámpara.",
    objective: "Diagnóstico de Conmutación: Si en un circuito 9/24 se invierte un puente viajero con el conductor de retorno, la lámpara presentará puntos muertos o no encenderá en ciertas posiciones. Alimentación y Protección: Conecta la Fase desde la barra L del TDA a la entrada de bg y desde su salida alimenta el común del primer 9/24 (c1). Puentes Viajeros Exclusivos: Conecta los bornes laterales viajeros entre c1 y c2 sin cruzar con el común. Retorno Exclusivo: Conecta únicamente el común del segundo 9/24 (c2) al centro de la lámpara l1 y cierra al Neutro del TDA. Verificación: Cierra el disyuntor bg y conmuta ambos interruptores comprobando la alternancia perfecta en las cuatro posiciones.",
    success: "Falla de retorno invertido resuelta: la conmutada 9/24 opera en todas sus combinaciones de mando."
  },
  "taller-proyecto-maestro": {
    headline: "Proyecto Maestro Final · Examen de acreditación SEC (Pliegos RIC)",
    parts: "Tres automáticos (bg General, b1 Alumbrado, b2 Enchufes), un 9/32, tres lámparas y dos enchufes con tierra PE.",
    objective: "Protección Principal y Distribución: Conecta la Fase desde la barra L del TDA al general bg y deriva su salida a los automáticos b1 (Alumbrado) y b2 (Fuerza). Circuito C-1 Alumbrado 9/32: Alimenta el común del interruptor triple 9/32 desde b1, conecta sus retornos independientes a l1, l2 y l3, y cierra con Neutro a los casquillos. Circuito C-2 Fuerza: Alimenta en paralelo los tomacorrientes e1 y e2 desde b2 y la barra de Neutro. Puesta a Tierra PE (Normativa RIC N°10): Canaliza el cable verde desde la barra PE del TDA hacia los bornes PE de ambos enchufes. Verificación Final: Cierra todas las protecciones y comprueba el triple efecto de alumbrado, la energización de fuerza y la apertura del cuadro de cargas conforme a RIC N°02.",
    success: "¡Felicitaciones! Has completado el Proyecto Maestro de Instalaciones Eléctricas Domiciliarias conforme a los Pliegos Técnicos RIC de la SEC."
  }
};

console.log("Total level updates defined:", Object.keys(LEVEL_UPDATES).length);
module.exports = { LEVEL_UPDATES };
